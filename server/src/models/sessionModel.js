const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  targetUrl: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:\d+)?(\/[^\s]*)?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL`
    }
  },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'waiting', 'waiting-for-input', 'completed', 'failed', 'out-of-time'], 
    default: 'pending' 
  },
  expectedInput: { type: String, default: null }, // Stores pending input request
  outputFile: { type: String, default: null },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  stdoutHistory: { type: [String], default: [] }, // 🔹 Nuovo campo per registrare l'output della scansione
  createdAt: { type: Date, default: Date.now },
});

// Middleware per salvare la cronologia degli stati
sessionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
