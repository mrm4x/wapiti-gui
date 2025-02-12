require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { spawn } = require('child_process');
const path = require('path');
require('./config/mongoConfig'); // Ensure MongoDB is initialized

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// API Routes
const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api', sessionRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

// Middleware di gestione errori globali
app.use((err, req, res, next) => {
    logger.error(`❌ Errore globale: ${err.message}`);
    res.status(500).json({ error: "Errore interno del server" });
});

// Funzione per avviare il worker con gestione automatica dei crash
function startWorker() {
    logger.info("🔄 Avviando il Worker...");

    const workerProcess = spawn('node', [path.join(__dirname, 'workers', 'workerPool.js')]);

    workerProcess.stdout.on('data', (data) => {
        logger.info(`🛠 Worker Output: ${data}`);
    });

    workerProcess.stderr.on('data', (data) => {
        logger.error(`❌ Worker Error: ${data}`);
    });

    workerProcess.on('close', (code) => {
        logger.warn(`⚠️ Worker process exited with code ${code}. Riavvio in corso...`);
        setTimeout(startWorker, 5000); // Riavvia dopo 5 secondi
    });
}

// Avvio il worker con gestione automatica dei crash
startWorker();

app.listen(PORT, () => {
    logger.info(`Server started at http://0.0.0.0:${PORT}`);
});
