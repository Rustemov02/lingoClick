import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle, Trash2, Edit2, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function TeacherView() {
  const [sentences, setSentences] = useState([]);
  const [newSentence, setNewSentence] = useState('');
  const [hints, setHints] = useState([]);
  const [currentHintWord, setCurrentHintWord] = useState('');
  const [currentHintTrans, setCurrentHintTrans] = useState('');

  const [gradingScore, setGradingScore] = useState({});
  const [gradingComment, setGradingComment] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editSentence, setEditSentence] = useState('');
  const [editHints, setEditHints] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/sentences');
      setSentences(res.data);
    } catch (err) {
      toast.error('Failed to load sentences');
      console.error(err);
    }
  };

  const handleAddHint = () => {
    if (currentHintWord.trim() && currentHintTrans.trim()) {
      setHints([...hints, { word: currentHintWord.trim().toLowerCase(), translation: currentHintTrans.trim() }]);
      setCurrentHintWord('');
      setCurrentHintTrans('');
    }
  };

  const handleRemoveHint = (index) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  const handleSubmitSentence = async (e) => {
    e.preventDefault();
    if (!newSentence.trim()) return;
    try {
      await axios.post('/api/sentences', {
        text: newSentence.trim(),
        hints
      });
      toast.success('Sentence added successfully!');
      setNewSentence('');
      setHints([]);
      fetchData();
    } catch (err) {
      toast.error('Failed to add sentence');
      console.error(err);
    }
  };

  const handleGrade = async (sentenceId) => {
    try {
      const score = gradingScore[sentenceId];
      const comment = gradingComment[sentenceId] || '';
      if (score === undefined || score === '') {
        toast.error('Please enter a valid score');
        return;
      }

      await axios.put(`/api/sentences/${sentenceId}/grade`, {
        grade: Number(score),
        teacherComment: comment
      });
      toast.success('Grade and comment saved!');
      setGradingScore((prev) => { const st = {...prev}; delete st[sentenceId]; return st; });
      setGradingComment((prev) => { const st = {...prev}; delete st[sentenceId]; return st; });
      fetchData();
    } catch (err) {
      toast.error('Failed to submit grade');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sentence?')) return;
    try {
      await axios.delete(`/api/sentences/${id}`);
      toast.success('Sentence deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete sentence');
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setEditSentence(s.text);
    setEditHints([...s.hints]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSentence('');
    setEditHints([]);
  };

  const saveEdit = async (id) => {
    if (!editSentence.trim()) return;
    try {
      await axios.put(`/api/sentences/${id}`, {
        text: editSentence.trim(),
        hints: editHints
      });
      toast.success('Sentence updated successfully!');
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update sentence');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add New Sentence
        </h2>
        <form onSubmit={handleSubmitSentence} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English Sentence</label>
            <input
              type="text"
              required
              value={newSentence}
              onChange={(e) => setNewSentence(e.target.value)}
              placeholder="e.g. Learning English is essential."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dynamic Hints (Optional)</label>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="text"
                value={currentHintWord}
                onChange={(e) => setCurrentHintWord(e.target.value)}
                placeholder="Word in sentence"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={currentHintTrans}
                onChange={(e) => setCurrentHintTrans(e.target.value)}
                placeholder="Azerbaijani translation"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddHint}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Add Hint
              </button>
            </div>
            
            {hints.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hints.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm">
                    <span className="font-medium text-indigo-600">{h.word}</span> = {h.translation}
                    <button type="button" onClick={() => handleRemoveHint(i)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!newSentence.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
          >
            Create Assignment
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Manage Assignments & Review</h2>
        
        {sentences.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No assignments added yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sentences.map((s) => (
              <div key={s._id} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col gap-4 relative group">
                
                {editingId === s._id ? (
                  // EDIT MODE
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editSentence}
                      onChange={(e) => setEditSentence(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(s._id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${s.status === 'pending' ? 'bg-gray-100 text-gray-600' : s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="font-semibold text-lg text-gray-900">{s.text}</div>
                        {s.hints?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {s.hints.map((h, i) => (
                              <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                {h.word} &rarr; {h.translation}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SUBMISSION & GRADING UI */}
                    {s.status !== 'pending' && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm font-medium text-gray-500 mb-2">Student Translation:</div>
                        <div className="text-gray-800 bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400 mb-3">
                          {s.studentTranslation}
                        </div>

                        {s.status === 'graded' ? (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-green-800">Score: {s.grade}/100</div>
                              {s.teacherComment && <div className="text-sm text-green-700 mt-1">{s.teacherComment}</div>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="number"
                              placeholder="Score (0-100)"
                              min="0" max="100"
                              value={gradingScore[s._id] || ''}
                              onChange={(e) => setGradingScore({...gradingScore, [s._id]: e.target.value})}
                              className="w-full sm:w-32 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Feedback comment (optional)"
                              value={gradingComment[s._id] || ''}
                              onChange={(e) => setGradingComment({...gradingComment, [s._id]: e.target.value})}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 text-sm"
                            />
                            <button
                              onClick={() => handleGrade(s._id)}
                              disabled={gradingScore[s._id] === undefined || gradingScore[s._id] === ''}
                              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
                            >
                              Submit Grade
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
