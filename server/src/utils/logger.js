const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config();

// Legge il percorso della cartella dei log da .env, default "logs"
const LOG_DIR = process.env.LOG_DIR || 'logs';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
  new DailyRotateFile({
    filename: `${LOG_DIR}/%DATE%-server.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }),
  new winston.transports.File({
    filename: `${LOG_DIR}/error.log`,
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports,
  exitOnError: false,
});

// Gestione errori nel sistema di logging
logger.on('error', (err) => {
  console.error(`❌ Errore nel sistema di logging: ${err.message}`);
});

module.exports = logger;