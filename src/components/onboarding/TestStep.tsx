import { useEffect, useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../../stores/settingsStore';
import { AudioWaveform } from '../AudioWaveform';

interface StepProps {
  onValidChange: (valid: boolean) => void;
}

const TEST_PHRASES: Record<string, string> = {
  fr: 'Le soleil brille aujourd\'hui',
  en: 'The sun is shining today',
  es: 'El sol brilla hoy',
  de: 'Die Sonne scheint heute',
  it: 'Il sole splende oggi',
  pt: 'O sol brilha hoje',
  ja: '今日は太陽が輝いています',
  zh: '今天阳光灿烂',
  ko: '오늘 태양이 빛나고 있어요',
  ru: 'Сегодня светит солнце',
  nl: 'De zon schijnt vandaag',
  pl: 'Słońce świeci dzisiaj',
};

type TestStatus = 'idle' | 'countdown' | 'recording' | 'processing' | 'done';

export function TestStep({ onValidChange }: StepProps) {
  const { settings } = useSettingsStore();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewActive, setPreviewActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang = settings?.transcription_language || 'fr';
  const testPhrase = TEST_PHRASES[lang] || TEST_PHRASES['fr'];

  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      invoke('stop_mic_preview').catch(() => {});
    };
  }, []);

  const beginRecording = useCallback(async () => {
    setStatus('recording');
    setRecordingTime(0);

    // Start mic preview for waveform
    try {
      await invoke('start_mic_preview', { deviceId: settings?.microphone_id || null });
      setPreviewActive(true);
    } catch (e) {
      console.error('Failed to start mic preview:', e);
    }

    // Start actual recording
    try {
      await invoke('start_recording');
    } catch (e) {
      console.error('Failed to start recording:', e);
      setStatus('idle');
      return;
    }

    // Timer for recording duration
    let elapsed = 0;
    recordTimerRef.current = setInterval(() => {
      elapsed += 0.1;
      setRecordingTime(elapsed);
      if (elapsed >= 5) {
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        finishRecording();
      }
    }, 100);
  }, [settings?.microphone_id]);

  const finishRecording = async () => {
    setStatus('processing');
    setPreviewActive(false);
    await invoke('stop_mic_preview').catch(() => {});

    try {
      const res = await invoke<{ text: string }>('stop_recording');
      setResult(res.text.trim());
      setStatus('done');
    } catch (e) {
      console.error('Transcription failed:', e);
      setResult(null);
      setStatus('idle');
    }
  };

  const startTest = useCallback(async () => {
    setResult(null);
    setStatus('countdown');
    setCountdown(3);

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        beginRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [beginRecording]);

  const similarity = result ? computeSimilarity(testPhrase.toLowerCase(), result.toLowerCase()) : 0;
  const isGoodMatch = similarity >= 0.5;

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <h2 className="font-display text-xl text-[var(--text-primary)] mb-2">
          Test de transcription
        </h2>
        <p className="text-[var(--text-secondary)] text-[0.85rem]">
          Verifiez que tout fonctionne en repetant la phrase ci-dessous.
        </p>
      </div>

      {/* Target phrase */}
      <div className="glass-card p-5 mb-6 text-center">
        <p className="text-[0.75rem] text-[var(--text-muted)] mb-2">Phrase a repeter :</p>
        <p className="text-[1.1rem] text-[var(--text-primary)] font-medium">
          &laquo; {testPhrase} &raquo;
        </p>
      </div>

      {/* Action area */}
      <div className="flex flex-col items-center gap-4">
        {status === 'idle' && (
          <button
            onClick={startTest}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-[0.9rem] font-medium hover:opacity-90 transition-all flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Enregistrer
          </button>
        )}

        {status === 'countdown' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.08)] border-2 border-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-3xl font-bold text-[var(--accent-primary)]">{countdown}</span>
            </div>
            <p className="text-[0.85rem] text-[var(--text-secondary)]">Preparez-vous...</p>
          </div>
        )}

        {status === 'recording' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-danger)] animate-pulse" />
              <span className="text-[0.85rem] text-[var(--accent-danger)] font-medium">
                Enregistrement... {recordingTime.toFixed(1)}s / 5s
              </span>
            </div>
            <div className="glass-card p-3 w-full flex items-center justify-center">
              <AudioWaveform active={previewActive} width={280} height={50} barColor="var(--accent-danger)" />
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-danger)] transition-all duration-100"
                style={{ width: `${(recordingTime / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <p className="text-[0.85rem] text-[var(--text-secondary)]">Transcription en cours...</p>
          </div>
        )}

        {status === 'done' && result !== null && (
          <div className="w-full max-w-sm space-y-4">
            {/* Result comparison */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                {isGoodMatch ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warning, #f0a030)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span className={`text-[0.85rem] font-medium ${isGoodMatch ? 'text-[var(--accent-success)]' : 'text-[#f0a030]'}`}>
                  {isGoodMatch ? 'Transcription reussie !' : 'Resultat partiel'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[0.7rem] text-[var(--text-muted)] mb-1">Attendu :</p>
                  <p className="text-[0.85rem] text-[var(--text-secondary)]">{testPhrase}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] text-[var(--text-muted)] mb-1">Obtenu :</p>
                  <p className="text-[0.85rem] text-[var(--text-primary)] font-medium">{result || '(aucun texte)'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setStatus('idle'); setResult(null); }}
              className="btn-glass w-full"
            >
              Reessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple word-overlap similarity (0-1) */
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.split(/\s+/).filter(Boolean));
  if (wordsA.size === 0) return 0;
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) matches++;
  }
  return matches / wordsA.size;
}
