const Session = require('../models/sessionModel');
const { scanQueue } = require('../config/redisConfig');
const logger = require('../utils/logger');

/**
 * Resume paused jobs when user input is received.
 */
exports.resumePausedTasks = async () => {
  const waitingSessions = await Session.find({ status: "waiting_for_input", expectedInput: null });

  for (let session of waitingSessions) {
    logger.info(`🔄 Resuming session: ${session.sessionId}`);

    session.status = "running";
    await session.save();

    // Re-add job to the queue
    await scanQueue.add('scanJob', { sessionId: session.sessionId, targetUrl: session.targetUrl });
  }
};
