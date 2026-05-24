import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import Sentence from "./models/Sentence.js";
import Topic from "./models/Topic.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Using 'lingoClick' as requested
const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/lingoClick";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB Connected to lingoClick"))
  .catch((err) => console.error(err));

// --- TOPIC ROUTES ---

app.get("/api/topics", async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: 1 });
    const counts = await Sentence.aggregate([
      { $group: { _id: "$topicId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      counts.map((c) => [c._id?.toString() ?? "none", c.count])
    );
    const result = topics.map((t) => ({
      ...t.toObject(),
      exerciseCount: countMap[t._id.toString()] || 0,
    }));
    const uncategorized = countMap["none"] || 0;
    res.json({ topics: result, uncategorizedCount: uncategorized });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/topics", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    const topic = new Topic({ title: title.trim() });
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/topics/:id", async (req, res) => {
  try {
    const { title } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    if (title?.trim()) topic.title = title.trim();
    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    await Sentence.deleteMany({ topicId: req.params.id });
    res.json({ message: "Topic and exercises deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- SENTENCE / EXERCISE ROUTES ---

function buildSentenceFilter(query) {
  const filter = {};
  if (query.topicId === "uncategorized") filter.topicId = null;
  else if (query.topicId) filter.topicId = query.topicId;
  return filter;
}

app.get("/api/sentences", async (req, res) => {
  try {
    const sentences = await Sentence.find(buildSentenceFilter(req.query)).sort({
      createdAt: -1,
    });
    res.json(sentences);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/sentences", async (req, res) => {
  try {
    const { topicId, type, text, dialogLines, hints } = req.body;
    const exerciseType = type === "dialog" ? "dialog" : "sentence";

    if (exerciseType === "dialog") {
      const lines = (dialogLines || []).filter((l) => l.text?.trim());
      if (lines.length === 0)
        return res.status(400).json({ error: "Dialog needs at least one line" });
    } else if (!text?.trim()) {
      return res.status(400).json({ error: "Sentence text is required" });
    }

    const sentence = new Sentence({
      topicId: topicId || null,
      type: exerciseType,
      text: text?.trim() || "",
      dialogLines:
        exerciseType === "dialog"
          ? dialogLines.filter((l) => l.text?.trim())
          : [],
      hints: hints || [],
    });
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a sentence
app.delete("/api/sentences/:id", async (req, res) => {
  try {
    const sentence = await Sentence.findByIdAndDelete(req.params.id);
    if (!sentence) return res.status(404).json({ error: "Sentence not found" });
    res.json({ message: "Sentence deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Edit a sentence or dialog
app.put("/api/sentences/:id", async (req, res) => {
  try {
    const { text, hints, dialogLines, type } = req.body;
    const sentence = await Sentence.findById(req.params.id);

    if (!sentence) return res.status(404).json({ error: "Sentence not found" });

    if (type) sentence.type = type === "dialog" ? "dialog" : "sentence";
    if (text !== undefined) sentence.text = text;
    if (hints !== undefined) sentence.hints = hints;
    if (dialogLines !== undefined) {
      sentence.dialogLines = dialogLines.filter((l) => l.text?.trim());
    }

    if (sentence.type === "sentence" && !sentence.text?.trim()) {
      return res.status(400).json({ error: "Sentence text is required" });
    }
    if (sentence.type === "dialog" && sentence.dialogLines.length === 0) {
      return res.status(400).json({ error: "Dialog needs at least one line" });
    }

    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student submits their Azerbaijani translation
app.put("/api/sentences/:id/translate", async (req, res) => {
  try {
    const { studentTranslation } = req.body;
    const sentence = await Sentence.findById(req.params.id);

    if (!sentence) return res.status(404).json({ error: "Sentence not found" });

    sentence.studentTranslation = studentTranslation;
    sentence.status = "submitted";

    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student edits their translation (only if not graded)
app.put("/api/sentences/:id/translate/edit", async (req, res) => {
  try {
    const { studentTranslation } = req.body;
    const sentence = await Sentence.findById(req.params.id);
    if (!sentence) return res.status(404).json({ error: "Sentence not found" });
    if (sentence.status === "graded")
      return res.status(400).json({ error: "Cannot edit after grading" });
    sentence.studentTranslation = studentTranslation;
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Student deletes their translation (only if not graded)
app.put("/api/sentences/:id/translate/delete", async (req, res) => {
  try {
    const sentence = await Sentence.findById(req.params.id);
    if (!sentence) return res.status(404).json({ error: "Sentence not found" });
    if (sentence.status === "graded")
      return res.status(400).json({ error: "Cannot delete after grading" });
    sentence.studentTranslation = "";
    sentence.status = "pending";
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin submits a score and comment
app.put("/api/sentences/:id/grade", async (req, res) => {
  try {
    const { grade, teacherComment } = req.body;
    const sentence = await Sentence.findById(req.params.id);

    if (!sentence) return res.status(404).json({ error: "Sentence not found" });

    sentence.grade = grade;
    sentence.teacherComment = teacherComment;
    sentence.status = "graded";

    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Teacher edits grade and comment
app.put("/api/sentences/:id/grade/edit", async (req, res) => {
  try {
    const { grade, teacherComment } = req.body;
    const sentence = await Sentence.findById(req.params.id);
    if (!sentence) return res.status(404).json({ error: "Sentence not found" });
    sentence.grade = grade;
    sentence.teacherComment = teacherComment;
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Teacher deletes grade and comment
app.put("/api/sentences/:id/grade/delete", async (req, res) => {
  try {
    const sentence = await Sentence.findById(req.params.id);
    if (!sentence) return res.status(404).json({ error: "Sentence not found" });
    sentence.grade = null;
    sentence.teacherComment = "";
    sentence.status = sentence.studentTranslation ? "submitted" : "pending";
    await sentence.save();
    res.json(sentence);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
