import { invoke } from '@tauri-apps/api/core';
import { AppSettings } from '../../types';

interface SystemSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function SystemSection({ settings, updateSettings }: SystemSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title warning">Integration Systeme</h3>

      <div className="space-y-3">
        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.streaming_enabled}
            onChange={(e) => updateSettings({ streaming_enabled: e.target.checked })}
          />
          <span className="check-box" />
          <div>
            <span className="check-label block">Streaming temps reel</span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">Affiche le texte pendant l'enregistrement</span>
          </div>
        </label>

        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.auto_paste_enabled}
            onChange={(e) => updateSettings({ auto_paste_enabled: e.target.checked })}
          />
          <span className="check-box" />
          <div>
            <span className="check-label block">Coller automatiquement</span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">Colle le texte dans l'app active apres transcription</span>
          </div>
        </label>

        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.floating_window_enabled}
            onChange={async (e) => {
              const enabled = e.target.checked;
              await updateSettings({ floating_window_enabled: enabled });
              try {
                if (enabled) {
                  await invoke('show_floating_window');
                } else {
                  await invoke('hide_floating_window');
                }
              } catch (err) {
                console.error('Failed to toggle floating window:', err);
              }
            }}
          />
          <span className="check-box" />
          <div>
            <span className="check-label block">Fenetre flottante</span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">Affiche une mini-fenetre toujours visible</span>
          </div>
        </label>
      </div>
    </section>
  );
}
