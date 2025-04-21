const mongoose = require('mongoose');
require('../config/mongoConfig'); // 🔹 Importiamo la configurazione di MongoDB
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

/**
 * Validate a new scan request and create the session in MongoDB.
 * @param {string} userId   – MongoDB ObjectId dell'utente che richiede la scansione
 * @param {string} targetUrl – URL da scansionare
 * @returns {string} sessionId appena creato
 */
exports.validateAndEnqueueScan = async (userId, targetUrl) => {
  try {
    // 1️⃣ Assicuriamoci che MongoDB sia connesso prima di continuare
    if (mongoose.connection.readyState !== 1) {
      logger.warn('⏳ Connessione a MongoDB non pronta. Aspetto...');
      await mongoose.connection.asPromise();
      logger.info('✅ Connessione a MongoDB stabilita.');
    }

    // 2️⃣ Verifica formato dell'ObjectId utente
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // 3️⃣ Valida il formato dell'URL
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/;
    if (!urlRegex.test(targetUrl)) {
      throw new Error('Invalid URL format');
    }

    // 4️⃣ Genera un identificativo univoco di sessione
    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5️⃣ Salva lo stato iniziale in MongoDB
    const session = new Session({
      user: new mongoose.Types.ObjectId(userId),
      sessionId,
      targetUrl,
      status: 'pending',
    });

    await session.save();
    logger.info(`✅ Session created: ${sessionId} for user ${userId}`);

    // 6️⃣ Restituisce l'ID della sessione; nessuna operazione su Redis
    return sessionId;
  } catch (error) {
    logger.error(`❌ Error in validateAndEnqueueScan: ${error.message}`);
    throw new Error('Failed to validate scan');
  }
};
