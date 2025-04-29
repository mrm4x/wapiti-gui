const express       = require('express');
const router        = express.Router();
const noteCtrl      = require('../controllers/noteController');
const { protect }   = require('../middleware/authMiddleware');   // JWT guard

router.use(protect);

/* session-scoped */
router.get ('/sessions/:sessionId/notes',  noteCtrl.getNotesBySession);
router.post('/sessions/:sessionId/notes',  noteCtrl.createNote);

/* single note */
router.put   ('/notes/:noteId',  noteCtrl.updateNote);
router.delete('/notes/:noteId',  noteCtrl.deleteNote);

module.exports = router;
