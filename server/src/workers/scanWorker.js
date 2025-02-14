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

// Assicura che la directory di scansione esista
if (!fs.existsSync(SCAN_DIR)) {
    fs.mkdirSync(SCAN_DIR, { recursive: true });
    logger.info(`📂 Created scans directory: ${SCAN_DIR}`);
}

// Assicura che la directory dei log esista
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    logger.info(`📂 Created logs directory: ${LOG_DIR}`);
}

// Connessione a MongoDB se non è attiva
if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGO_URI, {})
        .then(() => logger.info("✅ MongoDB connected successfully from Worker"))
        .catch(err => logger.error(`❌ MongoDB connection error: ${err.message}`));
}

/**
 * Avvia una scansione con Wapiti
 * @param {string} sessionId - ID della sessione
 * @param {string} targetUrl - URL da scansionare
 */
exports.executeScan = async (sessionId, targetUrl) => {
    return new Promise(async (resolve) => {
        logger.info(`🚀 [executeScan] Starting scan for session ${sessionId}`);

        const session = await Session.findOne({ sessionId });
        if (!session) {
            logger.error(`❌ [executeScan] Session ${sessionId} not found.`);
            return resolve();
        }

        session.status = 'running';
        session.executionTime = null;
        session.stdoutHistory = [];
        await session.save();

        const startTime = Date.now();
        const outputFilePath = path.join(SCAN_DIR, `session-${sessionId}.json`);
        const logFilePath = path.join(LOG_DIR, `session-${sessionId}.log`);
        
        const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        logger.info(`📄 Logging output to ${logFilePath}`);

        if (!fs.existsSync(WAPITI_PATH)) {
            logger.error(`❌ [executeScan] Wapiti not found at ${WAPITI_PATH}`);
            session.status = 'failed';
            await session.save();
            return resolve();
        }

        // Recupera eventuali parametri extra
        const extraParams = session.extraParams && Array.isArray(session.extraParams) ? session.extraParams : [];

        // Costruisce il comando con i parametri opzionali
        const wapitiCmd = ['-u', targetUrl, '-f', 'json', '-o', outputFilePath, ...extraParams];

        logger.info(`🚀 [executeScan] Launching Wapiti with command: ${WAPITI_PATH} ${wapitiCmd.join(' ')}`);
        logStream.write(`🚀 Executing: ${WAPITI_PATH} ${wapitiCmd.join(' ')}\n`);

        // Avvio del processo
        const wapitiProcess = spawn(WAPITI_PATH, wapitiCmd, { shell: true });

        // 🔹 Salva immediatamente il PID nel database
        session.processPid = wapitiProcess.pid;
        await session.save();
        logger.info(`🔹 [executeScan] Wapiti started with PID: ${wapitiProcess.pid}`);

        // 🔹 Scrittura in tempo reale nei log
        wapitiProcess.stdout.on('data', async (data) => {
            const output = stripAnsi(data.toString());
            logStream.write(output);
            logStream.write('\n'); // Aggiunge una nuova riga per leggibilità
            session.stdoutHistory.push(output);
            session.markModified('stdoutHistory');
            await session.save();
        });

        wapitiProcess.stderr.on('data', async (data) => {
            const errorOutput = stripAnsi(data.toString().trim());
            logStream.write(`ERROR: ${errorOutput}\n`);
            logger.error(`❌ [executeScan] ${errorOutput}`);
            session.stdoutHistory.push(`Error: ${errorOutput}`);
            session.status = 'failed';
            await session.save();
        });

        wapitiProcess.on('close', async (code) => {
            logger.info(`🛑 [executeScan] CLOSE EVENT TRIGGERED for session ${sessionId}, exit code: ${code}`);
            session.executionTime = Date.now() - startTime;
            session.outputFile = outputFilePath;
            session.status = code === 0 ? 'completed' : 'failed';
            await session.save();
            logStream.end();
            resolve();
        });

        wapitiProcess.on('exit', async (code, signal) => {
            if (code === 0) {
                logger.info(`✅ [executeScan] Process exited successfully. Code: ${code}`);
            } else {
                logger.warn(`⚠️ [executeScan] Process exited unexpectedly. Code: ${code}, Signal: ${signal}`);
                session.status = 'failed';
                session.errorMessage = `Process exited unexpectedly with code ${code} and signal ${signal}`;
                await session.save();
            }
            logStream.end();
            resolve();
        });
    });
};
