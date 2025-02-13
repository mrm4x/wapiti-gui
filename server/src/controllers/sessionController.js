const mongoose = require('mongoose');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');
//const { scanQueue } = require('../config/redisConfig');

/**
 * Start a new session and enqueue the scan job.
 */
exports.startSession = async (req, res) => {
  try {
    const { userId, targetUrl } = req.body;

    logger.info(`📌 Received scan request: userId=${userId}, targetUrl=${targetUrl}`);

    if (!mongoose.connection.readyState) {
      throw new Error('MongoDB is not connected');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error(`❌ Invalid userId format: ${userId}`);
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`❌ User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const session = new Session({
      user: new mongoose.Types.ObjectId(userId),
      sessionId,
      targetUrl,
      status: 'pending',
    });

    await session.save();
    logger.info(`✅ Session created in MongoDB: ${sessionId}`);

/*    
    logger.info(`📌 Creating job in Bee-Queue: sessionId=${sessionId}, targetUrl=${targetUrl}`);
    
    const job = scanQueue.createJob({ sessionId, targetUrl });
    job.setId(sessionId);
    job.retries(3);
    job.save().then(savedJob => {
      logger.info(`✅ Job successfully added to Bee-Queue: ID=${savedJob.id}, Data=${JSON.stringify(savedJob.data)}`);
    }).catch(err => {
      logger.error(`❌ Failed to add job to Bee-Queue: ${err.message}`);
    });
*/

    res.json({ message: 'Session started', sessionId });
  } catch (error) {
    logger.error(`❌ Error in startSession: ${error.message}`);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

/**
 * Retrieve session status.
 */
exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error(`❌ Error in getSessionStatus: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List all sessions.
 */
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error) {
    logger.error(`❌ Error in getAllSessions: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Provide user input and resume execution.
 */
exports.provideInput = async (req, res) => {
  try {
    const { sessionId, userInput } = req.body;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'waiting-for-input') {
      return res.status(400).json({ error: 'Session is not waiting for input' });
    }

    session.expectedInput = userInput;
    session.status = 'running';
    
    // 🔹 Memorizza l'input ricevuto dallo user nello stdoutHistory
    session.stdoutHistory.push(`User input received: ${userInput}`);
    
    await session.save();
    logger.info(`✅ Input received for session ${sessionId}, resuming scan`);

/*    
    const job = scanQueue.createJob({ sessionId, userInput });
    job.setId(sessionId);
    job.retries(2);
    await job.save();
*/

    res.json({ message: 'Input received, resuming scan' });
  } catch (error) {
    logger.error(`❌ Error in provideInput: ${error.message}`);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

/**
 * Update the session status
 */
exports.updateSessionStatus = async (req, res) => {
  try {
    const { sessionId, newStatus } = req.body;
    const validStatuses = ['running', 'failed', 'waiting', 'completed', 'waiting-for-input', 'pending', 'out-of-time']; // 🔹 Stati validi

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = newStatus;
    await session.save();
    logger.info(`🔄 Session ${sessionId} status updated to ${newStatus}`);
    res.json({ message: `Session ${sessionId} updated to ${newStatus}` });

  } catch (error) {
    logger.error(`❌ Error updating session status: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Resume paused jobs when user input is received.
 */
exports.resumePausedTasks = async () => {
  try {
    logger.info("🔍 Verifica dei task in attesa di input...");

    const totalWaitingSessions = await Session.countDocuments({ status: "waiting-for-input" });

    if (totalWaitingSessions === 0) {
      logger.info("✅ Nessun task in attesa di input da riprendere.");
      return;
    }

    const waitingSessionsWithInput = await Session.find({ status: "waiting-for-input", expectedInput: { $ne: null } });
    const waitingSessionsWithoutInput = await Session.find({ status: "waiting-for-input", expectedInput: null });

    if (waitingSessionsWithoutInput.length > 0) {
      logger.warn(`⚠️ ${waitingSessionsWithoutInput.length} task sono bloccati in 'waiting-for-input' senza input.`);
      for (let session of waitingSessionsWithoutInput) {
        logger.warn(`⚠️ Sessione bloccata: ${session.sessionId} (nessun input ricevuto)`);
      }
    }

    if (waitingSessionsWithInput.length === 0) {
      logger.info("✅ Nessun task può essere ripreso perché tutti stanno ancora aspettando un input.");
      return;
    }

    logger.info(`🔄 Ripristino di ${waitingSessionsWithInput.length} task in attesa di input con risposta ricevuta.`);

    for (let session of waitingSessionsWithInput) {
      logger.info(`🔄 Riprendendo sessione: ${session.sessionId} con input ricevuto: ${session.expectedInput}`);

      session.status = "running";
      await session.save();

      // Re-add job to the queue
      await scanQueue.add('scanJob', { sessionId: session.sessionId, targetUrl: session.targetUrl });
    }

    logger.info("✅ Tutti i task in attesa di input con risposta ricevuta sono stati ripresi.");
  } catch (error) {
    logger.error(`❌ Errore nel ripristino dei task in attesa di input: ${error.message}`);
  }
};

/**
 * Get sessions by status
 */
exports.getSessionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    // Verifica che lo stato sia valido
    const validStatuses = ['pending', 'running', 'waiting', 'waiting-for-input', 'completed', 'failed', 'out-of-time'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }

    // Recupera le sessioni con lo stato specificato
    const sessions = await Session.find({ status });

    /*
    if (sessions.length === 0) {
      return res.status(404).json({ message: 'Nessuna sessione trovata con questo stato' });
    }
    */

    res.json(sessions);
  } catch (error) {
    logger.error(`❌ Errore nel recupero delle sessioni per stato: ${error.message}`);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

/**
 * Retrieve session stdout history.
 */
exports.getSessionStdoutHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ stdoutHistory: session.stdoutHistory });
  } catch (error) {
    logger.error(`❌ Error retrieving stdout history: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a session by sessionId.
 */
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await Session.deleteOne({ sessionId });

    logger.info(`🗑️ Session ${sessionId} deleted successfully.`);
    res.json({ message: `Session ${sessionId} deleted successfully.` });

  } catch (error) {
    logger.error(`❌ Error deleting session ${req.params.sessionId}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
