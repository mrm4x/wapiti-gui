// server/src/config/index.js
const fs   = require('fs');
const path = require('path');
require('dotenv').config();                    // carica .env

const settingsPath = path.join(__dirname, '..', 'settings.json');

// legge settings.json (con fallback a {} se manca)
let settings = {};
try {
  const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '');
  settings = JSON.parse(raw);
} catch (err) {
  console.warn('⚠️  settings.json non trovato o non valido, uso default.');
}

// oggetto di configurazione finale
const config = {
  /* —— statici da .env —— */
  port:               process.env.PORT || 3000,
  mongoUri:           process.env.MONGO_URI,
  jwtSecret:          process.env.JWT_SECRET,
  jwtExpiresIn:       process.env.JWT_EXPIRES_IN,
  workerCount:        Number(process.env.WORKER_COUNT || 1),
  workerMaxRetries:   Number(process.env.WORKER_MAX_RETRIES || 3),
  workerMaxRestarts:  Number(process.env.MAX_WORKER_RESTART || 5),

  /* —— dinamici da settings.json —— */
  logLevel:           settings.logLevel      ?? 'info',
  scanTimeout:        settings.scanTimeout   ?? 86400,
  scanDir:            settings.scanDir       ?? 'scans',
  logFilePath:        settings.logDir        ?? 'logs',
  wapitiPath:         settings.wapitiPath    ?? '/opt/wapiti3-venv/bin/wapiti',
  useTor:             settings.useTor        ?? false,
  maxParallelScans:   settings.maxParallelScans ?? 5,
  defaultScanDepth:   settings.defaultScanDepth ?? 2,
  /* …aggiungi altri sezione «General» qui… */
};

module.exports = config;
