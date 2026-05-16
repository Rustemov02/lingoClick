import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import Sentence from './models/Sentence.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Using 'lingoClick' as requested
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lingoClick';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected to lingoClick'))
  .catch(err => console.error(err));

// --- SENTENCE ROUTES ---

// Get all sentences
app.get('/api/sentences', async (req, res) => {
  try {
    const sentences = await Sentence.find().sort({ createdAt: -1 });
    res.json(sentences);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin adds a new English sentence
app.post('/api/sentences', async (req, res) => {
  try {
    const { text, hints } = req.body;
    const sentence = new Sentence({ text, hints });
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a sentence
app.delete('/api/sentences/:id', async (req, res) => {
  try {
    const sentence = await Sentence.findByIdAndDelete(req.params.id);
    if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
    res.json({ message: 'Sentence deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit a sentence
app.put('/api/sentences/:id', async (req, res) => {
  try {
    const { text, hints } = req.body;
    const sentence = await Sentence.findById(req.params.id);
    
    if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
    
    sentence.text = text;
    if (hints) sentence.hints = hints;
    
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Student submits their Azerbaijani translation
app.put('/api/sentences/:id/translate', async (req, res) => {
  try {
    const { studentTranslation } = req.body;
    const sentence = await Sentence.findById(req.params.id);
    
    if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
    
    sentence.studentTranslation = studentTranslation;
    sentence.status = 'submitted';
    
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin submits a score and comment
app.put('/api/sentences/:id/grade', async (req, res) => {
  try {
    const { grade, teacherComment } = req.body;
    const sentence = await Sentence.findById(req.params.id);
    
    if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
    
    sentence.grade = grade;
    sentence.teacherComment = teacherComment;
    sentence.status = 'graded';
    
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
