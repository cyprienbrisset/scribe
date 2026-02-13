import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { HotkeyInput } from '../HotkeyInput';

interface StepProps {
  onValidChange: (valid: boolean) => void;
}

function formatHotkey(hotkey: string): string {
  return hotkey
    .replace('CommandOrControl', '\u{2318}')
    .replace('Command', '\u{2318}')
    .replace('Control', 'Ctrl')
    .replace('Shift', '\u{21E7}')
    .replace('Alt', '\u{2325}')
    .replace('Space', 'Espace')
    .replace(/\+/g, ' + ');
}

export function ShortcutsStep({ onValidChange }: StepProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [editingPtt, setEditingPtt] = useState(false);
  const [editingToggle, setEditingToggle] = useState(false);

  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">
          Raccourcis clavier
        </h2>
        <p className="text-[var(--text-secondary)] text-[0.85rem]">
          Configurez les raccourcis pour controler la dictee vocale.
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[0.9rem] text-[var(--text-primary)] font-medium">Push-to-talk</span>
              <p className="text-[0.7rem] text-[var(--text-muted)]">Maintenir pour dicter, relacher pour transcrire</p>
            </div>
            {!editingPtt && (
              <div className="flex items-center gap-3">
                <span className="kbd-frost">{formatHotkey(settings?.hotkey_push_to_talk || 'Control+Space')}</span>
                <button
                  onClick={() => setEditingPtt(true)}
                  className="text-[0.75rem] text-[var(--accent-primary)] hover:underline"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>
          {editingPtt && (
            <div className="mt-3">
              <HotkeyInput
                value={settings?.hotkey_push_to_talk || 'Control+Space'}
                onChange={async (hotkey) => {
                  await updateSettings({ hotkey_push_to_talk: hotkey });
                  setEditingPtt(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[0.9rem] text-[var(--text-primary)] font-medium">Toggle enregistrement</span>
              <p className="text-[0.7rem] text-[var(--text-muted)]">Appuyer pour demarrer/arreter l'enregistrement</p>
            </div>
            {!editingToggle && (
              <div className="flex items-center gap-3">
                <span className="kbd-frost">{formatHotkey(settings?.hotkey_toggle_record || 'Control+Shift+R')}</span>
                <button
                  onClick={() => setEditingToggle(true)}
                  className="text-[0.75rem] text-[var(--accent-primary)] hover:underline"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>
          {editingToggle && (
            <div className="mt-3">
              <HotkeyInput
                value={settings?.hotkey_toggle_record || 'Control+Shift+R'}
                onChange={async (hotkey) => {
                  await updateSettings({ hotkey_toggle_record: hotkey });
                  setEditingToggle(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[var(--text-muted)] text-[0.75rem] mt-6">
        Vous pourrez modifier tous les raccourcis dans les parametres.
      </p>
    </div>
  );
}
