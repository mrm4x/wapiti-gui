const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wapiti-db";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connessione a MongoDB riuscita!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Errore di connessione a MongoDB:", err);
    process.exit(1);
  });
