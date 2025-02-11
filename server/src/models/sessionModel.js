const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  targetUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'running', 'waiting', 'completed', 'failed'], default: 'pending' },
  expectedInput: { type: String, default: null }, // Stores pending input request
  outputFile: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
