const { Queue } = require('bullmq');
const Redis = require('ioredis');
require('dotenv').config();

// Create Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,  // Required for BullMQ 5.x
  enableReadyCheck: false,     // Prevents connection issues
});

// Create the scan queue
const scanQueue = new Queue('scanQueue', { connection: redisConnection });

module.exports = { scanQueue, redisConnection };
