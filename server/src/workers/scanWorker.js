// src/workers/scanWorker.js
// Versione semplificata e stabile: rimosso il monitoraggio con strace
// e ridotti i log di debugging a quelli essenziali.

'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const stripAnsi = require('strip-ansi');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

require('dotenv').config();

// ▸ Percorsi configurabili via .env
const SCAN_DIR    = process.env.SCAN_DIR    || 'scans';
const LOG_DIR     = path.join(__dirname, '../../logs');
const WAPITI_PATH = process.env.WAPITI_PATH || '/usr/bin/wapiti';
const MONGO_URI   = process.env.MONGO_URI   || 'mongodb://localhost:27017/wapiti-db';

// ▸ Accertiamoci che le cartelle esistano
if (!fs.existsSync(SCAN_DIR)) fs.mkdirSync(SCAN_DIR, { recursive: true });
if (!fs.existsSync(LOG_DIR))  fs.mkdirSync(LOG_DIR, {  recursive: true });

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

  // 3️⃣ Percorsi file
  const startTime      = Date.now();
  const outputFilePath = path.join(SCAN_DIR, `session-${sessionId}.json`);
  const logFilePath    = path.join(LOG_DIR,  `session-${sessionId}.log`);
  const logStream      = fs.createWriteStream(logFilePath, { flags: 'a' });

  // 4️⃣ Verifica binario
  if (!fs.existsSync(WAPITI_PATH)) {
    logger.error(`[executeScan] Wapiti not found at ${WAPITI_PATH}`);
    await Session.updateOne({ sessionId }, { $set: { status: 'failed' } });
    return resolve();
  }

  // 5️⃣ Costruzione comando e spawn
  const extraParams = Array.isArray(session.extraParams) ? session.extraParams : [];
  const wapitiArgs  = ['-u', targetUrl, '-f', 'json', '-o', outputFilePath, ...extraParams];
  logger.info(`[executeScan] Launch: ${WAPITI_PATH} ${wapitiArgs.join(' ')}`);
  logStream.write(`EXEC: ${WAPITI_PATH} ${wapitiArgs.join(' ')}\n`);

  const proc = spawn(WAPITI_PATH, wapitiArgs, { env: { ...process.env, PYTHONWARNINGS: 'ignore' } });

  // Salva il PID (utile per abort)
  if (proc.pid) {
    await Session.updateOne({ sessionId }, { $set: { processPid: proc.pid } }).catch(() => {});
  }

  // 6️⃣ Gestione output
  proc.stdout.on('data', async (data) => {
    const out = stripAnsi(data.toString());
    logStream.write(out + '\n');
    await Session.updateOne({ sessionId }, { $push: { stdoutHistory: out } }).catch(() => {});
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
