import mongoose from 'mongoose';

const hintSchema = new mongoose.Schema({
  word: { type: String, required: true },
  translation: { type: String, required: true },
});

const dialogLineSchema = new mongoose.Schema({
  speaker: { type: String, enum: ['A', 'B'], required: true },
  text: { type: String, required: true },
});

const sentenceSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  type: { type: String, enum: ['sentence', 'dialog'], default: 'sentence' },
  text: { type: String, default: '' },
  dialogLines: [dialogLineSchema],
  hints: [hintSchema],
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded'],
    default: 'pending',
  },
  studentTranslation: { type: String, default: '' },
  grade: { type: Number, default: null },
  teacherComment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Sentence', sentenceSchema);
