import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle, Trash2, Edit2, X, Save, FolderOpen, MessageSquare, Type } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import HintFields from './shared/HintFields';
import ExerciseContent from './shared/ExerciseContent';
import { isDialog, validateExercisePayload } from '../utils/exercise';

const emptyHintState = () => ({
  hints: [],
  word: '',
  translation: '',
});

export default function TeacherView() {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');

  const [sentences, setSentences] = useState([]);
  const [contentType, setContentType] = useState('sentence');
  const [newSentence, setNewSentence] = useState('');
  const [dialogLines, setDialogLines] = useState([
    { speaker: 'A', text: '' },
    { speaker: 'B', text: '' },
  ]);
  const [addHints, setAddHints] = useState(emptyHintState());

  const [gradingScore, setGradingScore] = useState({});
  const [gradingComment, setGradingComment] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState('sentence');
  const [editSentence, setEditSentence] = useState('');
  const [editDialogLines, setEditDialogLines] = useState([]);
  const [editHints, setEditHints] = useState(emptyHintState());

  const fetchTopics = async () => {
    try {
      const res = await axios.get('/api/topics');
      setTopics(res.data.topics || []);
    } catch (err) {
      toast.error('Mövzular yüklənmədi');
      console.error(err);
    }
  };

  const fetchSentences = async (topicId) => {
    try {
      const res = await axios.get('/api/sentences', { params: { topicId } });
      setSentences(res.data);
    } catch (err) {
      toast.error('Tapşırıqlar yüklənmədi');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/api/sentences', { params: { topicId: selectedTopicId } });
        if (!cancelled) setSentences(res.data);
      } catch (error) {
        if (!cancelled) {
          toast.error('Tapşırıqlar yüklənmədi');
          console.error(error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTopicId]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    try {
      const res = await axios.post('/api/topics', { title: newTopicTitle.trim() });
      toast.success('Mövzu yaradıldı');
      setNewTopicTitle('');
      await fetchTopics();
      setSelectedTopicId(res.data._id);
    } catch {
      toast.error('Mövzu yaradılmadı');
    }
  };

  const handleUpdateTopic = async (id) => {
    if (!editTopicTitle.trim()) return;
    try {
      await axios.put(`/api/topics/${id}`, { title: editTopicTitle.trim() });
      toast.success('Mövzu yeniləndi');
      setEditingTopicId(null);
      fetchTopics();
    } catch {
      toast.error('Mövzu yenilənmədi');
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Bu mövzunu və içindəki bütün tapşırıqları silmək istəyirsiniz?')) return;
    try {
      await axios.delete(`/api/topics/${id}`);
      toast.success('Mövzu silindi');
      if (selectedTopicId === id) {
        setSelectedTopicId(null);
        setSentences([]);
      }
      fetchTopics();
    } catch {
      toast.error('Mövzu silinmədi');
    }
  };

  const addHint = (setter) => {
    const { hints, word, translation } = setter;
    if (word.trim() && translation.trim()) {
      return {
        hints: [...hints, { word: word.trim().toLowerCase(), translation: translation.trim() }],
        word: '',
        translation: '',
      };
    }
    return setter;
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!selectedTopicId) {
      toast.error('Əvvəlcə mövzu seçin');
      return;
    }
    const payload = {
      type: contentType,
      text: newSentence,
      dialogLines: dialogLines.filter((l) => l.text.trim()),
    };
    const err = validateExercisePayload(payload);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await axios.post('/api/sentences', {
        topicId: selectedTopicId,
        type: contentType,
        text: contentType === 'sentence' ? newSentence.trim() : '',
        dialogLines: payload.dialogLines,
        hints: addHints.hints,
      });
      toast.success('Tapşırıq əlavə edildi');
      setNewSentence('');
      setDialogLines([
        { speaker: 'A', text: '' },
        { speaker: 'B', text: '' },
      ]);
      setAddHints(emptyHintState());
      fetchSentences(selectedTopicId);
    } catch {
      toast.error('Tapşırıq əlavə edilmədi');
    }
  };

  const handleGrade = async (sentenceId) => {
    try {
      const score = gradingScore[sentenceId];
      const comment = gradingComment[sentenceId] || '';
      if (score === undefined || score === '') {
        toast.error('Bal daxil edin');
        return;
      }
      await axios.put(`/api/sentences/${sentenceId}/grade`, {
        grade: Number(score),
        teacherComment: comment,
      });
      toast.success('Qiymət saxlanıldı');
      setGradingScore((prev) => {
        const st = { ...prev };
        delete st[sentenceId];
        return st;
      });
      setGradingComment((prev) => {
        const st = { ...prev };
        delete st[sentenceId];
        return st;
      });
      fetchSentences(selectedTopicId);
    } catch {
      toast.error('Qiymət göndərilmədi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu tapşırığı silmək istəyirsiniz?')) return;
    try {
      await axios.delete(`/api/sentences/${id}`);
      toast.success('Tapşırıq silindi');
      fetchSentences(selectedTopicId);
    } catch {
      toast.error('Silinmədi');
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setEditType(s.type || 'sentence');
    setEditSentence(s.text || '');
    setEditDialogLines(
      s.dialogLines?.length
        ? [...s.dialogLines]
        : [
            { speaker: 'A', text: '' },
            { speaker: 'B', text: '' },
          ]
    );
    setEditHints({ hints: [...(s.hints || [])], word: '', translation: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSentence('');
    setEditDialogLines([]);
    setEditHints(emptyHintState());
  };

  const saveEdit = async (id) => {
    const payload = {
      type: editType,
      text: editSentence,
      dialogLines: editDialogLines.filter((l) => l.text?.trim()),
    };
    const err = validateExercisePayload(payload);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await axios.put(`/api/sentences/${id}`, {
        type: editType,
        text: editType === 'sentence' ? editSentence.trim() : editSentence,
        dialogLines: payload.dialogLines,
        hints: editHints.hints,
      });
      toast.success('Yeniləndi');
      cancelEdit();
      fetchSentences(selectedTopicId);
    } catch {
      toast.error('Yenilənmədi');
    }
  };

  const selectedTopic = topics.find((t) => t._id === selectedTopicId);

  return (
    <div className="space-y-8 pb-20">
      {/* Topics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" /> Mövzular
        </h2>
        <form onSubmit={handleCreateTopic} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Məs: Tenses, Daily routines..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={!newTopicTitle.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Mövzu yarat
          </button>
        </form>

        {topics.length === 0 ? (
          <p className="text-gray-500 text-sm">Hələ mövzu yoxdur. Yuxarıdan birini yaradın.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <div key={t._id} className="flex items-center gap-1">
                {editingTopicId === t._id ? (
                  <div className="flex gap-1">
                    <input
                      value={editTopicTitle}
                      onChange={(e) => setEditTopicTitle(e.target.value)}
                      className="px-2 py-1 rounded-lg border text-sm w-32"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateTopic(t._id)}
                      className="p-1 text-green-600"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditingTopicId(null)} className="p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId(t._id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTopicId === t._id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.title}
                    <span className="ml-1 opacity-70">({t.exerciseCount || 0})</span>
                  </button>
                )}
                {editingTopicId !== t._id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopicId(t._id);
                        setEditTopicTitle(t.title);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(t._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add exercise */}
      {selectedTopicId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <h2 className="text-xl font-semibold mb-1 text-gray-800">
            «{selectedTopic?.title}» — tapşırıq əlavə et
          </h2>
          <p className="text-sm text-gray-500 mb-4">Cümlə və ya A/B dialoqu seçin</p>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setContentType('sentence')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                contentType === 'sentence'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Type className="w-4 h-4" /> Cümlə
            </button>
            <button
              type="button"
              onClick={() => setContentType('dialog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                contentType === 'dialog'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Dialoq
            </button>
          </div>

          <form onSubmit={handleAddExercise} className="space-y-4">
            {contentType === 'sentence' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İngilis cümləsi</label>
                <input
                  type="text"
                  value={newSentence}
                  onChange={(e) => setNewSentence(e.target.value)}
                  placeholder="e.g. I have been studying for two hours."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Dialoq (A və B)</label>
                {dialogLines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={line.speaker}
                      onChange={(e) => {
                        const next = [...dialogLines];
                        next[i] = { ...next[i], speaker: e.target.value };
                        setDialogLines(next);
                      }}
                      className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-sm font-bold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => {
                        const next = [...dialogLines];
                        next[i] = { ...next[i], text: e.target.value };
                        setDialogLines(next);
                      }}
                      placeholder={`${line.speaker} deyir...`}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    {dialogLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDialogLines(dialogLines.filter((_, j) => j !== i))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setDialogLines([
                      ...dialogLines,
                      { speaker: dialogLines.length % 2 === 0 ? 'A' : 'B', text: '' },
                    ])
                  }
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  + Sətir əlavə et
                </button>
              </div>
            )}

            <HintFields
              hints={addHints.hints}
              word={addHints.word}
              translation={addHints.translation}
              onWordChange={(v) => setAddHints({ ...addHints, word: v })}
              onTranslationChange={(v) => setAddHints({ ...addHints, translation: v })}
              onAdd={() => setAddHints((s) => addHint(s) || s)}
              onRemove={(i) =>
                setAddHints({ ...addHints, hints: addHints.hints.filter((_, idx) => idx !== i) })
              }
            />

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-md"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Tapşırıq yarat
            </button>
          </form>
        </motion.div>
      )}

      {/* Manage */}
      {selectedTopicId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Tapşırıqları idarə et və qiymətləndir</h2>

          {sentences.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Bu mövzuda hələ tapşırıq yoxdur.
            </div>
          ) : (
            <div className="space-y-6">
              {sentences.map((s) => (
                <div
                  key={s._id}
                  className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col gap-4"
                >
                  {editingId === s._id ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditType('sentence')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            editType === 'sentence' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                          }`}
                        >
                          Cümlə
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditType('dialog')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            editType === 'dialog' ? 'bg-purple-600 text-white' : 'bg-gray-100'
                          }`}
                        >
                          Dialoq
                        </button>
                      </div>

                      {editType === 'sentence' ? (
                        <input
                          type="text"
                          value={editSentence}
                          onChange={(e) => setEditSentence(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div className="space-y-2">
                          {editDialogLines.map((line, i) => (
                            <div key={i} className="flex gap-2">
                              <select
                                value={line.speaker}
                                onChange={(e) => {
                                  const next = [...editDialogLines];
                                  next[i] = { ...next[i], speaker: e.target.value };
                                  setEditDialogLines(next);
                                }}
                                className="w-16 px-2 py-2 rounded-lg border text-sm font-bold"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                              </select>
                              <input
                                type="text"
                                value={line.text}
                                onChange={(e) => {
                                  const next = [...editDialogLines];
                                  next[i] = { ...next[i], text: e.target.value };
                                  setEditDialogLines(next);
                                }}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditDialogLines(editDialogLines.filter((_, j) => j !== i))
                                }
                                className="p-2 text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setEditDialogLines([
                                ...editDialogLines,
                                {
                                  speaker: editDialogLines.length % 2 === 0 ? 'A' : 'B',
                                  text: '',
                                },
                              ])
                            }
                            className="text-sm text-indigo-600"
                          >
                            + Sətir
                          </button>
                        </div>
                      )}

                      <HintFields
                        hints={editHints.hints}
                        word={editHints.word}
                        translation={editHints.translation}
                        onWordChange={(v) => setEditHints({ ...editHints, word: v })}
                        onTranslationChange={(v) => setEditHints({ ...editHints, translation: v })}
                        onAdd={() => setEditHints((st) => addHint(st) || st)}
                        onRemove={(i) =>
                          setEditHints({
                            ...editHints,
                            hints: editHints.hints.filter((_, idx) => idx !== i),
                          })
                        }
                        onChange={(i, field, value) =>
                          setEditHints({
                            ...editHints,
                            hints: editHints.hints.map((h, idx) =>
                              idx === i
                                ? {
                                    ...h,
                                    [field]: field === 'word' ? value.toLowerCase() : value,
                                  }
                                : h
                            ),
                          })
                        }
                        compact
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(s._id)}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg"
                        >
                          <Save className="w-4 h-4" /> Saxla
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-sm rounded-lg"
                        >
                          <X className="w-4 h-4" /> Ləğv
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                                s.status === 'pending'
                                  ? 'bg-gray-100 text-gray-600'
                                  : s.status === 'graded'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {s.status}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isDialog(s) ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {isDialog(s) ? 'Dialoq' : 'Cümlə'}
                            </span>
                          </div>
                          {isDialog(s) ? (
                            <div className="max-h-48 overflow-y-auto">
                              <ExerciseContent exercise={s} size="sm" />
                            </div>
                          ) : (
                            <div className="font-semibold text-lg text-gray-900">{s.text}</div>
                          )}
                          {s.hints?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {s.hints.map((h, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border"
                                >
                                  {h.word} → {h.translation}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {s.status !== 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Tələbə tərcüməsi:</div>
                          <div className="text-gray-800 bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400 mb-3 whitespace-pre-wrap">
                            {s.studentTranslation}
                          </div>
                          {s.status === 'graded' ? (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                              <div>
                                <div className="font-semibold text-green-800">Bal: {s.grade}/100</div>
                                {s.teacherComment && (
                                  <div className="text-sm text-green-700 mt-1">{s.teacherComment}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="number"
                                placeholder="Bal (0-100)"
                                min="0"
                                max="100"
                                value={gradingScore[s._id] || ''}
                                onChange={(e) =>
                                  setGradingScore({ ...gradingScore, [s._id]: e.target.value })
                                }
                                className="w-full sm:w-32 px-3 py-2 rounded-lg border text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Şərh (istəyə bağlı)"
                                value={gradingComment[s._id] || ''}
                                onChange={(e) =>
                                  setGradingComment({ ...gradingComment, [s._id]: e.target.value })
                                }
                                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleGrade(s._id)}
                                disabled={
                                  gradingScore[s._id] === undefined || gradingScore[s._id] === ''
                                }
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                Qiymət ver
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
      )}

      {!selectedTopicId && topics.length > 0 && (
        <p className="text-center text-gray-500 text-sm">Tapşırıq əlavə etmək üçün yuxarıdan mövzu seçin.</p>
      )}
    </div>
  );
}
