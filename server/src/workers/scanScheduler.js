const Session = require('../models/sessionModel');
const dotenv = require('dotenv');
const logger = require('../utils/logger');
const { executeScan } = require('./scanWorker');

dotenv.config();

const WORKER_COUNT = parseInt(process.env.WORKER_COUNT, 10) || 3;

logger.info(`🔄 Scan Scheduler Running | Worker Count: ${WORKER_COUNT}`);

async function processJob(job) {
  try {
    const { sessionId, targetUrl } = job.data;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      logger.warn(`⚠️ Session ${sessionId} not found. Skipping.`);
      return;
    }

    // Se la sessione è 'completed' o 'failed', ignoriamo il job
    if (['completed', 'failed'].includes(session.status)) {
      logger.info(`⏳ Session ${sessionId} is in status ${session.status}. Skipping.`);
      return;
    }

    // Se la sessione era in 'waiting-for-input', la riprendiamo e la mettiamo in 'running'
    if (session.status === 'waiting-for-input' && session.expectedInput) {
      logger.info(`🔄 Resuming session ${sessionId} with user input.`);
      session.status = 'running';
      await session.save();
    }

    logger.info(`🚀 Starting scan for session ${sessionId}`);
    await executeScan(sessionId, targetUrl);
  } catch (error) {
    logger.error(`❌ Error processing job ${job.id}: ${error.message}`);
  }
}

async function startWorker(workerId) {
  scanQueue.process(async (job, done) => {
    logger.info(`🛠 [scanScheduler] Received job: ${JSON.stringify(job.data)}`);
    await processJob(job);
    done();
  });
  logger.info(`👷 Worker ${workerId} started`);
}

for (let i = 1; i <= WORKER_COUNT; i++) {
  startWorker(i);
}

scanQueue.on('error', (err) => {
  logger.error(`❌ Queue Error: ${err.message}`);
});

scanQueue.on('stalled', (job) => {
  logger.warn(`⚠️ Job ${job.id} is stalled! Attempting recovery...`);
});

scanQueue.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`);
});

scanQueue.on('succeeded', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully in queue.`);
});

logger.info("✅ Scan Scheduler is fully operational!");
