const mongoose = require('mongoose');
require('../config/mongoConfig'); // 🔹 Importiamo la configurazione di MongoDB
const Session = require('../models/sessionModel');
const { scanQueue } = require('../config/redisConfig'); // 🔹 Assicuriamoci di importare correttamente scanQueue
const logger = require('../utils/logger');

/**
 * Validate and enqueue a new scan request.
 */
exports.validateAndEnqueueScan = async (userId, targetUrl) => {
  try {
    // Assicuriamoci che MongoDB sia connesso prima di continuare
    if (mongoose.connection.readyState !== 1) {
      logger.warn("⏳ Connessione a MongoDB non pronta. Aspetto...");
      await mongoose.connection.asPromise();
      logger.info("✅ Connessione a MongoDB stabilita.");
    }

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Validate URL format
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/;
    if (!urlRegex.test(targetUrl)) {
      throw new Error('Invalid URL format');
    }

    // Generate unique session ID
    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Store initial session state in MongoDB
    const session = new Session({
      user: new mongoose.Types.ObjectId(userId),
      sessionId,
      targetUrl,
      status: 'pending',
    });

    await session.save();
    logger.info(`✅ Session created: ${sessionId} for user ${userId}`);

    // Assicuriamoci che la coda sia pronta prima di aggiungere il job
    await scanQueue.ready();
    logger.info("✅ Bee-Queue è pronto.");

    // Verifica se scanQueue è definito prima di chiamare add()
    if (!scanQueue || typeof scanQueue.createJob !== 'function') {
      throw new Error("❌ scanQueue non è stato inizializzato correttamente.");
    }

    // Enqueue the task in Redis
    await scanQueue.createJob({ sessionId, targetUrl }).save();
    logger.info(`📌 Job added to queue: ${sessionId}`);

    return sessionId;
  } catch (error) {
    logger.error(`❌ Error in validateAndEnqueueScan: ${error.message}`);
    throw new Error('Failed to validate and enqueue scan');
  }
};
