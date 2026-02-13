import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { UsageStats } from '../types';

export function StatisticsPanel() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await invoke<UsageStats>('get_usage_stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleReset = async () => {
    try {
      await invoke('reset_stats');
      loadStats();
    } catch (e) {
      console.error('Failed to reset stats:', e);
    }
  };

  if (!stats) return null;

  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Time saved estimation: average typing speed ~40 words/min, voice ~150 words/min
  const timeSavedMins = Math.round(stats.total_words * (1/40 - 1/150));

  // Last 7 days chart data
  const today = new Date();
  const last7Days: { date: string; label: string; words: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const daily = stats.daily_stats[key];
    last7Days.push({ date: key, label: dayLabel, words: daily?.words ?? 0 });
  }
  const maxWords = Math.max(...last7Days.map(d => d.words), 1);

  // Language distribution
  const totalLangUses = Object.values(stats.languages_used).reduce((a, b) => a + b, 0);
  const langEntries = Object.entries(stats.languages_used).sort((a, b) => b[1] - a[1]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title secondary">Statistiques</h3>
        <button onClick={handleReset} className="btn-glass text-[0.7rem] py-1 px-2 text-[var(--accent-danger)]">
          Reinitialiser
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{stats.total_words.toLocaleString()}</div>
          <div className="text-[0.7rem] text-[var(--text-muted)]">Mots dictes</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{stats.total_transcriptions.toLocaleString()}</div>
          <div className="text-[0.7rem] text-[var(--text-muted)]">Transcriptions</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{formatDuration(stats.total_duration_secs)}</div>
          <div className="text-[0.7rem] text-[var(--text-muted)]">Temps total</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-[var(--accent-primary)]">~{timeSavedMins}m</div>
          <div className="text-[0.7rem] text-[var(--text-muted)]">Temps estime gagne</div>
        </div>
      </div>

      {/* 7-day chart */}
      <div className="glass-card p-4">
        <div className="text-[0.75rem] text-[var(--text-secondary)] font-medium mb-3">7 derniers jours</div>
        <div className="flex items-end gap-2 h-20">
          {last7Days.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                <div
                  className="w-full max-w-[24px] rounded-t-md bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                  style={{ height: `${Math.max((day.words / maxWords) * 60, day.words > 0 ? 4 : 0)}px` }}
                  title={`${day.words} mots`}
                />
              </div>
              <span className="text-[0.6rem] text-[var(--text-muted)]">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Language distribution */}
      {langEntries.length > 0 && (
        <div className="glass-card p-4">
          <div className="text-[0.75rem] text-[var(--text-secondary)] font-medium mb-3">Langues utilisees</div>
          <div className="space-y-2">
            {langEntries.map(([lang, count]) => (
              <div key={lang} className="flex items-center gap-3">
                <span className="text-[0.75rem] text-[var(--text-primary)] w-8 uppercase">{lang}</span>
                <div className="flex-1 h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
                    style={{ width: `${(count / totalLangUses) * 100}%` }}
                  />
                </div>
                <span className="text-[0.65rem] text-[var(--text-muted)] tabular-nums w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
