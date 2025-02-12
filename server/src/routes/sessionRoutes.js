const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Routes
router.get('/sessions/status/:status', sessionController.getSessionsByStatus);
router.post('/sessions/start', sessionController.startSession);
router.post('/sessions/provide-input', sessionController.provideInput);
router.get('/sessions/out-of-time', sessionController.getOutOfTimeSessions);
router.post('/sessions/update-status', sessionController.updateSessionStatus);
router.get('/sessions/:sessionId', sessionController.getSessionStatus);
router.get('/sessions', sessionController.getAllSessions);

module.exports = router;
