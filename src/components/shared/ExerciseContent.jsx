import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isDialog } from '../../utils/exercise';

const parseSentence = (sentence) => {
  const words = sentence.split(' ');
  return words.map((w, index) => {
    const cleanWord = w.replace(/[.,!?()[\]{}"']/g, '').toLowerCase();
    return { id: index, original: w, lookup: cleanWord };
  });
};

function ClickableWord({ wordObj, hints, size = 'lg' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hintObj = hints.find((h) => h.word === wordObj.lookup);
  const translation = hintObj ? hintObj.translation : null;
  const sizeClass =
    size === 'xs'
      ? 'text-sm leading-snug'
      : size === 'sm'
        ? 'text-base sm:text-lg'
        : 'text-2xl sm:text-3xl';

  return (
    <span className="relative inline-block mr-1.5 mb-1">
      {translation ? (
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          onBlur={() => setShowTooltip(false)}
          className={`${sizeClass} font-medium px-1 py-0.5 rounded transition-all cursor-pointer border-b-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-gray-800`}
        >
          {wordObj.original}
        </button>
      ) : (
        <span className={`${sizeClass} font-medium px-1 py-0.5 text-gray-800`}>
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function ClickableLine({ text, hints, size }) {
  const words = parseSentence(text);
  return (
    <div className="flex flex-wrap leading-relaxed">
      {words.map((w) => (
        <ClickableWord key={w.id} wordObj={w} hints={hints} size={size} />
      ))}
    </div>
  );
}

export default function ExerciseContent({ exercise, size = 'lg', compact = false }) {
  const hints = exercise.hints || [];
  const displaySize = compact ? 'xs' : size;
  const lineGap = compact ? 'space-y-2' : 'space-y-4';
  const rowGap = compact ? 'gap-2' : 'gap-3';
  const avatarClass = compact ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const bubblePad = compact ? 'p-2 rounded-xl' : 'p-3 rounded-2xl';

  if (isDialog(exercise)) {
    return (
      <div className={lineGap}>
        {(exercise.dialogLines || []).map((line, idx) => (
          <div
            key={idx}
            className={`flex ${rowGap} ${line.speaker === 'A' ? '' : 'flex-row-reverse'}`}
          >
            <div
              className={`shrink-0 rounded-full flex items-center justify-center font-bold ${avatarClass} ${
                line.speaker === 'A'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {line.speaker}
            </div>
            <div
              className={`flex-1 ${bubblePad} ${
                line.speaker === 'A'
                  ? 'bg-white border border-indigo-100'
                  : 'bg-white border border-purple-100'
              }`}
            >
              <ClickableLine text={line.text} hints={hints} size={displaySize} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <ClickableLine text={exercise.text} hints={hints} size={displaySize} />;
}
