const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Routes
router.get('/sessions/status/:status', sessionController.getSessionsByStatus);
router.post('/sessions/start', sessionController.startSession);
router.post('/sessions/provide-input', sessionController.provideInput);
router.post('/sessions/update-status', sessionController.updateSessionStatus);
router.get('/sessions/:sessionId/stdout', sessionController.getSessionStdoutHistory);
router.get('/sessions/:sessionId', sessionController.getSessionStatus);
router.get('/sessions', sessionController.getAllSessions);
router.delete('/sessions/:sessionId', sessionController.deleteSession);

module.exports = router;
