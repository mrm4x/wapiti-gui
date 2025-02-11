const mongoose = require('mongoose');
const BeeQueue = require('bee-queue');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

logger.info("🔧 Initializing Redis connection for Bee-Queue...");

const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  removeOnSuccess: true,
  isWorker: true,
};

const scanQueue = new BeeQueue('scanQueue', queueOptions);

logger.info(`📌 Redis Queue "scanQueue" initialized with Bee-Queue.`);

// Ensure MongoDB is connected before processing jobs
mongoose.connection.once('open', () => {
  logger.info("✅ MongoDB Connection Established.");
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB Connection Error: ${err.message}`);
});

module.exports = { scanQueue };
