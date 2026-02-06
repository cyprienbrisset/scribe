import { AppSettings } from '../../types';

interface OptionsSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function OptionsSection({ settings, updateSettings }: OptionsSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title">Options</h3>

      <div className="space-y-3">
        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.auto_copy_to_clipboard}
            onChange={(e) => updateSettings({ auto_copy_to_clipboard: e.target.checked })}
          />
          <span className="check-box" />
          <span className="check-label">Copier automatiquement dans le presse-papier</span>
        </label>

        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.notification_on_complete}
            onChange={(e) => updateSettings({ notification_on_complete: e.target.checked })}
          />
          <span className="check-box" />
          <span className="check-label">Notification a la fin de la transcription</span>
        </label>

        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.minimize_to_tray}
            onChange={(e) => updateSettings({ minimize_to_tray: e.target.checked })}
          />
          <span className="check-box" />
          <span className="check-label">Minimiser dans la barre systeme</span>
        </label>
      </div>
    </section>
  );
}
