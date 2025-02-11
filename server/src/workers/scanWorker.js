const { spawn } = require('child_process');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

exports.executeScan = async (sessionId, targetUrl) => {
  return new Promise(async (resolve) => {
    logger.info(`🚀 Starting scan for session ${sessionId}`);

    const session = await Session.findOne({ sessionId });

    if (!session) {
      logger.error(`❌ Session ${sessionId} not found.`);
      return resolve();
    }

    const wapitiProcess = spawn('wapiti', ['-u', targetUrl, '-f', 'json']);

    wapitiProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      logger.info(`📤 Wapiti Output [${sessionId}]: ${output}`);

      if (output.includes('?')) {
        session.status = 'waiting_for_input';
        session.expectedInput = output.trim();
        await session.save();
        logger.info(`⏳ Session ${sessionId} is now waiting for input.`);
        return resolve();
      }
    });

    wapitiProcess.on('close', async (code) => {
      session.status = code === 0 ? 'completed' : 'failed';
      await session.save();
      logger.info(`✅ Scan ${sessionId} completed with status: ${session.status}`);
      resolve();
    });
  });
};
