import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ModelInfo, ModelSize, DownloadProgress } from '../../types';

interface StepProps {
  onValidChange: (valid: boolean) => void;
}

export function ModelStep({ onValidChange }: StepProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloading, setDownloading] = useState<ModelSize | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    onValidChange(downloading === null);
  }, [downloading, onValidChange]);

  useEffect(() => {
    const unlistenProgress = listen<DownloadProgress>('model-download-progress', (event) => {
      setDownloadProgress(event.payload);
    });

    const unlistenComplete = listen<ModelSize>('model-download-complete', () => {
      setDownloading(null);
      setDownloadProgress(null);
      setDownloadComplete(true);
      loadModels();
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, []);

  const loadModels = async () => {
    try {
      const result = await invoke<ModelInfo[]>('get_available_models');
      setModels(result);
    } catch (e) {
      console.error('Failed to load models:', e);
    }
  };

  const handleDownload = async (size: ModelSize) => {
    setDownloading(size);
    setDownloadProgress({ downloaded: 0, total: 1, percent: 0 });
    setDownloadComplete(false);
    try {
      await invoke('download_model', { size });
    } catch (e) {
      console.error('Download failed:', e);
      setDownloading(null);
      setDownloadProgress(null);
    }
  };

  const qualityLabels: Record<ModelSize, string> = {
    tiny: 'Basique',
    small: 'Bonne',
    medium: 'Tres bonne',
  };

  const qualityColors: Record<ModelSize, string> = {
    tiny: 'var(--text-muted)',
    small: 'var(--accent-primary)',
    medium: 'var(--accent-success)',
  };

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">
          Modele de reconnaissance vocale
        </h2>
        <p className="text-[var(--text-secondary)] text-[0.85rem]">
          Choisissez la qualite de transcription. Le modele Tiny est deja inclus.
        </p>
      </div>

      <div className="space-y-3">
        {models.map((model) => (
          <div
            key={model.size}
            className={`glass-card p-5 transition-all ${
              model.available && model.size !== 'tiny' ? 'border-[var(--accent-success)]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  model.size === 'tiny'
                    ? 'bg-[rgba(255,255,255,0.08)]'
                    : model.size === 'small'
                    ? 'bg-[rgba(124,138,255,0.15)]'
                    : 'bg-[rgba(122,239,178,0.15)]'
                }`}>
                  <span className="text-[0.85rem] font-medium" style={{ color: qualityColors[model.size] }}>
                    {model.size === 'tiny' ? 'T' : model.size === 'small' ? 'S' : 'M'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.95rem] text-[var(--text-primary)] font-medium">
                      {model.display_name}
                    </span>
                    {model.size === 'tiny' && (
                      <span className="tag-frost text-[0.6rem]">Inclus</span>
                    )}
                    {model.size === 'small' && (
                      <span className="text-[0.65rem] text-[var(--accent-primary)]">Recommande</span>
                    )}
                  </div>
                  <span className="text-[0.75rem]" style={{ color: qualityColors[model.size] }}>
                    Qualite: {qualityLabels[model.size]}
                  </span>
                </div>
              </div>

              {downloading === model.size ? (
                <div className="flex items-center gap-3">
                  <div className="w-28 progress-frost">
                    <div className="bar" style={{ width: `${downloadProgress?.percent || 0}%` }} />
                  </div>
                  <span className="text-[0.75rem] text-[var(--text-muted)] w-12 text-right tabular-nums">
                    {Math.round(downloadProgress?.percent || 0)}%
                  </span>
                </div>
              ) : model.available ? (
                <span className="tag-frost success">Installe</span>
              ) : (
                <button
                  onClick={() => handleDownload(model.size)}
                  disabled={downloading !== null}
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

      {downloadComplete && (
        <p className="text-center text-[var(--accent-success)] text-[0.8rem] mt-4">
          Modele telecharge avec succes !
        </p>
      )}
    </div>
  );
}
