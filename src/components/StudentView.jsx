import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  PenTool,
  Send,
  AlertCircle,
  Clock,
  Trash2,
  FolderOpen,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ExerciseContent from './shared/ExerciseContent';
import { getExercisePreview, isDialog } from '../utils/exercise';

export default function StudentView() {
  const [topics, setTopics] = useState([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [activeSentence, setActiveSentence] = useState(null);
  const [translationText, setTranslationText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/topics');
      setTopics(res.data.topics || []);
      setUncategorizedCount(res.data.uncategorizedCount || 0);
    } catch (err) {
      toast.error('Mövzular yüklənmədi');
      console.error(err);
    } finally {
      setLoading(false);
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

  const openTopic = async (topic) => {
    setSelectedTopic(topic);
    const topicId = topic._id === 'uncategorized' ? 'uncategorized' : topic._id;
    await fetchSentences(topicId);
  };

  const closeActive = () => {
    setActiveSentence(null);
    setTranslationText('');
  };

  const backToTopics = () => {
    setSelectedTopic(null);
    setSentences([]);
    closeActive();
  };

  const refreshExercises = () => {
    if (!selectedTopic) return;
    const topicId =
      selectedTopic._id === 'uncategorized' ? 'uncategorized' : selectedTopic._id;
    fetchSentences(topicId);
  };

  const handleSelectSentence = (sentence) => {
    if (sentence.status === 'pending') {
      setActiveSentence(sentence);
      setTranslationText('');
    } else if (sentence.status === 'submitted') {
      setActiveSentence(sentence);
      setTranslationText(sentence.studentTranslation || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!translationText.trim() || !activeSentence) return;

    const isEdit = activeSentence.status === 'submitted';
    const url = isEdit
      ? `/api/sentences/${activeSentence._id}/translate/edit`
      : `/api/sentences/${activeSentence._id}/translate`;

    try {
      await axios.put(url, { studentTranslation: translationText.trim() });
      toast.success(isEdit ? 'Tərcümə yeniləndi!' : 'Tərcümə göndərildi!');
      closeActive();
      refreshExercises();
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg || (isEdit ? 'Tərcümə yenilənmədi' : 'Tərcümə göndərilmədi'));
      console.error(err);
    }
  };

  const handleDeleteTranslation = async () => {
    if (!activeSentence) return;
    if (!window.confirm('Tərcümənizi silmək istədiyinizə əminsiniz?')) return;

    try {
      await axios.put(`/api/sentences/${activeSentence._id}/translate/delete`);
      toast.success('Tərcümə silindi');
      closeActive();
      refreshExercises();
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg || 'Tərcümə silinmədi');
      console.error(err);
    }
  };

  // Active translation view
  if (activeSentence) {
    const isEditing = activeSentence.status === 'submitted';
    const dialog = isDialog(activeSentence);

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="translate-workspace pb-20 md:pb-20 max-md:pb-4"
      >
        <button
          type="button"
          onClick={closeActive}
          className="shrink-0 mb-2 md:mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" /> Geri
        </button>

        <div className="translate-split-panel glass-panel md:overflow-hidden">
          <div className="translate-source-pane md:bg-indigo-50 md:border-b md:border-indigo-100/50">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-2">
              {isEditing
                ? 'Tərcüməni redaktə edin'
                : dialog
                  ? 'Dialoqu tərcümə edin'
                  : 'Bu cümləni tərcümə edin'}
            </span>
            <ExerciseContent
              exercise={activeSentence}
              size={dialog ? 'sm' : 'lg'}
              compact={dialog}
            />
            {activeSentence.hints?.length > 0 && (
              <p className="mt-2 md:mt-4 text-xs md:text-sm text-indigo-600/80 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                Altı xəttli sözlərə toxunun
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="translate-form-pane">
            <textarea
              rows={dialog ? 3 : 4}
              value={translationText}
              onChange={(e) => setTranslationText(e.target.value)}
              placeholder={
                dialog ? 'Dialoqu bura tərcümə edin...' : 'Cümləni bura tərcümə edin...'
              }
              className="w-full max-md:flex-1 min-h-[4.5rem] max-md:min-h-[3.5rem] px-3 py-2.5 md:px-4 md:py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm resize-none text-base md:text-lg mb-2 md:mb-4"
            />

            <div className="flex flex-col gap-2 md:gap-3 shrink-0">
              <button
                type="submit"
                disabled={!translationText.trim()}
                className="w-full py-3 md:py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black disabled:opacity-50 transition-all shadow-lg flex justify-center items-center gap-2 text-sm md:text-base"
              >
                {isEditing ? 'Yadda saxla' : 'Tərcüməni göndər'} <Send className="w-4 h-4" />
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleDeleteTranslation}
                  className="w-full py-2.5 md:py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-all flex justify-center items-center gap-2 text-sm"
                >
                  Tərcüməni sil <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    );
  }

  // Topic exercises list
  if (selectedTopic) {
    const done = sentences.filter((s) => s.status === 'graded').length;

    return (
      <div className="pb-20">
        <button
          type="button"
          onClick={backToTopics}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" /> Mövzular
        </button>

        <h2 className="text-2xl font-bold mb-1 text-gray-800 px-2">{selectedTopic.title}</h2>
        <p className="text-sm text-gray-500 mb-6 px-2">
          {sentences.length} tapşırıq
          {done > 0 && ` · ${done} qiymətləndirilib`}
        </p>

        {sentences.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
            <p>Bu mövzuda hələ tapşırıq yoxdur.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sentences.map((s, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={s._id}
                onClick={() => handleSelectSentence(s)}
                className={`p-4 rounded-2xl border transition-all ${
                  s.status === 'pending' || s.status === 'submitted'
                    ? 'border-indigo-100 bg-white shadow-sm cursor-pointer active:scale-[0.98]'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {s.status === 'graded' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : s.status === 'submitted' ? (
                      <Clock className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <PenTool className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isDialog(s) && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Dialoq
                        </span>
                      )}
                    </div>
                    <div
                      className={`font-medium text-[17px] ${s.status === 'pending' ? 'text-gray-900' : 'text-gray-600'}`}
                    >
                      {getExercisePreview(s)}
                    </div>

                    {(s.status === 'submitted' || s.status === 'graded') && s.studentTranslation && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                          Sizin tərcüməniz
                        </div>
                        <div className="text-[15px] text-gray-800 bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400 whitespace-pre-wrap">
                          {s.studentTranslation}
                        </div>
                      </div>
                    )}

                    {s.status === 'submitted' && (
                      <div className="text-sm text-yellow-700 mt-2 space-y-1">
                        <p className="font-medium">Qiymətləndirmə gözlənilir...</p>
                        <p className="text-gray-500">Redaktə və ya silmək üçün toxunun</p>
                      </div>
                    )}

                    {s.status === 'graded' && (
                      <div className="mt-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
                          Bal: {s.grade}/100
                        </div>
                        {s.teacherComment && (
                          <div className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100 shadow-sm italic">
                            "{s.teacherComment}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Topics list
  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 px-2">Mövzular</h2>
      <p className="text-sm text-gray-500 mb-6 px-2">Öyrənmək istədiyiniz mövzunu seçin</p>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Yüklənir...</p>
      ) : topics.length === 0 && uncategorizedCount === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 m-2">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p>Hələ mövzu əlavə edilməyib.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {uncategorizedCount > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() =>
                openTopic({ _id: 'uncategorized', title: 'Kateqoriyasız', exerciseCount: uncategorizedCount })
              }
              className="w-full p-5 rounded-2xl border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-400 flex items-center justify-center text-white shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-900">Kateqoriyasız</div>
                  <div className="text-sm text-gray-500">{uncategorizedCount} köhnə tapşırıq</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </motion.button>
          )}
          {topics.map((t, idx) => (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={t._id}
              onClick={() => openTopic(t)}
              className="w-full p-5 rounded-2xl border border-indigo-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left flex items-center justify-between gap-4 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-900">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.exerciseCount || 0} tapşırıq</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
