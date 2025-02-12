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
  expectedInput: { type: String, default: null },
  outputFile: { type: String, default: null },
  executionTime: { type: Number, default: 0 }, // 🔹 Ora il valore è sempre presente
  scanResults: [{
    type: { type: String, default: "Unknown" },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: "Low" },
    url: { type: String, default: "N/A" },
    details: { type: String, default: "No details provided" }
  }],
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

// Middleware per salvare la cronologia degli stati e il tempo di esecuzione
sessionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });

    if (this.status === 'running') {
      this.startTime = Date.now(); // 🔹 Salva l'inizio della scansione
    }

    if (this.status === 'completed' || this.status === 'failed') {
      this.executionTime = Date.now() - this.startTime; // 🔹 Calcola il tempo di esecuzione
    }
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
