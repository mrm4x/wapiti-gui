require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { scanQueue } = require('./config/redisConfig');
const { spawn } = require('child_process');
const path = require('path');
require('./workers/scanWorker'); // 🔥 Automatically start the worker!
require('./config/mongoConfig'); // Ensure MongoDB is initialized

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// API Routes
const scanRoutes = require('./routes/scanRoutes');
app.use('/api/scans', scanRoutes);

const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api', sessionRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

logger.info("🔄 Starting Worker Automatically...");

// Start the worker process
const workerProcess = spawn('node', [path.join(__dirname, 'workers', 'workerPool.js')]);

workerProcess.stdout.on('data', (data) => {
  logger.info(`🛠 Worker Output: ${data}`);
});

workerProcess.stderr.on('data', (data) => {
  logger.error(`❌ Worker Error: ${data}`);
});

workerProcess.on('close', (code) => {
  logger.warn(`⚠️ Worker process exited with code ${code}`);
});

app.listen(PORT, () => {
  logger.info(`Server started at http://0.0.0.0:${PORT}`);
});