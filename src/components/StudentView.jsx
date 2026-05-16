import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, PenTool, Send, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const parseSentence = (sentence) => {
  const words = sentence.split(' ');
  return words.map((w, index) => {
    const cleanWord = w.replace(/[.,!?()[\]{}"']/g, '').toLowerCase();
    return { id: index, original: w, lookup: cleanWord };
  });
};

function ClickableWord({ wordObj, hints }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hintObj = hints.find(h => h.word === wordObj.lookup);
  const translation = hintObj ? hintObj.translation : null;

  return (
    <span className="relative inline-block mr-2 mb-2">
      {translation ? (
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          onBlur={() => setShowTooltip(false)}
          className="text-2xl sm:text-3xl font-medium px-1 py-0.5 rounded transition-all cursor-pointer border-b-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-gray-800"
          title="Click for translation"
        >
          {wordObj.original}
        </button>
      ) : (
        <span className="text-2xl sm:text-3xl font-medium px-1 py-0.5 text-gray-800">
          {wordObj.original}
        </span>
      )}

      <AnimatePresence>
        {showTooltip && translation && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap z-10 shadow-xl pointer-events-none"
          >
            {translation}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function StudentView() {
  const [sentences, setSentences] = useState([]);
  const [activeSentence, setActiveSentence] = useState(null);
  const [translationText, setTranslationText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sentences');
      setSentences(res.data);
    } catch (err) {
      toast.error('Failed to load assignments');
      console.error(err);
    }
  };

  const handleSelectSentence = (sentence) => {
    if (sentence.status === 'pending') {
      setActiveSentence(sentence);
      setTranslationText('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!translationText.trim() || !activeSentence) return;
    
    try {
      await axios.put(`http://localhost:5000/api/sentences/${activeSentence._id}/translate`, {
        studentTranslation: translationText.trim()
      });
      toast.success('Translation submitted successfully!');
      setActiveSentence(null);
      setTranslationText('');
      fetchData();
    } catch (err) {
      toast.error('Failed to submit translation');
      console.error(err);
    }
  };

  if (activeSentence) {
    const words = parseSentence(activeSentence.text);

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-20">
        <button 
          onClick={() => setActiveSentence(null)}
          className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium p-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="glass-panel overflow-hidden">
          <div className="bg-indigo-50 p-6 border-b border-indigo-100/50">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-3">
              Translate this sentence
            </span>
            <div className="flex flex-wrap leading-relaxed">
              {words.map((w) => (
                <ClickableWord key={w.id} wordObj={w} hints={activeSentence.hints || []} />
              ))}
            </div>
            {activeSentence.hints?.length > 0 && (
              <p className="mt-4 text-sm text-indigo-600/80 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Underlined words have hints. Tap them!
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <textarea
              rows={4}
              value={translationText}
              onChange={(e) => setTranslationText(e.target.value)}
              placeholder="Cümləni bura tərcümə edin..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm resize-none text-lg mb-4"
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!translationText.trim()}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black disabled:opacity-50 transition-all shadow-lg flex justify-center items-center gap-2"
            >
              Submit Translation <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 px-2">Assignments</h2>
      
      {sentences.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 m-2">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-300" />
          </div>
          <p>No assignments available.</p>
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
                s.status === 'pending' 
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
                  <div className={`font-medium text-[17px] ${s.status === 'pending' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {s.text}
                  </div>
                  
                  {s.status === 'submitted' && (
                    <div className="text-sm font-medium text-yellow-600 mt-2">
                      Waiting for grading...
                    </div>
                  )}

                  {s.status === 'graded' && (
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
                        Score: {s.grade}/100
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
