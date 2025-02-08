const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

router.post('/start', scanController.startScan);
router.get('/:id', scanController.getScanResult);

module.exports = router;
