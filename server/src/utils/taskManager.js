const mongoose = require('mongoose');
require('../config/mongoConfig'); // 🔹 Importa la configurazione di MongoDB
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

/**
 * Resume paused jobs when user input is received.
 */
exports.resumePausedTasks = async () => {
  try {
    // Verifica se MongoDB è connesso
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⏳ Connessione a MongoDB non pronta. Aspetto...");
      await mongoose.connection.asPromise(); // 🔹 Attende che la connessione sia pronta
      logger.info("✅ Connessione a MongoDB stabilita.");
    }

    logger.info("🔍 Verifica dei task in attesa di input...");

    const totalWaitingSessions = await Session.countDocuments({ status: "waiting-for-input" });

    if (totalWaitingSessions === 0) {
      logger.info("✅ Nessun task in attesa di input da riprendere.");
      return;
    }

    const waitingSessionsWithInput = await Session.find({ status: "waiting-for-input", expectedInput: { $ne: null } });
    const waitingSessionsWithoutInput = await Session.find({ status: "waiting-for-input", expectedInput: null });

    if (waitingSessionsWithoutInput.length > 0) {
      logger.warn(`⚠️ ${waitingSessionsWithoutInput.length} task sono bloccati in 'waiting-for-input' senza input.`);
      for (let session of waitingSessionsWithoutInput) {
        logger.warn(`⚠️ Sessione bloccata: ${session.sessionId} (nessun input ricevuto)`);
      }
    }

    if (waitingSessionsWithInput.length === 0) {
      logger.info("✅ Nessun task può essere ripreso perché tutti stanno ancora aspettando un input.");
      return;
    }

    logger.info(`🔄 Ripristino di ${waitingSessionsWithInput.length} task in attesa di input con risposta ricevuta.`);

    for (let session of waitingSessionsWithInput) {
      logger.info(`🔄 Riprendendo sessione: ${session.sessionId} con input ricevuto: ${session.expectedInput}`);

      session.status = "running";
      await session.save();

    }

    logger.info("✅ Tutti i task in attesa di input con risposta ricevuta sono stati ripresi.");
  } catch (error) {
    logger.error(`❌ Errore nel ripristino dei task in attesa di input: ${error.message}`);
  }
};
