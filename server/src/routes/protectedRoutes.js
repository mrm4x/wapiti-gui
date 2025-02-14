const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const sessionController = require('../controllers/sessionController');

// ✅ Protegge tutte le API con autenticazione obbligatoria (JWT richiesto)
router.use(protect);

// ✅ API accessibile a tutti gli utenti autenticati
router.get('/sessions', sessionController.getAllSessions);

// ✅ API accessibile solo agli utenti con ruolo "admin"
router.delete('/session/:sessionId', authorize(['admin']), sessionController.deleteSession);

module.exports = router;
