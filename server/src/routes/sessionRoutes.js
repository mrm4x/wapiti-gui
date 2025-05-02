const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Rotte protette con JWT
router.get('/sessions/status/:status', authMiddleware.protect, sessionController.getSessionsByStatus);
router.get('/sessions/active', authMiddleware.protect, sessionController.getActiveSessions);
router.post('/sessions/start', authMiddleware.protect, sessionController.startSession);
router.post('/sessions/provide-input', authMiddleware.protect, sessionController.provideInput);
router.post('/sessions/update-status', authMiddleware.protect, sessionController.updateSessionStatus);
router.get('/sessions/:sessionId/stdout', authMiddleware.protect, sessionController.getSessionStdoutHistory);
router.get('/sessions/:sessionId', authMiddleware.protect, sessionController.getSessionStatus);
router.get('/sessions', authMiddleware.protect, sessionController.getAllSessions);
router.get('/sessions/:sessionId/log', authMiddleware.protect, sessionController.downloadLog);
router.get('/sessions/:sessionId/result', authMiddleware.protect, sessionController.downloadResult);
router.put('/sessions/:sessionId/archive', authMiddleware.protect, sessionController.archiveSession);
router.put('/sessions/:sessionId/restore', authMiddleware.protect, sessionController.restoreSession);
router.get('/sessions/by-objectid/:objectId', authMiddleware.protect, sessionController.getSessionIdFromObjectId);


// 🔥 Solo gli admin possono eliminare una sessione
router.delete('/sessions/:sessionId', authMiddleware.protect, authMiddleware.authorize(['admin']), sessionController.deleteSession);

module.exports = router;
