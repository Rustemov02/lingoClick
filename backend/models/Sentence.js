import mongoose from 'mongoose';

const hintSchema = new mongoose.Schema({
  word: { type: String, required: true },
  translation: { type: String, required: true }
});

const sentenceSchema = new mongoose.Schema({
  text: { type: String, required: true },
  hints: [hintSchema],
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'graded'], 
    default: 'pending' 
  },
  studentTranslation: { type: String, default: "" },
  grade: { type: Number, default: null },
  teacherComment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Sentence', sentenceSchema);
