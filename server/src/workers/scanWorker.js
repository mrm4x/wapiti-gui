const { spawn } = require('child_process');
const Session = require('../models/sessionModel');
const logger = require('../utils/logger');

const SCAN_TIMEOUT = parseInt(process.env.SCAN_TIMEOUT, 10) || 86400; // Default: 24h (86.400s)

exports.executeScan = async (sessionId, targetUrl) => {
  return new Promise(async (resolve) => {
    logger.info(`🚀 Starting scan for session ${sessionId}`);

    const session = await Session.findOne({ sessionId });

    if (!session) {
      logger.error(`❌ Session ${sessionId} not found.`);
      return resolve();
    }

    session.status = 'running';
    session.executionTime = null;
    session.scanResults = [];
    await session.save();

    const startTime = Date.now(); // 🔹 Avvia il conteggio del tempo

    const wapitiProcess = spawn('wapiti', ['-u', targetUrl, '-f', 'json']);

    // Timeout per i processi che non vanno in waiting-for-input
    const timeout = setTimeout(async () => {
      if (session.status === 'running') {
        session.status = 'out-of-time';
        session.executionTime = Date.now() - startTime;
        session.errorMessage = 'Timeout exceeded (scan paused for review)';
        await session.save();
        logger.warn(`⏳ Scan ${sessionId} moved to out-of-time after ${SCAN_TIMEOUT} seconds.`);
        resolve();
      }
    }, SCAN_TIMEOUT * 1000);

    let scanResults = [];

    wapitiProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      logger.info(`📤 Wapiti Output [${sessionId}]: ${output}`);

      // Verifica se l'output contiene richieste di input
      if (output.includes('?')) {
        session.status = 'waiting-for-input';
        session.expectedInput = output.trim();
        session.executionTime = Date.now() - startTime;
        await session.save();
        logger.info(`⏳ Session ${sessionId} is now waiting for input.`);
        clearTimeout(timeout);
        return resolve();
      }

      // Prova a interpretare l'output come JSON per estrarre i risultati
      try {
        const parsedData = JSON.parse(output);
        if (parsedData.vulnerabilities) {
          scanResults = parsedData.vulnerabilities.map(vuln => ({
            type: vuln.type || 'Unknown',
            severity: vuln.severity || 'Low',
            url: vuln.url || 'N/A',
            details: vuln.description || 'No details provided'
          }));
        }
      } catch (e) {
        logger.warn(`⚠️ Non è stato possibile interpretare l'output di Wapiti per session ${sessionId}`);
      }
    });

    wapitiProcess.on('close', async (code) => {
      clearTimeout(timeout);
      const executionTime = Date.now() - startTime;
      
      logger.info(`⏱️ Scan execution time for session ${sessionId}: ${executionTime}ms`);
      logger.info(`📊 Scan results for session ${sessionId}: ${JSON.stringify(scanResults, null, 2)}`);
    
      if (session.status !== 'waiting-for-input' && session.status !== 'out-of-time') {
        session.status = code === 0 ? 'completed' : 'failed';
        session.executionTime = executionTime;
        session.scanResults = scanResults;
        await session.save();
        logger.info(`✅ Scan ${sessionId} completed and results saved.`);
      }
      resolve();
    });    
  });
};
