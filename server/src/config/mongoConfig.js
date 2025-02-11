const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wapiti-gui';

// Connect to MongoDB without deprecated options
mongoose.connect(MONGO_URI).then(() => {
  logger.info('✅ MongoDB Connected Successfully');
}).catch((err) => {
  logger.error(`❌ MongoDB connection error: ${err.message}`);
  process.exit(1);
});

module.exports = mongoose;
