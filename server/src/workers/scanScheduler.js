const { QueueScheduler, Worker, Queue } = require('bullmq');
const { redisConnection } = require('../config/redisConfig');
const Session = require('../models/sessionModel');
const dotenv = require('dotenv');

dotenv.config();
const WORKER_COUNT = parseInt(process.env.WORKER_COUNT, 10) || 3;

// Initialize the queue scheduler
const scanQueue = new Queue('scanQueue', { connection: redisConnection });
new QueueScheduler('scanQueue', { connection: redisConnection });

console.log(`🔄 Scan Scheduler Running | Worker Count: ${WORKER_COUNT}`);

for (let i = 0; i < WORKER_COUNT; i++) {
  new Worker('scanQueue', async (job) => {
    const { sessionId, targetUrl } = job.data;

    const session = await Session.findOne({ sessionId });
    if (!session || session.status === 'completed') return;

    if (session.status === 'waiting_for_input') {
      console.log(`⏳ Session ${sessionId} waiting for input. Skipping for now.`);
      return;
    }

    session.status = 'running';
    await session.save();

    return require('./scanWorker').executeScan(sessionId, targetUrl);
  }, { connection: redisConnection });
}
