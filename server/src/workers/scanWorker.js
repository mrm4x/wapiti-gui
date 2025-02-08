const { Worker, JobsOptions } = require('bullmq');
const { exec } = require('child_process');
const logger = require('../utils/logger');
const { redisConnection } = require('../config/redisConfig');
const fs = require('fs');
const path = require('path');

logger.info("🔄 Worker is running and listening for Wapiti scan jobs...");

const worker = new Worker(
  'scanQueue',
  async (job) => {
    const targetUrl = job.data.target;
    const outputFile = path.join(__dirname, `../scans/${job.id}.json`);

    logger.info(`🚀 Running Wapiti scan for target: ${targetUrl}`);

    return new Promise((resolve, reject) => {
      // Set a timeout to kill Wapiti if it hangs (e.g., 5 minutes)
      const timeout = setTimeout(() => {
        logger.error(`⏳ Scan timed out for ${targetUrl}, killing process.`);
        reject({ status: 'failed', error: 'Scan timed out' });
      }, 5 * 60 * 1000); // 5 minutes

      // Execute Wapiti scan
      const wapitiProcess = exec(`wapiti -u ${targetUrl} -f json -o ${outputFile}`, (error, stdout, stderr) => {
        clearTimeout(timeout); // Cancel timeout on completion

        if (error) {
          logger.error(`❌ Scan failed for ${targetUrl}: ${error.message}`);
          return reject({ status: 'failed', error: error.message });
        }

        if (!fs.existsSync(outputFile)) {
          logger.error(`❌ Expected output file ${outputFile} not found!`);
          return reject({ status: 'failed', error: 'Output file missing' });
        }

        logger.info(`✅ Scan completed for ${targetUrl}`);
        resolve({
          status: 'completed',
          output: outputFile,
          details: stdout || stderr,
        });
      });

      // Ensure Wapiti exits cleanly in case of an error
      wapitiProcess.on('error', (err) => {
        clearTimeout(timeout);
        logger.error(`🚨 Wapiti process crashed for ${targetUrl}: ${err.message}`);
        reject({ status: 'failed', error: 'Process crash' });
      });
    });
  },
  {
    connection: redisConnection,
    removeOnComplete: true, // Auto-cleanup completed jobs
    removeOnFail: false, // Keep failed jobs for debugging
  }
);

// Handle worker job failures
worker.on('failed', (job, err) => {
  logger.error(`❌ Job ID: ${job.id} failed: ${err.message}`);
});

// Handle job completions
worker.on('completed', (job) => {
  logger.info(`🎉 Job ID: ${job.id} completed successfully.`);
});

module.exports = worker;
