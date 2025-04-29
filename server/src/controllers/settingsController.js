// server/src/controllers/settingsController.js
const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, '..', 'settings.json');
const backupDir        = path.join(__dirname, '..', 'settings-backup');

if (!fs.existsSync(settingsFilePath)) {
  // imposta valori di default la prima volta
  fs.writeFileSync(
    settingsFilePath,
    JSON.stringify({
      scanTimeout: 300,
      maxParallelScans: 5
    }, null, 2),
    'utf8'
  );
}

// 🔹 GET /api/settings
const getSettings = (req, res) => {
  try {
    const raw = fs.readFileSync(settingsFilePath, 'utf8');   // leggilo come stringa pura
    const obj = JSON.parse(raw);                             // se non è JSON valido qui lancia errore
    res.json(obj);                                           // invia JSON pulito
  } catch (err) {
    console.error('settings read error', err);
    res.status(500).json({ error: 'Settings read failed' });
  }
};

// 🔹 POST /api/settings
const updateSettings = (req, res) => {
  try {
    const newSettings = req.body;

    // 🔥 Crea una cartella backup se non esiste
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 🔥 Salva il backup del file corrente
    const backupFilePath = path.join(backupDir, `settings-${Date.now()}.backup.json`);
    fs.copyFileSync(settingsFilePath, backupFilePath);

    // 🔥 Scrive il nuovo file
    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf-8');

    res.json({ message: 'Impostazioni aggiornate con successo.' });
  } catch (err) {
    console.error('Errore nell\'aggiornamento delle impostazioni:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento delle impostazioni.' });
  }
};

// ✅ CommonJS Export
module.exports = {
  getSettings,
  updateSettings
};
