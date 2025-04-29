// server/src/routes/settingsRoutes.js
const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/settings', authMiddleware.protect, getSettings);
router.post('/settings', authMiddleware.protect, updateSettings);

module.exports = router;
