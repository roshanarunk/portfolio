/**
 * Keyboard input source, so the trainer is usable with no pad attached.
 * Implements the same InputSource contract as GamepadSource.
 */

import { InputSource, DEFAULT_KEY_PROFILE } from "./source.mjs";

export class KeyboardSource extends InputSource {
  constructor(profile = DEFAULT_KEY_PROFILE) {
    super();
    this.profile = profile;
    this.held = new Set();
    /** SF6 button flags currently held, for the history display. */
    this.heldButtons = new Set();
    this.raf = null;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  start() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.connected = true;
    // Mirror the gamepad's per-frame state reporting so the history display
    // works identically for keyboard players.
    this.raf = requestAnimationFrame(this.pollState);
  }

  stop() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.connected = false;
    this.held.clear();
    this.heldButtons.clear();
  }

  /** Report the currently-held state each frame. */
  pollState = () => {
    this.emitState({
      direction: this.direction(),
      buttons: [...this.heldButtons],
      timestamp: performance.now(),
    });
    this.raf = requestAnimationFrame(this.pollState);
  };

  /** Current direction from held WASD keys, in numpad notation. */
  direction() {
    const d = this.profile.directions;
    let h = 0;
    let v = 0;
    for (const key of this.held) {
      const dir = d[key];
      if (dir === "4") h = -1;
      else if (dir === "6") h = 1;
      else if (dir === "8") v = 1;
      else if (dir === "2") v = -1;
    }
    return String(5 + h + v * 3);
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (this.profile.directions[key]) {
      this.held.add(key);
      return;
    }
    // Ignore auto-repeat: only a fresh press is an input.
    if (e.repeat) return;
    const buttons = this.profile.mapping[key];
    if (!buttons) return;
    e.preventDefault();
    for (const b of buttons) this.heldButtons.add(b);
    this.emit({ buttons: [...buttons], direction: this.direction(), timestamp: performance.now() });
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.held.delete(key);
    for (const b of this.profile.mapping[key] ?? []) this.heldButtons.delete(b);
  }
}
