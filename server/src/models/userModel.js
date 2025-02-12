const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
}, { timestamps: true }); // 🔹 Registra createdAt e updatedAt automaticamente

module.exports = mongoose.model('User', userSchema);
