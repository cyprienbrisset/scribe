import { useEffect } from 'react';
import { useTranscriptionStore } from '../stores/transcriptionStore';

export function TranscriptionHistory() {
  const { history, loadHistory, clearHistory } = useTranscriptionStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-[var(--text-muted)] text-sm uppercase tracking-wider">Aucun historique</p>
        <p className="text-[var(--text-muted)] text-xs mt-1 opacity-60">Les transcriptions apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--text-secondary)] font-medium">
            Historique
          </span>
          <span className="px-2 py-0.5 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-[0.6rem] font-mono">
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="btn-panel text-[0.65rem] flex items-center gap-1.5 text-[var(--accent-red)] border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Effacer
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {history.map((item, index) => (
          <div
            key={`${item.timestamp}-${index}`}
            className="history-item panel p-0 overflow-hidden hover:border-[var(--accent-cyan)]/50 transition-colors cursor-default"
          >
            {/* Item header */}
            <div className="px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
                <span className="text-[0.6rem] text-[var(--text-muted)] font-mono">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <span className="text-[0.6rem] text-[var(--text-muted)] font-mono">
                {item.duration_seconds.toFixed(1)}s
              </span>
            </div>

            {/* Item content */}
            <div className="px-4 py-3">
              <p className="text-[var(--text-primary)] text-sm leading-relaxed line-clamp-3">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
