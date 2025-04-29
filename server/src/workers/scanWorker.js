// src/workers/scanWorker.js
// Versione con formato di output dinamico basato sui parametri extra

'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const stripAnsi = require('strip-ansi');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');
const config = require('../config');

require('dotenv').config();

// ▸ Percorsi configurabili via .env
const SCAN_DIR    = config.scanDir          || 'scans';
const LOG_DIR     = config.LOG_DIR          || path.join(__dirname, '../../logs');
const WAPITI_PATH = process.env.WAPITI_PATH || '/usr/bin/wapiti';
const MONGO_URI   = process.env.MONGO_URI   || 'mongodb://localhost:27017/wapiti-db';

// ▸ Accertiamoci che le cartelle esistano
if (!fs.existsSync(SCAN_DIR)) fs.mkdirSync(SCAN_DIR, { recursive: true });
if (!fs.existsSync(LOG_DIR))  fs.mkdirSync(LOG_DIR,  { recursive: true });

// ▸ Connessione a Mongo se il processo non è già connesso
if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI, {})
    .then(() => logger.info('✅ MongoDB connected in Worker'))
    .catch(err => logger.error(`❌ Mongo error (Worker): ${err.message}`));
}

/**
 * Esegue Wapiti su targetUrl e aggiorna la sessione.
 * @param {string} sessionId
 * @param {string} targetUrl
 */
exports.executeScan = (sessionId, targetUrl) => new Promise(async (resolve) => {
  logger.info(`[executeScan] ▶︎ sessionId=${sessionId}`);

  // 1️⃣ Recupero sessione
  const session = await Session.findOne({ sessionId });
  if (!session) {
    logger.error(`[executeScan] Session ${sessionId} not found.`);
    return resolve();
  }

  // 2️⃣ Aggiorna stato a running
  await Session.updateOne({ sessionId }, {
    $set: { status: 'running', executionTime: null, stdoutHistory: [] }
  });

  // 3️⃣ Percorsi file e determinazione formato
  const startTime = Date.now();
  const extraParams = Array.isArray(session.extraParams) ? [...session.extraParams] : [];
  // Trova se l'utente ha specificato '-f' o '--format'
  let format = 'json';
  const idx = extraParams.findIndex(p => p === '-f' || p === '--format');
  if (idx !== -1 && extraParams.length > idx + 1) {
    format = extraParams[idx + 1];
    // Rimuovi i due parametri per evitare duplicati
    extraParams.splice(idx, 2);
  }
  // Estensione del file
  const ext = format.startsWith('.') ? format : `.${format}`;

  const outputFilePath = path.join(SCAN_DIR, `session-${sessionId}${ext}`);
  const logFilePath    = path.join(LOG_DIR,  `session-${sessionId}.log`);
  const logStream      = fs.createWriteStream(logFilePath, { flags: 'a' });

  // 4️⃣ Verifica binario
  if (!fs.existsSync(WAPITI_PATH)) {
    const msg = `[executeScan] Wapiti not found at ${WAPITI_PATH}`;
    logger.error(msg);
    logStream.write(msg + '\n');
    await Session.updateOne({ sessionId }, { $set: { status: 'failed' } });
    logStream.end();
    return resolve();
  }

  // 5️⃣ Costruzione comando e spawn
  const wapitiArgs = [
    ...extraParams,
    '-u', targetUrl,
    '-f', format,
    '-o', outputFilePath
  ];
  logger.info(`[executeScan] Launch: ${WAPITI_PATH} ${wapitiArgs.join(' ')}`);
  logStream.write(`EXEC: ${WAPITI_PATH} ${wapitiArgs.join(' ')}\n`);

  const proc = spawn(WAPITI_PATH, wapitiArgs, { env: { ...process.env, PYTHONWARNINGS: 'ignore' } });

  // Salva il PID (utile per abort)
  if (proc.pid) {
    await Session.updateOne({ sessionId }, { $set: { processPid: proc.pid } }).catch(() => {});
  }

  // 6️⃣ Gestione output stdout
  proc.stdout.on('data', async (data) => {
    const out = stripAnsi(data.toString());
    logStream.write(out + '\n');
    await Session.updateOne({ sessionId }, { $push: { stdoutHistory: out } }).catch(() => {});
  });

  // 6.1️⃣ Cattura errori Wapiti stderr
  proc.stderr.on('data', async (data) => {
    const errLine = stripAnsi(data.toString());
    logStream.write(`[WAPITI ERR] ${errLine}\n`);
    await Session.updateOne({ sessionId }, { $push: { stdoutHistory: `[WAPITI ERR] ${errLine}` } }).catch(() => {});
  });

  // 6.2️⃣ Gestione errori di spawn
  proc.on('error', async (err) => {
    const msg = `[executeScan] PROCESS ERROR: ${err.message}`;
    logger.error(msg);
    logStream.write(msg + '\n');
    await Session.updateOne({ sessionId }, { $set: { status: 'failed', executionError: err.message } }).catch(() => {});
    logStream.end();
    resolve();
  });

  // 7️⃣ Fine processo → aggiorna stato
  proc.on('close', async (code) => {
    await Session.updateOne({ sessionId }, {
      $set: {
        executionTime: Date.now() - startTime,
        outputFile: outputFilePath,
        status: code === 0 ? 'completed' : 'failed'
      }
    }).catch(() => {});

    logStream.end();
    logger.info(`[executeScan] ⏹ sessionId=${sessionId} | exit=${code}`);
    resolve();
  });
});