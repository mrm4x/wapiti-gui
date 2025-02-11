const BeeQueue = require('bee-queue');
const mongoose = require('mongoose');
const { scanQueue } = require('../config/redisConfig');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

logger.info("🔄 Initializing Bee-Queue Worker...");

// Ensure MongoDB is connected before processing jobs
async function ensureMongoConnection() {
  if (mongoose.connection.readyState !== 1) {
    logger.warn("⏳ Waiting for MongoDB connection...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("✅ MongoDB is now connected.");
  }
}

// Create a worker instance
const worker = new BeeQueue('scanQueue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  isWorker: true,
});

// Keep track of paused jobs
let pausedJobs = [];

worker.process(async (job, done) => {
  logger.info(`🚀 Worker started processing job ID: ${job.id}, Session: ${job.data.sessionId}`);

  await ensureMongoConnection();

  const session = await Session.findOne({ sessionId: job.data.sessionId });

  if (!session) {
    logger.error(`❌ Session not found for job ${job.id}`);
    return done(new Error("Session not found"));
  }

  session.status = 'running';
  await session.save();
  logger.info(`✅ Scan started for session ${session.sessionId}`);

  // Simulate scan execution
  let executionTime = 5000 + Math.random() * 5000; // Between 5s and 10s
  setTimeout(async () => {
    if (Math.random() < 0.5) { // Randomly simulate waiting-for-input
      session.status = 'waiting-for-input';
      await session.save();
      pausedJobs.push(job.id);
      logger.warn(`⏸️ Job ${job.id} is paused, waiting for user input.`);
      
      // Resume next job if available
      resumeNextJob();
      return;
    }

    session.status = 'completed';
    await session.save();
    logger.info(`✅ Scan ${session.sessionId} completed`);
    done(null);
  }, executionTime);
});

function resumeNextJob() {
  if (pausedJobs.length > 0) {
    const jobId = pausedJobs.shift();
    logger.info(`▶️ Resuming job ${jobId}`);
    scanQueue.getJob(jobId).then(job => {
      if (job) {
        job.retry(); // Resume the paused job
      } else {
        logger.error(`❌ Job ${jobId} not found in queue.`);
      }
    });
  }
}

worker.on('error', (err) => {
  logger.error(`❌ Worker encountered an error: ${err.message}`);
});

worker.on('stalled', (job) => {
  logger.warn(`⚠️ Job ${job.id} is stalled!`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} failed: ${err.message}`);
});

worker.on('succeeded', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});
