const logger = require('../utils/logger');
const { scanQueue } = require('../config/redisConfig');

exports.startScan = async (req, res) => {
  const { target } = req.body;
  if (!target) {
    logger.error('❌ Nessun target fornito');
    return res.status(400).json({ error: 'Target mancante' });
  }

  logger.info(`📌 Richiesta di scansione ricevuta per: ${target}`);

  try {
    // Verifica se Redis è disponibile prima di aggiungere il job
    if (!scanQueue.client.status || scanQueue.client.status !== 'ready') {
      throw new Error('Redis non disponibile');
    }

    const job = await scanQueue.createJob({ target }).save();

    if (!job) {
      throw new Error('❌ Errore: il job non è stato creato');
    }

    logger.info(`✅ Job aggiunto alla coda con ID: ${job.id}`);
    res.json({ message: 'Scansione avviata', scanId: job.id });
  } catch (error) {
    logger.error(`❌ Errore nell'aggiungere il job alla coda: ${error.message}`);
    res.status(500).json({ error: `Errore interno nel server: ${error.message}` });
  }
};

exports.getScanResult = async (req, res) => {
  const { id } = req.params;
  logger.info(`📌 Recupero risultati per scansione ID: ${id}`);

  res.json({
    id,
    status: 'completed',
    vulnerabilities: [
      { type: 'SQL Injection', severity: 'High', url: '/login' },
      { type: 'XSS', severity: 'Medium', url: '/search' },
    ],
  });
};