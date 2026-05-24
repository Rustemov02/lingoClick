import { Trash2 } from 'lucide-react';

export default function HintFields({
  hints,
  word,
  translation,
  onWordChange,
  onTranslationChange,
  onAdd,
  onRemove,
  onChange,
  compact = false,
}) {
  const inputClass = compact
    ? 'flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none'
    : 'flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none';

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2">İpucular (istəyə bağlı)</label>

      {onChange && hints.length > 0 && (
        <div className="space-y-2 mb-3">
          {hints.map((h, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="text"
                value={h.word}
                onChange={(e) => onChange(i, 'word', e.target.value)}
                placeholder="Söz"
                className={inputClass}
              />
              <input
                type="text"
                value={h.translation}
                onChange={(e) => onChange(i, 'translation', e.target.value)}
                placeholder="Tərcümə"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!onChange && hints.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {hints.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm"
            >
              <span className="font-medium text-indigo-600">{h.word}</span> = {h.translation}
              <button type="button" onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={word}
          onChange={(e) => onWordChange(e.target.value)}
          placeholder="Cümlədəki söz"
          className={inputClass}
        />
        <input
          type="text"
          value={translation}
          onChange={(e) => onTranslationChange(e.target.value)}
          placeholder="Azərbaycan tərcüməsi"
          className={inputClass}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors text-sm shrink-0"
        >
          İpucu əlavə et
        </button>
      </div>
    </div>
  );
}
