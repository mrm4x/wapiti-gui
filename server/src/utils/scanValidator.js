const Session = require('../models/sessionModel');
const { scanQueue } = require('../config/redisConfig');
const mongoose = require('mongoose');

/**
 * Validate and enqueue a new scan request.
 */
exports.validateAndEnqueueScan = async (userId, targetUrl) => {
  // Ensure userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format');
  }

  // Generate unique session ID
  const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Store initial session state in MongoDB
  const session = new Session({
    user: new mongoose.Types.ObjectId(userId),
    sessionId,
    targetUrl,
    status: 'pending',
  });

  await session.save();

  // Enqueue the task in Redis
  await scanQueue.add('scanJob', { sessionId, targetUrl });

  return sessionId;
};
