import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface StepProps {
  onValidChange: (valid: boolean) => void;
}

const LANGUAGES = [
  { code: 'fr', label: 'Francais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'es', label: 'Espanol', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'de', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'it', label: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'pt', label: 'Portugues', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'ja', label: '\u{65E5}\u{672C}\u{8A9E}', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'zh', label: '\u{4E2D}\u{6587}', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ko', label: '\u{D55C}\u{AD6D}\u{C5B4}', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'ru', label: '\u{0420}\u{0443}\u{0441}\u{0441}\u{043A}\u{0438}\u{0439}', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'nl', label: 'Nederlands', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'pl', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
];

export function LanguageStep({ onValidChange }: StepProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [selectedLanguage, setSelectedLanguage] = useState(settings?.transcription_language || 'fr');
  const [autoDetect, setAutoDetect] = useState(settings?.auto_detect_language || false);

  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  const handleLanguageSelect = async (code: string) => {
    setSelectedLanguage(code);
    await updateSettings({ transcription_language: code });
  };

  const handleAutoDetectToggle = async () => {
    const newValue = !autoDetect;
    setAutoDetect(newValue);
    await updateSettings({ auto_detect_language: newValue });
  };

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">
          Langue de transcription
        </h2>
        <p className="text-[var(--text-secondary)] text-[0.85rem]">
          Choisissez la langue principale pour la reconnaissance vocale.
        </p>
      </div>

      <div className="glass-card p-4 mb-4 flex items-center justify-between">
        <div>
          <span className="text-[0.85rem] text-[var(--text-primary)]">Detection automatique</span>
          <p className="text-[0.7rem] text-[var(--text-muted)]">Detecte la langue automatiquement (peut ralentir)</p>
        </div>
        <button
          onClick={handleAutoDetectToggle}
          className={`w-11 h-6 rounded-full transition-all relative ${
            autoDetect ? 'bg-[var(--accent-primary)]' : 'bg-[rgba(255,255,255,0.15)]'
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
            autoDetect ? 'left-[22px]' : 'left-0.5'
          }`} />
        </button>
      </div>

      <div className={`grid grid-cols-3 gap-2 transition-opacity ${autoDetect ? 'opacity-40 pointer-events-none' : ''}`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            className={`glass-card p-3 text-left transition-all ${
              selectedLanguage === lang.code
                ? 'border-[var(--accent-primary)] bg-[rgba(124,138,255,0.1)]'
                : 'hover:border-[var(--accent-primary)]'
            }`}
          >
            <span className="text-lg mr-2">{lang.flag}</span>
            <span className={`text-[0.8rem] ${
              selectedLanguage === lang.code ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
            }`}>
              {lang.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
