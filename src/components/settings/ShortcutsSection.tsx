import { AppSettings } from '../../types';
import { HotkeyInput } from '../HotkeyInput';

interface ShortcutsSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function ShortcutsSection({ settings, updateSettings }: ShortcutsSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title primary">Raccourcis</h3>

      <div className="space-y-4">
        <div>
          <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Push-to-talk (maintenir)</label>
          <HotkeyInput
            value={settings.hotkey_push_to_talk}
            onChange={(hotkey) => updateSettings({ hotkey_push_to_talk: hotkey })}
          />
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">Dicte et colle le texte transcrit</p>
        </div>
        <div>
          <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Voice Action (maintenir)</label>
          <HotkeyInput
            value={settings.hotkey_voice_action}
            onChange={(hotkey) => updateSettings({ hotkey_voice_action: hotkey })}
          />
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">Selectionne du texte, parle une instruction (ex: "resume", "traduis")</p>
        </div>
        <div>
          <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Traduction rapide</label>
          <HotkeyInput
            value={settings.hotkey_translate}
            onChange={(hotkey) => updateSettings({ hotkey_translate: hotkey })}
          />
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">Traduit le texte selectionne vers la langue cible</p>
        </div>
        <div>
          <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Toggle enregistrement</label>
          <HotkeyInput
            value={settings.hotkey_toggle_record}
            onChange={(hotkey) => updateSettings({ hotkey_toggle_record: hotkey })}
          />
        </div>
      </div>
      <p className="text-[0.75rem] text-[var(--text-muted)]">
        Redemarrez l'application pour appliquer les changements de raccourcis.
      </p>
    </section>
  );
}
