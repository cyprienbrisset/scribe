import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import {
  AudioSection,
  EngineSection,
  LlmSection,
  TranslationSection,
  DictationSection,
  TranscriptionSection,
  OptionsSection,
  SystemSection,
  ShortcutsSection,
  DictionarySection,
} from './settings';
import logoSvg from '../assets/logo.svg';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, devices, dictionary, loadSettings, loadDevices, loadDictionary, updateSettings, addWord, removeWord } = useSettingsStore();
  const [apiKeyStatus, setApiKeyStatus] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadDevices();
      loadDictionary();
    }
  }, [isOpen, loadSettings, loadDevices, loadDictionary]);

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="settings-backdrop animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="settings-panel-frost relative w-full max-w-md h-full bg-[#14142a] border-l border-[rgba(255,255,255,0.1)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 bg-[rgba(255,255,255,0.08)] border-b border-[rgba(255,255,255,0.1)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg p-2">
              <img src={logoSvg} alt="WakaScribe" className="w-full h-full invert" />
            </div>
            <div>
              <h2 className="font-display text-lg text-[var(--text-primary)]">
                Parametres
              </h2>
              <p className="text-[0.75rem] text-[var(--text-muted)]">Configuration de WakaScribe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.08)] border border-[var(--glass-border)] hover:border-[var(--accent-danger)] hover:text-[var(--accent-danger)] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          <AudioSection settings={settings} devices={devices} updateSettings={updateSettings} />
          <EngineSection settings={settings} updateSettings={updateSettings} />
          <LlmSection settings={settings} updateSettings={updateSettings} onApiKeyStatusChange={setApiKeyStatus} />
          <TranslationSection settings={settings} updateSettings={updateSettings} apiKeyStatus={apiKeyStatus} />
          <DictationSection settings={settings} updateSettings={updateSettings} />
          <TranscriptionSection settings={settings} updateSettings={updateSettings} />
          <OptionsSection settings={settings} updateSettings={updateSettings} />
          <SystemSection settings={settings} updateSettings={updateSettings} />
          <ShortcutsSection settings={settings} updateSettings={updateSettings} />
          <DictionarySection dictionary={dictionary} addWord={addWord} removeWord={removeWord} />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-[rgba(255,255,255,0.08)] border-t border-[rgba(255,255,255,0.1)]">
          <p className="text-[0.75rem] text-[var(--text-muted)] text-center">
            WakaScribe v1.0.0 - {settings.engine_type === 'whisper' ? 'Whisper.cpp' : settings.engine_type === 'vosk' ? 'Vosk' : 'Parakeet'}
          </p>
        </div>
      </div>
    </div>
  );
}
