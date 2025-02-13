const mongoose = require('mongoose');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');
const { executeScan } = require('./scanWorker');

logger.info("🔄 Initializing MongoDB-based Worker...");

// Configurazione dei parametri dal file .env
const WORKER_COUNT = parseInt(process.env.WORKER_COUNT, 10) || 1;
const MAX_RETRIES = parseInt(process.env.WORKER_MAX_RETRIES, 10) || 3;
const RETRY_DELAY = 5000; // 5 secondi tra un retry e l'altro

async function ensureMongoConnection() {
    if (mongoose.connection.readyState !== 1) {
        logger.warn("⏳ Waiting for MongoDB connection...");
        await mongoose.connect(process.env.MONGO_URI, {});
        logger.info("✅ MongoDB is now connected.");
    }
}

// Funzione per recuperare una sessione in attesa di elaborazione
async function getPendingSession() {
    return await Session.findOneAndUpdate(
        { status: 'pending' },
        { status: 'running' },
        { new: true }
    );
}

// Funzione principale del worker
async function processNextSession() {
    await ensureMongoConnection();

    const session = await getPendingSession();

    if (!session) {
        logger.info("⏳ No pending sessions. Worker is idle...");
        setTimeout(processNextSession, 5000);
        return;
    }

    logger.info(`🚀 Processing session ${session.sessionId} for target ${session.targetUrl}`);

    try {
        await executeScan(session.sessionId, session.targetUrl);

        // Una volta terminata la scansione, aggiorniamo lo stato correttamente
        const updatedSession = await Session.findOne({ sessionId: session.sessionId });

        if (!updatedSession) {
            logger.error(`❌ Session ${session.sessionId} not found after scan execution.`);
            setTimeout(processNextSession, 1000);
            return;
        }

        // Se la sessione era ancora in esecuzione e non ha richiesto input, la impostiamo su "completed"
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
        logger.error(`❌ Error processing session ${session.sessionId}: ${error.message}`);

        session.status = 'failed';
        await session.save();

        setTimeout(processNextSession, RETRY_DELAY);
    }
}

// Avvia il worker
processNextSession();

module.exports = { processNextSession };
