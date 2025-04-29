const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  text   : { type: String, required: true },
  createdAt : { type: Date, default: Date.now },
  updatedAt : { type: Date, default: Date.now }
});

noteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);
