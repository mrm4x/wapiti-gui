const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController'); // ✅ Ensure correct import

// Routes
router.post('/sessions/start', sessionController.startSession);
router.get('/sessions/:sessionId', sessionController.getSessionStatus);
router.get('/sessions', sessionController.getAllSessions); // ✅ This must be correctly defined
router.post('/sessions/provide-input', sessionController.provideInput);

module.exports = router;
