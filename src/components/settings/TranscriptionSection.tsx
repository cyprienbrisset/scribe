import { AppSettings } from '../../types';

interface TranscriptionSectionProps {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function TranscriptionSection({ settings, updateSettings }: TranscriptionSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title secondary">Transcription</h3>

      <div>
        <label className="text-[0.8rem] text-[var(--text-muted)] mb-2 block">Langue</label>
        <select
          value={settings.auto_detect_language ? 'auto' : settings.transcription_language}
          onChange={(e) => {
            if (e.target.value === 'auto') {
              updateSettings({ auto_detect_language: true });
            } else {
              updateSettings({
                transcription_language: e.target.value,
                auto_detect_language: false
              });
            }
          }}
          className="select-glass"
        >
          <option value="auto">Automatique (detection)</option>
          <option value="fr">Francais</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="es">Espanol</option>
          <option value="it">Italiano</option>
          <option value="pt">Portugues</option>
          <option value="nl">Nederlands</option>
          <option value="pl">Polski</option>
          <option value="ru">Russkiy</option>
          <option value="ja">Nihongo</option>
          <option value="zh">Zhongwen</option>
          <option value="ko">Hangugeo</option>
        </select>
      </div>
    </section>
  );
}
