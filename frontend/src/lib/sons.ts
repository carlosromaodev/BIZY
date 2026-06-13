/**
 * Bizy — UI Sound Effects (Web Audio API)
 * Synthesized micro-sounds for interaction feedback.
 * No external audio files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === "suspended") void c.resume();
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.08) {
  try {
    resumeCtx();
    const c = getCtx();
    const osc = c.createOscillator();
    const vol = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(vol);
    vol.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // Audio not available — fail silently
  }
}

/** Soft click — for button presses and toggles */
export function somClique() {
  playTone(800, 0.06, "sine", 0.05);
}

/** Success chime — for completed actions (two ascending tones) */
export function somSucesso() {
  playTone(523, 0.12, "sine", 0.06);
  setTimeout(() => playTone(784, 0.18, "sine", 0.06), 80);
}

/** Step forward — for wizard/onboarding progression */
export function somPasso() {
  playTone(660, 0.1, "triangle", 0.04);
}

/** Gentle error — for validation failures */
export function somErro() {
  playTone(280, 0.15, "sine", 0.05);
}

/** Celebration — for major completion (three ascending tones) */
export function somCelebracao() {
  playTone(523, 0.15, "sine", 0.06);
  setTimeout(() => playTone(659, 0.15, "sine", 0.06), 100);
  setTimeout(() => playTone(784, 0.25, "sine", 0.07), 200);
}

/** Tab switch — subtle toggle sound */
export function somAlternar() {
  playTone(600, 0.04, "sine", 0.03);
}
