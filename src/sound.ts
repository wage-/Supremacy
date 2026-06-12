// Minimal chiptune-synth via WebAudio — en blinkning till Amiga-introt.
const MUTE_KEY = 'supremacy-muted';

let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  // ignorera
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignorera
  }
  return muted;
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.04,
): void {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const start = ac.currentTime + startOffset;
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export type SoundName = 'click' | 'error' | 'day' | 'battle' | 'good' | 'win' | 'lose' | 'title';

const SEQUENCES: Record<SoundName, Array<[number, number, number]>> = {
  // [frekvens, startoffset, längd]
  click: [[880, 0, 0.05]],
  error: [[220, 0, 0.12], [180, 0.1, 0.18]],
  day: [[523, 0, 0.06], [659, 0.07, 0.08]],
  battle: [[110, 0, 0.2], [98, 0.15, 0.2], [87, 0.3, 0.3]],
  good: [[523, 0, 0.08], [659, 0.09, 0.08], [784, 0.18, 0.14]],
  win: [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.12], [1047, 0.4, 0.4]],
  lose: [[392, 0, 0.25], [330, 0.25, 0.25], [262, 0.5, 0.5]],
  title: [[262, 0, 0.1], [392, 0.12, 0.1], [523, 0.24, 0.1], [659, 0.36, 0.25]],
};

export function play(name: SoundName): void {
  if (muted) return;
  for (const [freq, offset, dur] of SEQUENCES[name]) {
    tone(freq, offset, dur, name === 'battle' ? 'sawtooth' : 'square');
  }
}
