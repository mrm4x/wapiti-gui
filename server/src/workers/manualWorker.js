const IORedis = require('ioredis');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const redisClient = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || null,
});

async function processJob() {
  while (true) {
    const jobId = await redisClient.lpop('bull:scanQueue:wait'); // Fetch first job

    if (!jobId) {
      logger.info('🔄 No jobs to process, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
      continue;
    }

    logger.info(`🚀 Processing job ID: ${jobId}`);

    const jobData = await redisClient.hgetall(`bull:scanQueue:${jobId}`);

    if (!jobData || Object.keys(jobData).length === 0) {
      logger.error(`❌ No job metadata found for job ID: ${jobId}`);
      continue;
    }

    logger.info(`📌 Job Data: ${JSON.stringify(jobData)}`);

    // Simulate Job Processing
    logger.info(`✅ Job ${jobId} completed successfully.`);
  }
}

processJob();
