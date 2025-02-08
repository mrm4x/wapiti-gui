const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const { redisConnection } = require('../config/redisConfig');

logger.info("🔄 Worker is running and listening for jobs...");

const worker = new Worker(
  'scanQueue',
  async (job) => {
    logger.info(`🚀 Processing job ID: ${job.id}, Target: ${job.data.target}`);

    // Simulate scan execution (replace this with actual Wapiti logic)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.info(`✅ Job ID: ${job.id} completed successfully.`);

    return { status: 'completed', vulnerabilities: [] };
  },
  { connection: redisConnection }
);

// Handle worker errors
worker.on('failed', (job, err) => {
  logger.error(`❌ Job ID: ${job.id} failed: ${err.message}`);
});

worker.on('completed', (job) => {
  logger.info(`🎉 Job ID: ${job.id} completed and removed from queue.`);
});

module.exports = worker;
