const BeeQueue = require('bee-queue');
const Redis = require('ioredis');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();
process.env.IS_WORKER = process.env.IS_WORKER || 'false';
logger.info(`🔍 IS_WORKER value after fallback: ${process.env.IS_WORKER}`);

logger.info(`🔧 Initializing Redis connection for Bee-Queue...`);
logger.info(`🔍 IS_WORKER value: ${process.env.IS_WORKER}`); // ✅ Debug per vedere il valore

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
});

redisClient.on('connect', () => {
  logger.info("✅ Redis connected successfully.");
});

redisClient.on('error', (err) => {
  logger.error(`❌ Redis connection error: ${err.message}`);
});

// Determiniamo se il processo attuale è un worker
const isWorkerProcess = process.env.IS_WORKER === 'true';
logger.info(`📌 Worker mode detected: ${isWorkerProcess}`); // ✅ Debug per verifica

const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  removeOnSuccess: true,
  isWorker: isWorkerProcess, // ✅ Controllo dinamico
};

const scanQueue = new BeeQueue('scanQueue', queueOptions);

logger.info(`📌 Redis Queue "scanQueue" initialized with Bee-Queue. Worker mode: ${isWorkerProcess}`);

module.exports = { scanQueue, redisClient };
