import { open } from '@tauri-apps/plugin-dialog';
import { AppSettings } from '../../types';

interface IntegrationsSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function IntegrationsSection({ settings, updateSettings }: IntegrationsSectionProps) {
  const isMacOS = navigator.userAgent.includes('Mac');

  const handleSelectVault = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        await updateSettings({
          integrations: {
            ...settings.integrations,
            obsidian_vault_path: selected,
          },
        });
      }
    } catch (e) {
      console.error('Failed to select vault:', e);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="section-title secondary">Integrations</h3>

      {isMacOS && (
        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.integrations.apple_notes_enabled}
            onChange={(e) =>
              updateSettings({
                integrations: { ...settings.integrations, apple_notes_enabled: e.target.checked },
              })
            }
          />
          <span className="check-box" />
          <span className="check-label">Apple Notes</span>
        </label>
      )}

      <div className="space-y-3">
        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.integrations.obsidian_enabled}
            onChange={(e) =>
              updateSettings({
                integrations: { ...settings.integrations, obsidian_enabled: e.target.checked },
              })
            }
          />
          <span className="check-box" />
          <span className="check-label">Obsidian</span>
        </label>

        {settings.integrations.obsidian_enabled && (
          <div className="ml-6 space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={settings.integrations.obsidian_vault_path || ''}
                readOnly
                placeholder="Selectionner un vault..."
                className="input-glass flex-1 text-[0.8rem]"
              />
              <button
                onClick={handleSelectVault}
                className="btn-glass px-3 text-[var(--accent-primary)]"
              >
                Parcourir
              </button>
            </div>
            {settings.integrations.obsidian_vault_path && (
              <p className="text-[0.7rem] text-[var(--text-muted)] truncate">
                {settings.integrations.obsidian_vault_path}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
