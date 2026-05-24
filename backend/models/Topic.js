import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Topic', topicSchema);
