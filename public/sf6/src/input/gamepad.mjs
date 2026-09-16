/**
 * Gamepad API input source.
 *
 * Polls via requestAnimationFrame. Two browser constraints shape this:
 *
 *  - A page sees no gamepad at all until the user presses a button on it, so
 *    the UI needs a "press any button" gate rather than reporting "no pad".
 *  - rAF is vsync-coupled (~60Hz, the same rate as the signal being sampled),
 *    so expect ±1-2 frames of jitter. That is adequate for rhythm training but
 *    not for frame-accurate verdicts; see the accuracy notes in the README.
 */

import { InputSource, DEFAULT_PAD_PROFILE, toNumpad } from "./source.mjs";

/** Standard Gamepad API button indices -> the names used in profiles. */
const BUTTON_NAMES = {
  0: "A", 1: "B", 2: "X", 3: "Y",
  4: "LB", 5: "RB", 6: "LT", 7: "RT",
  8: "BACK", 9: "START", 10: "LS", 11: "RS",
  12: "DUP", 13: "DDOWN", 14: "DLEFT", 15: "DRIGHT",
};

export class GamepadSource extends InputSource {
  constructor(profile = DEFAULT_PAD_PROFILE) {
    super();
    this.profile = profile;
    // Must be initialized: start() guards on `this.timer !== null`, and an
    // undefined field would make that guard true and skip polling entirely.
    this.timer = null;
    this.worker = null;
    this.padIndex = null;
    /** Buttons held on the previous poll, so only fresh presses are emitted. */
    this.prevPressed = new Set();
  }

  /**
   * @param {number} [pollMs] Polling interval in ms; 1 targets 1000Hz.
   *
   * setInterval rather than requestAnimationFrame: rAF is capped at the display
   * refresh rate (so ~60Hz on a 60Hz panel) and is throttled hard in background
   * tabs. A timer keeps sampling independent of the display.
   */
  start(pollMs = 1) {
    if (this.timer !== null || this.worker) return;

    // Prefer a Web Worker: the HTML spec clamps nested page timers to a 4ms
    // minimum (~230Hz), and that budget is per browsing context, so a worker
    // ticks faster. It cannot read the Gamepad API itself — that is not
    // exposed to workers — so it posts ticks and we do the read here.
    try {
      this.worker = new Worker(new URL("../poll-worker.mjs", import.meta.url), { type: "module" });
      this.worker.onmessage = (e) => { if (e.data?.type === "tick") this.poll(); };
      this.worker.postMessage({ type: "start", intervalMs: 0 });
      return;
    } catch {
      this.worker = null; // fall through to the page timer
    }

    this.timer = setInterval(() => this.poll(), pollMs);
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
      this.worker.terminate();
      this.worker = null;
    }
  }

  /** @returns {Gamepad|null} */
  activePad() {
    const pads = navigator.getGamepads?.() ?? [];
    if (this.padIndex !== null && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) {
      if (p) { this.padIndex = p.index; return p; }
    }
    return null;
  }

  poll() {
    const pad = this.activePad();
    const wasConnected = this.connected;
    this.connected = Boolean(pad);
    if (!pad) {
      if (wasConnected) this.prevPressed.clear();
      return;
    }

    const timestamp = performance.now();

    // Direction: d-pad first, falling back to the left stick.
    let direction = "5";
    const dpad = {
      up: pad.buttons[12]?.pressed,
      down: pad.buttons[13]?.pressed,
      left: pad.buttons[14]?.pressed,
      right: pad.buttons[15]?.pressed,
    };
    if (dpad.up || dpad.down || dpad.left || dpad.right) {
      const h = (dpad.right ? 1 : 0) - (dpad.left ? 1 : 0);
      const v = (dpad.up ? 1 : 0) - (dpad.down ? 1 : 0);
      direction = String(5 + h + v * 3);
    } else {
      direction = toNumpad(pad.axes[0] ?? 0, pad.axes[1] ?? 0, this.profile.deadzone);
    }

    // Collect newly-pressed physical buttons.
    const nowPressed = new Set();
    const fresh = [];
    pad.buttons.forEach((b, i) => {
      const name = BUTTON_NAMES[i];
      if (!name) return;
      const threshold = name === "LT" || name === "RT" ? this.profile.triggerThreshold : 0.5;
      const isDown = b.pressed || b.value > threshold;
      if (!isDown) return;
      nowPressed.add(name);
      if (!this.prevPressed.has(name)) fresh.push(name);
    });
    this.prevPressed = nowPressed;

    // Report the full held state every poll, so the history display can
    // measure hold durations and neutral gaps.
    const held = [...new Set([...nowPressed].flatMap((n) => this.profile.mapping[n] ?? []))];
    this.emitState({ direction, buttons: held, timestamp });

    if (!fresh.length) return;

    // Map to SF6 flags. A single physical button may yield several (PPP/KKK).
    const buttons = [...new Set(fresh.flatMap((n) => this.profile.mapping[n] ?? []))];
    if (buttons.length) this.emit({ buttons, direction, timestamp });
  }
}

/**
 * Resolve once any gamepad button is pressed. Browsers hide gamepads from a
 * page until then, so this gate is required, not merely friendly.
 * @returns {Promise<Gamepad>}
 */
export function waitForGamepad() {
  return new Promise((resolve) => {
    const check = () => {
      const pads = navigator.getGamepads?.() ?? [];
      for (const p of pads) {
        if (p && (p.buttons.some((b) => b.pressed) || p.axes.some((a) => Math.abs(a) > 0.5))) {
          return resolve(p);
        }
      }
      requestAnimationFrame(check);
    };
    window.addEventListener("gamepadconnected", check, { once: true });
    check();
  });
}
