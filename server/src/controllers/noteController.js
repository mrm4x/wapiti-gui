const Note = require('../models/noteModel');

/* GET /api/sessions/:sessionId/notes */
exports.getNotesBySession = async (req, res) => {
  try {
    const notes = await Note.find({ session: req.params.sessionId })
                            .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: 'DB read error' }); }
};

/* GET /api/notes */
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Errore nel recupero note:', err);
    res.status(500).json({ error: 'Errore recupero note' });
  }
};

/* POST /api/sessions/:sessionId/notes */
exports.createNote = async (req, res) => {
  try {
    const note = await Note.create({
      session: req.params.sessionId,
      text   : req.body.text
    });
    res.status(201).json(note);
  } catch (err) { res.status(400).json({ error: 'DB insert error' }); }
};

/* PUT /api/notes/:noteId */
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      { text: req.body.text, updatedAt: Date.now() },
      { new: true }
    );
    res.json(note);
  } catch (err) { res.status(400).json({ error: 'DB update error' }); }
};

/* DELETE /api/notes/:noteId */
exports.deleteNote = async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.noteId);
    res.json({ message: 'Note deleted' });
  } catch (err) { res.status(400).json({ error: 'DB delete error' }); }
};
