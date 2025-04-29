const cluster = require('cluster');
const os = require('os');
const mongoose = require('mongoose');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');
const config = require('../config');
const { executeScan } = require('./scanWorker');

//const WORKER_COUNT = parseInt(process.env.WORKER_COUNT, 10) || os.cpus().length;
const WORKER_COUNT = parseInt(config.workerCount, 10) || os.cpus().length;
const RETRY_DELAY = 5000; // 5 secondi tra un retry e l'altro

async function ensureMongoConnection() {
    if (mongoose.connection.readyState !== 1) {
        logger.warn("⏳ Waiting for MongoDB connection...");
        await mongoose.connect(process.env.MONGO_URI, {});
        logger.info("✅ MongoDB is now connected.");
    }
}

// Recupera una sessione in stato 'pending' e la blocca per evitare duplicazioni
async function getPendingSession() {
    return await Session.findOneAndUpdate(
        { status: 'pending' },
        { status: 'running' },
        { new: true }
    );
}

// Funzione principale per elaborare le sessioni
async function processNextSession() {
    try {
        await ensureMongoConnection();

        const session = await getPendingSession();

        if (!session) {
            logger.info("⏳ No pending sessions. Worker is idle...");
            setTimeout(processNextSession, 5000);
            return;
        }

        logger.info(`🚀 Worker ${process.pid} processing session ${session.sessionId}`);

        await executeScan(session.sessionId, session.targetUrl);

        const updatedSession = await Session.findOne({ sessionId: session.sessionId });

        if (!updatedSession) {
            logger.error(`❌ Session ${session.sessionId} not found after scan execution.`);
            setTimeout(processNextSession, 1000);
            return;
        }

        if (updatedSession.status === 'running') {
            updatedSession.status = 'completed';
            updatedSession.outputFile = `scans/session-${updatedSession.sessionId}.json`;
            await updatedSession.save();
            logger.info(`✅ Scan ${updatedSession.sessionId} completed`);
        } else {
            logger.warn(`⚠️ Session ${updatedSession.sessionId} ended with status ${updatedSession.status}`);
        }

        setTimeout(processNextSession, 1000);
    } catch (error) {
        logger.error(`❌ Error processing session: ${error.message}`);
        setTimeout(processNextSession, RETRY_DELAY);
    }
}

// 🚀 **Gestione dei Worker in parallelo**
if (cluster.isMaster) {
    logger.info(`🔄 Master process started. Forking ${WORKER_COUNT} workers...`);

    for (let i = 0; i < WORKER_COUNT; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`⚠️ Worker ${worker.process.pid} exited. Restarting...`);
        cluster.fork();
    });

} else {
    logger.info(`🚀 Worker ${process.pid} started.`);
    processNextSession(); // Avvia il worker per processare le sessioni
}

module.exports = { processNextSession };
