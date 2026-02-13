import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { FileTranscriptionResult, FileTranscriptionProgress, LlmProvider } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

interface FileTranscriptionProps {
  isOpen: boolean;
  onClose: () => void;
  initialFiles?: string[];
}

interface SummaryState {
  [key: number]: {
    loading: boolean;
    text: string | null;
    error: string | null;
  };
}

export function FileTranscription({ isOpen, initialFiles }: FileTranscriptionProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [results, setResults] = useState<FileTranscriptionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<FileTranscriptionProgress | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<SummaryState>({});
  const [localLlmAvailable, setLocalLlmAvailable] = useState(false);
  const settings = useSettingsStore(state => state.settings);

  useEffect(() => {
    invoke<string[]>('get_supported_audio_formats').then(setSupportedFormats).catch(console.error);
  }, []);

  // Vérifier si le modèle LLM local est disponible
  useEffect(() => {
    if (settings?.local_llm_model) {
      invoke<boolean>('is_llm_model_available', { modelSize: settings.local_llm_model })
        .then(setLocalLlmAvailable)
        .catch(() => setLocalLlmAvailable(false));
    }
  }, [settings?.local_llm_model]);

  useEffect(() => {
    const unlistenProgress = listen<FileTranscriptionProgress>('file-transcription-progress', (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlistenProgress.then(fn => fn());
    };
  }, []);

  // Handle files from drag & drop
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(prev => {
        const existingSet = new Set(prev);
        const newFiles = initialFiles.filter(f => !existingSet.has(f));
        return newFiles.length > 0 ? [...prev, ...newFiles] : prev;
      });
      setResults([]);
    }
  }, [initialFiles]);

  const handleSelectFiles = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Audio Files',
          extensions: ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'webm', 'aac', 'wma'],
        }],
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setFiles(paths);
        setResults([]);
      }
    } catch (e) {
      console.error('Failed to open file dialog:', e);
    }
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: files.length, file_name: '', status: 'starting' });

    try {
      const transcriptionResults = await invoke<FileTranscriptionResult[]>('transcribe_files', {
        paths: files,
      });
      setResults(transcriptionResults);
    } catch (e) {
      console.error('Transcription failed:', e);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [files]);

  const handleCopyResult = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSummarize = useCallback(async (index: number, text: string, provider?: LlmProvider) => {
    setSummaries(prev => ({
      ...prev,
      [index]: { loading: true, text: null, error: null }
    }));

    try {
      // Utilise summarize_text_smart qui choisit automatiquement le provider
      const summary = await invoke<string>('summarize_text_smart', { text, provider });
      setSummaries(prev => ({
        ...prev,
        [index]: { loading: false, text: summary, error: null }
      }));
    } catch (e) {
      setSummaries(prev => ({
        ...prev,
        [index]: { loading: false, text: null, error: String(e) }
      }));
    }
  }, []);

  const handleCopySummary = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSendTo = useCallback(async (target: 'apple_notes' | 'obsidian', text: string, fileName: string) => {
    const title = `Transcription - ${fileName}`;
    try {
      if (target === 'apple_notes') {
        await invoke('send_to_apple_notes', { title, body: text });
      } else {
        await invoke('send_to_obsidian', { title, body: text });
      }
    } catch (e) {
      console.error(`Failed to send to ${target}:`, e);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* File Selection */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <span className="section-title primary">
              Fichiers selectionnes ({files.length})
            </span>
            <button
              onClick={handleSelectFiles}
              disabled={isProcessing}
              className="btn-glass disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter des fichiers
            </button>
          </div>

          {files.length === 0 ? (
            <div
              onClick={handleSelectFiles}
              className="glass-card p-10 text-center cursor-pointer hover:border-[var(--accent-primary)] transition-all group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] flex items-center justify-center group-hover:border-[var(--accent-primary)] transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="group-hover:stroke-[var(--accent-primary)] transition-colors">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] text-[0.9375rem] mb-2">
                Cliquez pour selectionner des fichiers audio
              </p>
              <p className="text-[var(--text-muted)] text-[0.8rem]">
                Formats: {supportedFormats.join(', ').toUpperCase() || 'WAV, MP3, M4A, FLAC, OGG, WEBM'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {files.map((file, index) => {
                const fileName = file.split('/').pop() || file;
                const isCurrentFile = progress?.file_name === fileName;
                return (
                  <div
                    key={index}
                    className={`glass-card p-3 flex items-center justify-between ${
                      isCurrentFile ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                      <span className="text-[0.875rem] text-[var(--text-primary)] truncate">{fileName}</span>
                    </div>
                    {!isProcessing && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors ml-2 p-1"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress */}
        {isProcessing && progress && (
          <div className="glass-card p-5 space-y-4 animate-fade-in-up border-[var(--accent-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="led-frost processing" />
                <span className="text-[0.9375rem] text-[var(--text-primary)] font-medium">
                  {progress.status === 'transcribing' ? 'Transcription en cours...' : progress.status}
                </span>
              </div>
              <span className="tag-frost accent">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="progress-frost">
              <div
                className="bar"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            {progress.file_name && (
              <p className="text-[0.8rem] text-[var(--text-muted)] truncate">
                {progress.file_name}
              </p>
            )}
          </div>
        )}

        {/* Transcribe button */}
        {files.length > 0 && !isProcessing && (
          <button
            onClick={handleTranscribe}
            className="btn-primary w-full animate-fade-in-up"
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Transcrire {files.length} fichier{files.length > 1 ? 's' : ''}
            </span>
          </button>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4 animate-fade-in-up">
            <span className="section-title success">
              Resultats ({results.length})
            </span>
            <div className="space-y-4 stagger-children">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`result-card-frost ${
                    result.error ? 'border-[var(--accent-danger)]' : ''
                  }`}
                >
                  <div className="card-header">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        result.error
                          ? 'bg-[var(--accent-danger)]'
                          : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]'
                      }`} />
                      <span className="text-[0.875rem] text-[var(--text-primary)] font-medium">
                        {result.file_name}
                      </span>
                    </div>
                    {result.transcription && (
                      <div className="flex items-center gap-2">
                        {/* Bouton résumé avec choix local/cloud */}
                        {summaries[index]?.loading ? (
                          <button
                            disabled
                            className="btn-glass text-[0.75rem] py-1.5 px-3 opacity-50"
                          >
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Resume...
                          </button>
                        ) : localLlmAvailable && settings?.groq_api_key ? (
                          // Les deux providers sont disponibles - afficher un dropdown
                          <div className="relative group">
                            <button
                              className="btn-glass text-[0.75rem] py-1.5 px-3 flex items-center gap-1.5"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                              Resumer
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            <div className="absolute top-full left-0 mt-1 py-1 min-w-[140px] bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => handleSummarize(index, result.transcription!.text, 'local')}
                                className="w-full px-3 py-2 text-left text-[0.75rem] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)] flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Local
                              </button>
                              <button
                                onClick={() => handleSummarize(index, result.transcription!.text, 'groq')}
                                className="w-full px-3 py-2 text-left text-[0.75rem] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)] flex items-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Cloud (Groq)
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Un seul provider disponible
                          <button
                            onClick={() => handleSummarize(index, result.transcription!.text)}
                            disabled={!localLlmAvailable && !settings?.groq_api_key}
                            className="btn-glass text-[0.75rem] py-1.5 px-3 disabled:opacity-50"
                            title={localLlmAvailable ? 'Resume (local)' : settings?.groq_api_key ? 'Resume (cloud)' : 'Configurez un LLM dans les parametres'}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Resumer {localLlmAvailable ? '(Local)' : settings?.groq_api_key ? '(Cloud)' : ''}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyResult(result.transcription!.text)}
                          className="btn-glass text-[0.75rem] py-1.5 px-3"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copier
                        </button>
                        {(settings?.integrations?.apple_notes_enabled || settings?.integrations?.obsidian_enabled) && (
                          <div className="relative group">
                            <button className="btn-glass text-[0.75rem] py-1.5 px-3">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                              </svg>
                              Envoyer
                            </button>
                            <div className="absolute top-full right-0 mt-1 py-1 min-w-[140px] bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              {settings?.integrations?.apple_notes_enabled && (
                                <button
                                  onClick={() => handleSendTo('apple_notes', result.transcription!.text, result.file_name)}
                                  className="w-full px-3 py-2 text-left text-[0.75rem] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]"
                                >
                                  Apple Notes
                                </button>
                              )}
                              {settings?.integrations?.obsidian_enabled && (
                                <button
                                  onClick={() => handleSendTo('obsidian', result.transcription!.text, result.file_name)}
                                  className="w-full px-3 py-2 text-left text-[0.75rem] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]"
                                >
                                  Obsidian
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-content space-y-4">
                    {result.error ? (
                      <p className="text-[var(--accent-danger)] text-[0.9375rem]">{result.error}</p>
                    ) : result.transcription ? (
                      <p className="text-[var(--text-secondary)] text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
                        {result.transcription.text}
                      </p>
                    ) : null}

                    {/* Affichage du résumé */}
                    {summaries[index]?.error && (
                      <div className="p-3 rounded-lg bg-[var(--accent-danger-soft)] border border-[var(--accent-danger)]">
                        <p className="text-[0.8rem] text-[var(--accent-danger)]">{summaries[index].error}</p>
                      </div>
                    )}

                    {summaries[index]?.text && (
                      <div className="p-4 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[var(--accent-primary-soft)]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <span className="text-[0.75rem] font-medium text-[var(--accent-primary)]">Resume</span>
                          </div>
                          <button
                            onClick={() => handleCopySummary(summaries[index].text!)}
                            className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                            title="Copier le resume"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[var(--text-primary)] text-[0.875rem] leading-relaxed whitespace-pre-wrap">
                          {summaries[index].text}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.transcription && (
                    <div className="card-footer">
                      <div className="flex flex-wrap gap-4 text-[0.75rem] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {result.transcription.duration_seconds.toFixed(1)}s
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          {result.transcription.processing_time_ms}ms
                        </span>
                        {result.transcription.detected_language && (
                          <span>Langue: {result.transcription.detected_language}</span>
                        )}
                        {result.transcription.model_used && (
                          <span className="tag-frost text-[0.6rem]">{result.transcription.model_used}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
