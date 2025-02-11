const mongoose = require('mongoose');
const User = require('../models/userModel');

/**
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({ username });
    await user.save();

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.error(`❌ Error in createUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(`❌ Error in getAllUsers: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(`❌ Error in getUserById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a user
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated', user: updatedUser });
  } catch (error) {
    console.error(`❌ Error in updateUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(`❌ Error in deleteUser: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};