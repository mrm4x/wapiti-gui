const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware per validare ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  next();
};

// ✅ Rotte protette con JWT
router.post('/users/create', authMiddleware.protect, authMiddleware.authorize(['admin']), userController.createUser);
router.get('/users', authMiddleware.protect, authMiddleware.authorize(['admin']), userController.getAllUsers);
router.get('/users/:id', authMiddleware.protect, validateObjectId, userController.getUserById);
router.put('/users/:id', authMiddleware.protect, validateObjectId, userController.updateUser);
router.delete('/users/:id', authMiddleware.protect, authMiddleware.authorize(['admin']), validateObjectId, userController.deleteUser);

module.exports = router;
