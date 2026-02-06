import { useState } from 'react';

interface DictionarySectionProps {
  dictionary: string[];
  addWord: (word: string) => Promise<void>;
  removeWord: (word: string) => Promise<void>;
}

export function DictionarySection({ dictionary, addWord, removeWord }: DictionarySectionProps) {
  const [newWord, setNewWord] = useState('');

  const handleAddWord = async () => {
    if (newWord.trim()) {
      await addWord(newWord.trim());
      setNewWord('');
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="section-title secondary">Dictionnaire</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
          placeholder="Ajouter un mot..."
          className="input-glass flex-1"
        />
        <button
          onClick={handleAddWord}
          className="btn-glass px-4 text-[var(--accent-primary)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {dictionary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dictionary.map((word) => (
            <span
              key={word}
              className="tag-frost group"
            >
              {word}
              <button
                onClick={() => removeWord(word)}
                className="opacity-50 hover:opacity-100 hover:text-[var(--accent-danger)] transition-opacity ml-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
