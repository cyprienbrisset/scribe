import { AppSettings } from '../../types';
import { HotkeyInput } from '../HotkeyInput';

interface TranslationSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  apiKeyStatus: 'valid' | 'invalid' | null;
}

export function TranslationSection({ settings, updateSettings, apiKeyStatus }: TranslationSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title warning">Traduction</h3>

      <div className="space-y-4">
        <label className="checkbox-frost">
          <input
            type="checkbox"
            checked={settings.translation_enabled}
            onChange={(e) => updateSettings({ translation_enabled: e.target.checked })}
          />
          <span className="check-box" />
          <div>
            <span className="check-label block">Traduction instantanee</span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">
              Traduit le texte du presse-papier via Groq
            </span>
          </div>
        </label>

        {settings.translation_enabled && (
          <>
            <div>
              <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Langue cible</label>
              <select
                value={settings.translation_target_language}
                onChange={(e) => updateSettings({ translation_target_language: e.target.value })}
                className="select-glass"
              >
                <option value="en">English</option>
                <option value="fr">Francais</option>
                <option value="de">Deutsch</option>
                <option value="es">Espanol</option>
                <option value="it">Italiano</option>
                <option value="pt">Portugues</option>
                <option value="nl">Nederlands</option>
                <option value="ru">Russkiy</option>
                <option value="zh">Zhongwen</option>
                <option value="ja">Nihongo</option>
                <option value="ko">Hangugeo</option>
                <option value="ar">Arabiy</option>
              </select>
            </div>

            <div>
              <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Raccourci traduction</label>
              <HotkeyInput
                value={settings.hotkey_translate}
                onChange={(hotkey) => updateSettings({ hotkey_translate: hotkey })}
              />
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-2">
                Copiez du texte, puis appuyez sur le raccourci pour traduire
              </p>
            </div>

            {!apiKeyStatus && (
              <div className="glass-card p-4 border-[var(--accent-warning)]">
                <p className="text-[0.8rem] text-[var(--accent-warning)]">
                  ⚠️ Une cle API Groq est requise pour la traduction.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
