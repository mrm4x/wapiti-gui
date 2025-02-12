const { scanQueue } = require('../config/redisConfig');
const logger = require('../utils/logger');

logger.info("🔄 Manual Worker started...");

async function processJob(job) {
  try {
    logger.info(`🚀 Processing job ID: ${job.id}`);

    // Verifica che il job abbia dati validi
    if (!job.data || !job.data.sessionId || !job.data.targetUrl) {
      throw new Error("Invalid job data format.");
    }

    logger.info(`📌 Job Data: ${JSON.stringify(job.data)}`);

    // Simulazione elaborazione
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simula lavoro di 3 secondi

    logger.info(`✅ Job ${job.id} completed successfully.`);
    return { success: true };
  } catch (error) {
    logger.error(`❌ Error processing job ${job.id}: ${error.message}`);
    throw error;
  }
}

// Avvia il worker manuale su `bee-queue`
scanQueue.process(async (job, done) => {
  await processJob(job);
  done();
});

// Gestione eventi del worker
scanQueue.on('error', (err) => {
  logger.error(`❌ Worker encountered an error: ${err.message}`);
});

scanQueue.on('stalled', (job) => {
  logger.warn(`⚠️ Job ${job.id} is stalled!`);
});

scanQueue.on('failed', async (job, err) => {
  logger.error(`❌ Job ${job.id} failed: ${err.message}`);
});

scanQueue.on('succeeded', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

logger.info("✅ Manual Worker is fully operational!");