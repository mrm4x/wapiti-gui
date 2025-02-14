const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const logger = require('../utils/logger');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d'; // Token valido per 1 giorno

/**
 * Registra un nuovo utente
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // ✅ Controllo che tutti i dati necessari siano presenti
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email e password sono richiesti' });
    }

    // ✅ Controllo se l'username o l'email sono già in uso
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username o email già in uso' });
    }

    // ✅ Creazione dell'utente con username, email e password
    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: 'Utente registrato con successo' });
  } catch (error) {
    logger.error(`❌ Error in register: ${error.message}`);
    res.status(500).json({ error: 'Errore del server' });
  }
};


/**
 * Effettua il login e genera il token JWT
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' }); // Manteniamo il messaggio generico
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Genera il token JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.json({ token, role: user.role });
  } catch (error) {
    logger.error(`❌ Error in login: ${error.message}`);
    res.status(500).json({ error: 'Errore del server' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error(`❌ Error fetching user profile: ${error.message}`);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};


