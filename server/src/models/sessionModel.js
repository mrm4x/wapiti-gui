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
  processPid: { type: Number, default: null }, // ✅ Salva il PID del processo Wapiti
  logFilePath: { type: String, default: null }, // ✅ Percorso file di log della scansione
  expectedInput: { type: String, default: null }, // ✅ Input richiesto da Wapiti
  outputFile: { type: String, default: null }, // ✅ File JSON di output
  extraParams: { type: [String], default: [] }, // ✅ Parametri extra per Wapiti
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  stdoutHistory: { type: [String], default: [] }, // ✅ Log della scansione
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now } // ✅ Data ultimo aggiornamento
});

// Middleware per salvare la cronologia degli stati e aggiornare updatedAt
sessionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  this.updatedAt = new Date(); // ✅ Aggiorna il timestamp
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
