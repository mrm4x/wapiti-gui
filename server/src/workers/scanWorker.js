const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const stripAnsi = require('strip-ansi');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

require('dotenv').config();

const SCAN_DIR = process.env.SCAN_DIR || 'scans';
const LOG_DIR = path.join(__dirname, '../../logs');
const WAPITI_PATH = '/usr/bin/wapiti';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wapiti-db';

if (!fs.existsSync(SCAN_DIR)) {
    fs.mkdirSync(SCAN_DIR, { recursive: true });
    logger.info(`📂 Created scans directory: ${SCAN_DIR}`);
}

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    logger.info(`📂 Created logs directory: ${LOG_DIR}`);
}

if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGO_URI, {})
        .then(() => logger.info("✅ MongoDB connected successfully from Worker"))
        .catch(err => logger.error(`❌ MongoDB connection error: ${err.message}`));
}

exports.executeScan = async (sessionId, targetUrl) => {
    return new Promise(async (resolve) => {
        logger.info(`🚀 [executeScan] Starting scan for session ${sessionId}`);

        const session = await Session.findOne({ sessionId });
        if (!session) {
            logger.error(`❌ [executeScan] Session ${sessionId} not found.`);
            return resolve();
        }

        // ✅ Aggiorna lo stato iniziale senza usare `save()`
        await Session.updateOne({ sessionId }, { $set: { status: 'running', executionTime: null, stdoutHistory: [] } });

        const startTime = Date.now();
        const outputFilePath = path.join(SCAN_DIR, `session-${sessionId}.json`);
        const logFilePath = path.join(LOG_DIR, `session-${sessionId}.log`);
        
        const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        logger.info(`📄 Logging output to ${logFilePath}`);

        if (!fs.existsSync(WAPITI_PATH)) {
            logger.error(`❌ [executeScan] Wapiti not found at ${WAPITI_PATH}`);
            await Session.updateOne({ sessionId }, { $set: { status: 'failed' } });
            return resolve();
        }

        const extraParams = session.extraParams && Array.isArray(session.extraParams) ? session.extraParams : [];
        const wapitiCmd = ['-u', targetUrl, '-f', 'json', '-o', outputFilePath, ...extraParams];

        logger.info(`🚀 [executeScan] Launching Wapiti with command: ${WAPITI_PATH} ${wapitiCmd.join(' ')}`);
        logStream.write(`🚀 Executing: ${WAPITI_PATH} ${wapitiCmd.join(' ')}\n`);

        const wapitiProcess = spawn(WAPITI_PATH, wapitiCmd, {
            shell: true,
            env: { ...process.env, PYTHONWARNINGS: "ignore" }
        });

        wapitiProcess.stdout.setEncoding('utf8');
        
        wapitiProcess.stdout.on('data', async (data) => {
            const output = stripAnsi(data.toString());
            console.log(`STDOUT: ${output}`);
            logStream.write(output + '\n');

            try {
                await Session.updateOne({ sessionId }, { $push: { stdoutHistory: output } });
            } catch (err) {
                logger.warn(`⚠️ ParallelSaveError (stdout update). Ritentando...`);
                setTimeout(async () => {
                    await Session.updateOne({ sessionId }, { $push: { stdoutHistory: output } });
                }, 500);
            }
        });

        wapitiProcess.stderr.on('data', async (data) => {
            const errorOutput = stripAnsi(data.toString().trim());
            logStream.write(`STDERR: ${errorOutput}\n`);
            logger.warn(`⚠️ [executeScan] ${errorOutput}`);
        });

        wapitiProcess.on('error', (err) => {
            logger.error(`❌ [executeScan] Process Error: ${err.message}`);
        });

        wapitiProcess.on('close', async (code) => {
            logger.info(`🛑 [executeScan] CLOSE EVENT TRIGGERED for session ${sessionId}, exit code: ${code}`);

            try {
                await Session.updateOne({ sessionId }, {
                    $set: {
                        executionTime: Date.now() - startTime,
                        outputFile: outputFilePath,
                        status: code === 0 ? 'completed' : 'failed'
                    }
                });
            } catch (err) {
                logger.warn(`⚠️ ParallelSaveError (final update). Ritentando...`);
                setTimeout(async () => {
                    await Session.updateOne({ sessionId }, {
                        $set: {
                            executionTime: Date.now() - startTime,
                            outputFile: outputFilePath,
                            status: code === 0 ? 'completed' : 'failed'
                        }
                    });
                }, 500);
            }

            logStream.end();
            resolve();
        });
    });
};
