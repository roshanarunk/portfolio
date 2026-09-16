/**
 * Audio cues via Web Audio. No files, no dependencies — tones are synthesised,
 * which also means zero load latency when a cue must fire on an exact frame.
 *
 * Browsers suspend AudioContext until a user gesture, so resume() must be
 * called from a click/keypress handler before the first cue.
 */

export class AudioCues {
  constructor() {
    this.ctx = null;
    this.volume = 0.4;
    this.enabled = true;
  }

  /** Create/resume the context. Must be called from a user gesture. */
  async resume() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx.state === "running";
  }

  /**
   * Short percussive blip.
   * @param {number} freq
   * @param {number} durationMs
   */
  tone(freq = 880, durationMs = 60) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    // Quick attack, exponential decay: audible onset without a click.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }

  /** The combo's first input. */
  start() { this.tone(660, 70); }
  /** A follow-up input is due. */
  step() { this.tone(880, 55); }
  /** Input landed inside its buffer window. */
  hit() { this.tone(1320, 45); }
  /** Input missed its window. */
  miss() { this.tone(200, 110); }
  /** Combo completed. */
  finish() { this.tone(1760, 140); }
}
