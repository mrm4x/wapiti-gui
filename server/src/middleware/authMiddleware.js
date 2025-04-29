const jwt = require('jsonwebtoken');
const config = require('../config');

const JWT_SECRET = config.jwtSecret || 'supersecretkey';
const JWT_EXPIRES_IN = config.jwtExpiresIn || '1h';

/**
 * Middleware per proteggere le API con JWT
 */
exports.protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Prende il token dalla richiesta

    if (!token) {
        return res.status(401).json({ error: 'Accesso negato, token mancante' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Aggiunge i dati utente alla richiesta
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
};

/**
 * Middleware per autorizzare utenti in base al ruolo
 * @param {Array} roles - Lista dei ruoli autorizzati (es: ['admin', 'user'])
 */
exports.authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accesso negato, permessi insufficienti' });
        }
        next();
    };
};

/**
 * Genera un token JWT per l'utente
 * @param {Object} user - Dati utente da includere nel token
 */
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};
