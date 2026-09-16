/**
 * A fixed-step 60Hz frame clock.
 *
 * Two rates are deliberately separated here, because conflating them is what
 * makes browser timing feel wrong:
 *
 *   The LOGICAL clock is exactly 60Hz. Frame N begins at origin + N*(1000/60),
 *   computed from a fixed origin so per-tick overshoot cannot accumulate into
 *   drift. This is display-rate independent: a 144Hz or 30Hz monitor produces
 *   the same frame numbers for the same wall-clock instants.
 *
 *   The SAMPLING rate is how often we look at the controller. requestAnimation-
 *   Frame is vsync-coupled, so on a 60Hz display it samples once per frame with
 *   unknown phase — a press can sit up to a full frame before being seen. A
 *   faster timer reduces that, at the cost of some CPU.
 *
 * What cannot be fixed at any sampling rate: this clock is not phase-locked to
 * SF6's own frame boundaries, so there is an irreducible ~1 frame of
 * quantization between the two. Sampling faster tightens OUR error; it does not
 * align the two clocks.
 */

export const FRAME_MS = 1000 / 60;

/** Frame number for a timestamp, relative to an origin. */
export const frameAt = (timestamp, origin) => Math.round((timestamp - origin) / FRAME_MS);

/** Wall-clock time of a frame boundary. */
export const timeOfFrame = (frame, origin) => origin + frame * FRAME_MS;

/**
 * Drives a fixed-step callback at 60Hz logical frames.
 *
 * @param {Object} opts
 * @param {(frame:number)=>void} opts.onFrame  Called once per elapsed logical frame.
 * @param {()=>void} [opts.onSample]           Called every poll, faster than 60Hz.
 * @param {number} [opts.sampleMs]  Polling interval. 1ms targets 1000Hz; the
 *   achieved rate depends on the platform's timer resolution and on how often
 *   the Gamepad API actually publishes new state.
 * @param {()=>number} [opts.now]
 */
export class FrameClock {
  constructor({ onFrame, onSample, sampleMs = 1, now = () => performance.now() }) {
    this.onFrame = onFrame;
    this.onSample = onSample;
    this.sampleMs = sampleMs;
    this.now = now;
    this.origin = 0;
    this.frame = 0;
    this.timer = null;
    this.running = false;
    /** Rolling sample-rate estimate, for the UI's health indicator. */
    this.sampleHz = 0;
    this._samples = 0;
    this._windowStart = 0;
  }

  start(origin = this.now()) {
    if (this.running) return;
    this.origin = origin;
    this.frame = 0;
    this.running = true;
    this._samples = 0;
    this._windowStart = origin;

    // setInterval rather than rAF: rAF is capped at the display refresh rate
    // and is throttled hard in background tabs, both of which we want to avoid
    // for input sampling.
    this.timer = setInterval(() => this.tick(), this.sampleMs);
    // A frame clock should never be the reason a process stays alive. Without
    // this, a running clock keeps Node's event loop open and `node --test`
    // hangs forever instead of exiting.
    this.timer.unref?.();
  }

  stop() {
    this.running = false;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  tick() {
    if (!this.running) return;
    const t = this.now();

    this.onSample?.();

    // Measure the achieved sample rate over a 500ms window.
    this._samples++;
    if (t - this._windowStart >= 500) {
      this.sampleHz = Math.round((this._samples * 1000) / (t - this._windowStart));
      this._samples = 0;
      this._windowStart = t;
    }

    // Advance the logical clock to wherever real time says we are, firing every
    // frame in between. Equality checks would silently skip frames under load.
    const target = Math.floor((t - this.origin) / FRAME_MS);
    while (this.frame < target) {
      this.frame++;
      this.onFrame(this.frame);
    }
  }
}
