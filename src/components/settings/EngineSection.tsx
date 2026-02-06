import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  AppSettings,
  ModelSize,
  ModelInfo,
  DownloadProgress,
  EngineType,
  VoskLanguage,
  VoskModelInfo,
  ParakeetModelSize,
  ParakeetModelInfo,
} from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';

interface EngineSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function EngineSection({ settings, updateSettings }: EngineSectionProps) {
  const { loadSettings } = useSettingsStore();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloading, setDownloading] = useState<ModelSize | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [voskModels, setVoskModels] = useState<VoskModelInfo[]>([]);
  const [downloadingVoskLang, setDownloadingVoskLang] = useState<VoskLanguage | null>(null);
  const [voskDownloadProgress, setVoskDownloadProgress] = useState<DownloadProgress | null>(null);
  const [parakeetModels, setParakeetModels] = useState<ParakeetModelInfo[]>([]);
  const [downloadingParakeet, setDownloadingParakeet] = useState<ParakeetModelSize | null>(null);
  const [parakeetDownloadProgress, setParakeetDownloadProgress] = useState<DownloadProgress | null>(null);

  const loadModels = async () => {
    try {
      const result = await invoke<ModelInfo[]>('get_available_models');
      setModels(result);
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  };

  const loadVoskModels = async () => {
    try {
      const result = await invoke<VoskModelInfo[]>('get_vosk_models');
      setVoskModels(result);
    } catch (e) {
      console.error('Failed to load Vosk models:', e);
    }
  };

  const loadParakeetModels = async () => {
    try {
      const result = await invoke<ParakeetModelInfo[]>('get_parakeet_models');
      setParakeetModels(result);
    } catch (e) {
      console.error('Failed to load Parakeet models:', e);
    }
  };

  useEffect(() => {
    loadModels();
    loadVoskModels();
    loadParakeetModels();
  }, []);

  useEffect(() => {
    const unlistenProgress = listen<DownloadProgress>('model-download-progress', (event) => {
      setDownloadProgress(event.payload);
    });

    const unlistenComplete = listen<ModelSize>('model-download-complete', () => {
      setDownloading(null);
      setDownloadProgress(null);
      loadModels();
    });

    const unlistenVoskProgress = listen<DownloadProgress>('vosk-download-progress', (event) => {
      setVoskDownloadProgress(event.payload);
    });

    const unlistenVoskComplete = listen<VoskLanguage>('vosk-download-complete', () => {
      setDownloadingVoskLang(null);
      setVoskDownloadProgress(null);
      loadVoskModels();
    });

    const unlistenParakeetProgress = listen<DownloadProgress>('parakeet-download-progress', (event) => {
      setParakeetDownloadProgress(event.payload);
    });

    const unlistenParakeetComplete = listen<ParakeetModelSize>('parakeet-download-complete', () => {
      setDownloadingParakeet(null);
      setParakeetDownloadProgress(null);
      loadParakeetModels();
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
      unlistenVoskProgress.then(fn => fn());
      unlistenVoskComplete.then(fn => fn());
      unlistenParakeetProgress.then(fn => fn());
      unlistenParakeetComplete.then(fn => fn());
    };
  }, []);

  const handleSwitchEngine = async (engineType: EngineType) => {
    try {
      await updateSettings({ engine_type: engineType });
    } catch (e) {
      console.error('Failed to switch engine:', e);
    }
  };

  const handleDownloadModel = async (size: ModelSize) => {
    setDownloading(size);
    setDownloadProgress({ downloaded: 0, total: 1, percent: 0 });
    try {
      await invoke('download_model', { size });
    } catch (e) {
      console.error('Download failed:', e);
      setDownloading(null);
      setDownloadProgress(null);
    }
  };

  const handleSwitchModel = async (size: ModelSize) => {
    try {
      await invoke('switch_model', { size });
      await loadSettings();
    } catch (e) {
      console.error('Switch failed:', e);
    }
  };

  const handleDeleteModel = async (size: ModelSize) => {
    if (size === 'tiny') return;
    if (settings?.whisper_model === size) {
      await handleSwitchModel('tiny');
    }
    try {
      await invoke('delete_model', { size });
      await loadModels();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleDownloadVoskModel = async (language: VoskLanguage) => {
    setDownloadingVoskLang(language);
    setVoskDownloadProgress({ downloaded: 0, total: 1, percent: 0 });
    try {
      await invoke('download_vosk_model', { language });
    } catch (e) {
      console.error('Vosk download failed:', e);
      setDownloadingVoskLang(null);
      setVoskDownloadProgress(null);
    }
  };

  const handleSelectVoskLanguage = async (language: VoskLanguage) => {
    try {
      await invoke('select_vosk_language', { language });
      await loadSettings();
    } catch (e) {
      console.error('Failed to select Vosk language:', e);
    }
  };

  const handleDownloadParakeetModel = async (size: ParakeetModelSize) => {
    setDownloadingParakeet(size);
    setParakeetDownloadProgress({ downloaded: 0, total: 1, percent: 0 });
    try {
      await invoke('download_parakeet_model', { size });
    } catch (e) {
      console.error('Parakeet download failed:', e);
      setDownloadingParakeet(null);
      setParakeetDownloadProgress(null);
    }
  };

  const handleDeleteParakeetModel = async (size: ParakeetModelSize) => {
    try {
      await invoke('delete_parakeet_model', { size });
      await loadParakeetModels();
    } catch (e) {
      console.error('Failed to delete Parakeet model:', e);
    }
  };

  const handleSelectParakeetModel = async (size: ParakeetModelSize) => {
    try {
      await invoke('select_parakeet_model', { size });
      await loadSettings();
    } catch (e) {
      console.error('Failed to select Parakeet model:', e);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="section-title success">Moteur de transcription</h3>

      {/* Engine Type Selector */}
      <div className="flex gap-2">
        {(['whisper', 'vosk', 'parakeet'] as EngineType[]).map((engine) => (
          <button
            key={engine}
            onClick={() => handleSwitchEngine(engine)}
            className={`flex-1 px-4 py-2.5 text-[0.8rem] font-medium rounded-xl border transition-all ${
              settings.engine_type === engine
                ? 'bg-[var(--accent-success-soft)] border-[var(--accent-success)] text-[var(--accent-success)]'
                : 'bg-[rgba(255,255,255,0.08)] border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--accent-success)]'
            }`}
          >
            {engine === 'whisper' && 'Whisper'}
            {engine === 'vosk' && 'Vosk'}
            {engine === 'parakeet' && 'Parakeet'}
          </button>
        ))}
      </div>

      {/* Whisper Models */}
      {settings.engine_type === 'whisper' && (
        <div className="space-y-3">
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            Whisper (OpenAI) - Haute precision, 99 langues
          </p>
          {models.map((model) => (
            <div
              key={model.size}
              className={`glass-card p-4 ${
                settings.whisper_model === model.size ? 'border-[var(--accent-success)]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    settings.whisper_model === model.size
                      ? 'bg-[var(--accent-success)]'
                      : 'bg-[var(--glass-border)]'
                  }`} />
                  <div>
                    <div className="text-[0.9375rem] text-[var(--text-primary)] font-medium">
                      {model.display_name}
                    </div>
                    {model.size === 'small' && (
                      <div className="text-[0.7rem] text-[var(--accent-primary)]">Recommande</div>
                    )}
                  </div>
                </div>

                {downloading === model.size ? (
                  <div className="flex items-center gap-3">
                    <div className="w-24 progress-frost">
                      <div className="bar" style={{ width: `${downloadProgress?.percent || 0}%` }} />
                    </div>
                    <span className="text-[0.75rem] text-[var(--text-muted)] w-12 text-right tabular-nums">
                      {Math.round(downloadProgress?.percent || 0)}%
                    </span>
                  </div>
                ) : model.available ? (
                  <div className="flex items-center gap-3">
                    {settings.whisper_model === model.size ? (
                      <span className="tag-frost success">Actif</span>
                    ) : (
                      <button
                        onClick={() => handleSwitchModel(model.size)}
                        className="text-[0.8rem] text-[var(--accent-primary)] hover:underline font-medium"
                      >
                        Utiliser
                      </button>
                    )}
                    {model.size !== 'tiny' && (
                      <button
                        onClick={() => handleDeleteModel(model.size)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors p-1"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadModel(model.size)}
                    className="btn-glass text-[0.8rem]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Telecharger
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vosk Models */}
      {settings.engine_type === 'vosk' && (
        <div className="space-y-3">
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            Vosk - Leger et rapide, modeles par langue
          </p>
          <div className="grid grid-cols-2 gap-2">
            {voskModels.map((model) => (
              <div
                key={model.language}
                className={`glass-card p-3 ${
                  settings.vosk_language === model.language ? 'border-[var(--accent-success)]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      settings.vosk_language === model.language
                        ? 'bg-[var(--accent-success)]'
                        : 'bg-[var(--glass-border)]'
                    }`} />
                    <span className="text-[0.8rem] text-[var(--text-primary)]">
                      {model.display_name}
                    </span>
                  </div>

                  {downloadingVoskLang === model.language ? (
                    <div className="flex items-center gap-1">
                      <div className="w-12 progress-frost">
                        <div className="bar" style={{ width: `${voskDownloadProgress?.percent || 0}%` }} />
                      </div>
                    </div>
                  ) : model.available ? (
                    settings.vosk_language === model.language ? (
                      <span className="text-[0.65rem] text-[var(--accent-success)]">Actif</span>
                    ) : (
                      <button
                        onClick={() => handleSelectVoskLanguage(model.language)}
                        className="text-[0.7rem] text-[var(--accent-primary)] hover:underline"
                      >
                        Utiliser
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleDownloadVoskModel(model.language)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parakeet Models */}
      {settings.engine_type === 'parakeet' && (
        <div className="space-y-3">
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            Parakeet TDT (NVIDIA) - Detection automatique, 25 langues europeennes
          </p>
          {parakeetModels.map((model) => (
            <div
              key={model.size}
              className={`glass-card p-4 ${
                settings.parakeet_model === model.size && model.available ? 'border-[var(--accent-success)]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    settings.parakeet_model === model.size && model.available
                      ? 'bg-[var(--accent-success)]'
                      : 'bg-[var(--glass-border)]'
                  }`} />
                  <div>
                    <div className="text-[0.9375rem] text-[var(--text-primary)] font-medium">
                      {model.display_name}
                    </div>
                    <div className="text-[0.7rem] text-[var(--text-muted)]">
                      ~{(model.size_bytes / 1_000_000_000).toFixed(1)} GB
                    </div>
                  </div>
                </div>

                {downloadingParakeet === model.size ? (
                  <div className="flex items-center gap-3">
                    <div className="w-24 progress-frost">
                      <div className="bar" style={{ width: `${parakeetDownloadProgress?.percent || 0}%` }} />
                    </div>
                    <span className="text-[0.75rem] text-[var(--text-muted)] w-12 text-right tabular-nums">
                      {Math.round(parakeetDownloadProgress?.percent || 0)}%
                    </span>
                  </div>
                ) : model.available ? (
                  <div className="flex items-center gap-3">
                    {settings.parakeet_model === model.size ? (
                      <span className="tag-frost success">Actif</span>
                    ) : (
                      <button
                        onClick={() => handleSelectParakeetModel(model.size)}
                        className="text-[0.8rem] text-[var(--accent-primary)] hover:underline font-medium"
                      >
                        Utiliser
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteParakeetModel(model.size)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors p-1"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadParakeetModel(model.size)}
                    className="btn-glass text-[0.8rem]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Telecharger
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
