//require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const helmet  = require('helmet');
const logger  = require('./utils/logger');
const { spawn } = require('child_process');
const path    = require('path');
require('./config/mongoConfig');
const config  = require('./config');

const authRoutes      = require('./routes/authRoutes');
const sessionRoutes   = require('./routes/sessionRoutes');
const userRoutes      = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const { protect }     = require('./middleware/authMiddleware');
const settingsRoutes  = require('./routes/settingsRoutes');
const noteRoutes = require('./routes/noteRoutes');


const Session = require('./models/sessionModel');

const MAX_RESTARTS = config.workerMaxRestarts || 5;
const PORT         = config.port || 3000;

// ─── App & Socket.IO Setup ────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' }
});

// Rendo `io` disponibile ai controller tramite req.app.get('io')
app.set('io', io);

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(express.json());

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', sessionRoutes);
app.use('/api', userRoutes);
app.use('/api', settingsRoutes);
app.use('/api', noteRoutes);
app.use('/api', protect, protectedRoutes);

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`❌ Errore globale: ${err.message}`);
  res.status(500).json({ error: "Errore interno del server" });
});

// ─── MongoDB Change Stream ─────────────────────────────────────────────────────
const changeStream = Session.watch([], { fullDocument: 'updateLookup' });
changeStream.on('change', change => {
  switch (change.operationType) {
    case 'update': {
      const doc = change.fullDocument;
      io.emit('sessionUpdated', {
        sessionId: doc.sessionId,
        status:    doc.status
      });
      break;
    }
    case 'insert': {
      const doc = change.fullDocument;
      io.emit('sessionCreated', {
        sessionId: doc.sessionId
      });
      break;
    }
    case 'delete': {
      const deletedId = change.documentKey._id;
      io.emit('sessionDeleted', {
        sessionId: deletedId
      });
      break;
    }
    default:
      break;
  }
});

// ─── Worker Pool ────────────────────────────────────────────────────────────────
let restartCount = 0;
function startWorker() {
  if (restartCount >= MAX_RESTARTS) {
    logger.error("❌ Worker ha superato il limite di riavvii, fermando il tentativo di restart.");
    return;
  }

  logger.info("🔄 Avviando il Worker...");
  const workerProcess = spawn('node', [path.join(__dirname, 'workers', 'workerPool.js')]);

  workerProcess.stdout.on('data', data => {
    logger.info(`🛠 Worker Output: ${data}`);
  });

  workerProcess.stderr.on('data', data => {
    logger.error(`❌ Worker Error: ${data}`);
  });

  workerProcess.on('close', code => {
    logger.warn(`⚠️ Worker process exited with code ${code}. Riavvio in corso...`);
    restartCount++;
    setTimeout(startWorker, 5000);
  });
}
startWorker();

// ─── Avvio Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 Server started at http://0.0.0.0:${PORT}`);
});
