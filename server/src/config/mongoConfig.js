const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wapiti-gui';
const MAX_RETRIES = process.env.MONGO_MAX_RETRIES || 5; // Numero massimo di tentativi di connessione
const RETRY_DELAY = process.env.MONGO_RETRY_DELAY || 5000; // Tempo tra un tentativo e l'altro (5 secondi)

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: process.env.MONGO_TIMEOUT || 5000, // Evita connessioni bloccate
      connectTimeoutMS: process.env.MONGO_CONNECT_TIMEOUT || 10000, // Timeout connessione
    });
    logger.info('✅ MongoDB Connected Successfully');
  } catch (err) {
    logger.error(`❌ MongoDB connection error (Attempt ${attempt}): ${err.message}`);

    if (attempt < MAX_RETRIES) {
      logger.warn(`🔄 Ritentando la connessione a MongoDB in ${RETRY_DELAY / 1000} secondi...`);
      setTimeout(() => connectWithRetry(attempt + 1), RETRY_DELAY);
    } else {
      logger.error('❌ Raggiunto il numero massimo di tentativi, terminazione del processo.');
      process.exit(1);
    }
  }
};

connectWithRetry();

module.exports = mongoose;
