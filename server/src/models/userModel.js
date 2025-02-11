const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true, default: () => crypto.randomBytes(16).toString('hex') }, // Generate a secure API key
});

module.exports = mongoose.model('User', userSchema);
