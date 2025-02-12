const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const userController = require('../controllers/userController');

// Middleware per validare ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  next();
};

router.post('/users/create', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/users/:id', validateObjectId, userController.getUserById);
router.put('/users/:id', validateObjectId, userController.updateUser);
router.delete('/users/:id', validateObjectId, userController.deleteUser);

module.exports = router;
