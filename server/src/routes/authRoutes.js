const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Rotte pubbliche (registrazione e login)
router.post('/register', authController.register);
router.post('/login', authController.login);

// ✅ Rotta per verificare il token e ottenere i dati dell'utente autenticato
router.get('/me', authMiddleware.protect, authController.getProfile);

module.exports = router;
