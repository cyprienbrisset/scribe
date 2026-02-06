import { AppSettings, AudioDevice } from '../../types';

interface AudioSectionProps {
  settings: AppSettings;
  devices: AudioDevice[];
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export function AudioSection({ settings, devices, updateSettings }: AudioSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="section-title primary">Audio</h3>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[0.8rem] text-[rgba(255,255,255,0.75)] mb-2 block">Microphone</span>
          <select
            value={settings.microphone_id || ''}
            onChange={(e) => updateSettings({ microphone_id: e.target.value || null })}
            className="select-glass"
          >
            <option value="">Par defaut</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} {device.is_default ? '(defaut)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
