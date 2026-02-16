// Sons de feedback PTT — chimes doux style Gemini Live via Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Attaque douce + decay naturel
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Chime ascendant doux — activation PTT */
export function playStartSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Accord de Do majeur ascendant (C5 → E5 → G5) avec harmoniques douces
  playTone(ctx, 523.25, now, 0.3, 0.09);          // C5
  playTone(ctx, 1046.5, now, 0.25, 0.03);          // C6 harmonique
  playTone(ctx, 659.25, now + 0.07, 0.28, 0.09);   // E5
  playTone(ctx, 1318.5, now + 0.07, 0.22, 0.03);   // E6 harmonique
  playTone(ctx, 783.99, now + 0.14, 0.35, 0.11);    // G5 — tenu plus longtemps
  playTone(ctx, 1567.98, now + 0.14, 0.28, 0.035);  // G6 harmonique
}

/** Chime descendant doux — désactivation PTT */
export function playStopSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Deux notes descendantes (G5 → E5), plus court et discret
  playTone(ctx, 783.99, now, 0.22, 0.08);          // G5
  playTone(ctx, 1567.98, now, 0.18, 0.025);         // G6 harmonique
  playTone(ctx, 523.25, now + 0.08, 0.3, 0.08);    // C5
  playTone(ctx, 1046.5, now + 0.08, 0.25, 0.025);   // C6 harmonique
}
