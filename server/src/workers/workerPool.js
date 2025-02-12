const BeeQueue = require('bee-queue');
const mongoose = require('mongoose');
const { scanQueue, redisClient } = require('../config/redisConfig');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

logger.info("🔄 Initializing Bee-Queue Worker...");

// Configurazione numero worker da .env
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

async function addPausedJob(jobId) {
  try {
    await redisClient.sadd('pausedJobs', jobId);
    logger.info(`🔹 Job ${jobId} added to paused jobs list.`);
  } catch (err) {
    logger.error(`❌ Error adding job ${jobId} to paused jobs: ${err.message}`);
  }
}

async function getPausedJobs() {
  try {
    return await redisClient.smembers('pausedJobs');
  } catch (err) {
    logger.error(`❌ Error retrieving paused jobs: ${err.message}`);
    return [];
  }
}

async function resumeNextJob() {
  const jobIds = await getPausedJobs();
  if (jobIds.length > 0) {
    const jobId = jobIds.shift();
    logger.info(`▶️ Attempting to resume job ${jobId}`);

    scanQueue.getJob(jobId).then(async (job) => {
      if (job) {
        await redisClient.srem('pausedJobs', jobId);
        await job.retry();
        logger.info(`✅ Job ${jobId} resumed successfully.`);
      } else {
        logger.error(`❌ Job ${jobId} not found in queue.`);
      }
    }).catch(err => {
      logger.error(`❌ Error resuming job ${jobId}: ${err.message}`);
    });
  }
}

scanQueue.process(WORKER_COUNT, async (job, done) => {
  try {
    logger.info(`🚀 Worker processing job ID: ${job.id}, Session: ${job.data.sessionId}`);
    await ensureMongoConnection();

    const session = await Session.findOne({ sessionId: job.data.sessionId });

    if (!session) {
      logger.error(`❌ Session not found for job ${job.id}`);
      return done(new Error("Session not found"));
    }

    session.status = 'running';
    await session.save();
    logger.info(`✅ Scan started for session ${session.sessionId}`);

    let executionTime = 5000 + Math.random() * 5000;
    
    setTimeout(async () => {
      if (Math.random() < 0.5) {
        session.status = 'waiting-for-input';
        await session.save();
        await addPausedJob(job.id);
        logger.warn(`⏸️ Job ${job.id} is paused, waiting for user input.`);
        resumeNextJob();
        return;
      }

      session.status = 'completed';
      await session.save();
      logger.info(`✅ Scan ${session.sessionId} completed`);
      done(null);
    }, executionTime);
  } catch (error) {
    logger.error(`❌ Error processing job ${job.id}: ${error.message}`);
    done(new Error(`Processing failed: ${error.message}`));
  }
});

scanQueue.on('error', (err) => {
  logger.error(`❌ Worker encountered an error: ${err.message}`);
});

scanQueue.on('stalled', (job) => {
  logger.warn(`⚠️ Job ${job.id} is stalled!`);
});

scanQueue.on('failed', async (job, err) => {
  logger.error(`❌ Job ${job.id} failed: ${err.message}`);

  if (job.options.attemptsMade < MAX_RETRIES) {
    logger.warn(`🔄 Retrying job ${job.id} in ${RETRY_DELAY / 1000}s...`);
    setTimeout(async () => {
      await job.retry();
      logger.info(`✅ Job ${job.id} retry attempt made.`);
    }, RETRY_DELAY);
  } else {
    logger.error(`❌ Job ${job.id} reached max retry limit.`);
  }
});

scanQueue.on('succeeded', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

// Esportiamo la funzione per poterla usare dall'esterno
module.exports = { resumeNextJob };
