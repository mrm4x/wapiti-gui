const mongoose = require('mongoose');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');
const { scanQueue } = require('../config/redisConfig');
const logger = require('../utils/logger');

/**
 * Start a new session and enqueue the scan job.
 */
exports.startSession = async (req, res) => {
  try {
    const { userId, targetUrl } = req.body;

    logger.info(`📌 Received scan request: userId=${userId}, targetUrl=${targetUrl}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error(`❌ Invalid userId format: ${userId}`);
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`❌ User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const session = new Session({
      user: new mongoose.Types.ObjectId(userId),
      sessionId,
      targetUrl,
      status: 'pending',
    });

    await session.save();
    logger.info(`✅ Session created in MongoDB: ${sessionId}`);

    logger.info(`📌 Creating job in Bee-Queue: sessionId=${sessionId}, targetUrl=${targetUrl}`);

    // Add job to Bee-Queue
    const job = scanQueue.createJob({ sessionId, targetUrl });

    // Ensure jobs stay in the queue until processed
    job.setId(sessionId);
    job.retries(3);
    job.save((err, savedJob) => {
      if (err) {
        logger.error(`❌ Failed to add job to Bee-Queue: ${err.message}`);
      } else {
        logger.info(`✅ Job successfully added to Bee-Queue: ID=${savedJob.id}, Data=${JSON.stringify(savedJob.data)}`);
      }
    });

    res.json({ message: 'Session started', sessionId });
  } catch (error) {
    logger.error(`❌ Error in startSession: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieve session status.
 */
exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error(`❌ Error in getSessionStatus: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List all sessions.
 */
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    logger.error(`❌ Error in getAllSessions: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Provide user input and resume execution.
 */
exports.provideInput = async (req, res) => {
  try {
    const { sessionId, userInput } = req.body;
    const session = await Session.findOne({ sessionId });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.status !== 'waiting_for_input') {
      return res.status(400).json({ error: 'Session is not waiting for input' });
    }

    session.expectedInput = userInput;
    session.status = 'running';
    await session.save();

    res.json({ message: 'Input received, resuming scan' });
  } catch (error) {
    logger.error(`❌ Error in provideInput: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
