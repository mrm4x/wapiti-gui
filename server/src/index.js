require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { scanQueue } = require('./config/redisConfig');
require('./workers/scanWorker'); // 🔥 Automatically start the worker!

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// API Routes
const scanRoutes = require('./routes/scanRoutes');
app.use('/api/scans', scanRoutes);

app.listen(PORT, () => {
  logger.info(`Server started at http://0.0.0.0:${PORT}`);
});
