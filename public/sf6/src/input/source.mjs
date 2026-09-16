/**
 * Input abstraction shared by the gamepad and keyboard sources.
 *
 * Everything above this layer sees only timestamped button events, so the
 * trainer does not care whether input arrived from a pad or a keyboard — and
 * a native capture path can be added later behind the same interface.
 *
 * Buttons are represented as an ARRAY of SF6 button flags, not a single
 * string. That is what makes EX moves and PPP/KKK expressible: one physical
 * button can map to ["LP","MP","HP"]. The old sf6_button_mapping.json mapped
 * each pad button to exactly one SF6 button, which could not represent them.
 */

/** The SF6 attack buttons. */
export const BUTTONS = ["LP", "MP", "HP", "LK", "MK", "HK"];

/** Numpad notation for directions, matching the frame data's numCmd field. */
export const DIRECTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * @typedef {Object} InputEvent
 * @property {string[]} buttons   SF6 button flags pressed this frame.
 * @property {string} direction   Numpad direction; "5" is neutral.
 * @property {number} timestamp   performance.now() when the press was detected.
 */

/**
 * Default pad mapping, as flag arrays.
 *
 * Deliberately different from the legacy sf6_button_mapping.json, which mapped
 * both LB and RB to HP and included V1/V2 (not SF6 concepts). Shoulder buttons
 * are far more useful bound to the multi-button macros.
 */
export const DEFAULT_PAD_PROFILE = Object.freeze({
  schemaVersion: 1,
  name: "Default (Xbox layout)",
  mapping: {
    X: ["LP"],
    Y: ["MP"],
    RB: ["HP"],
    A: ["LK"],
    B: ["MK"],
    RT: ["HK"],
    LB: ["LP", "MP", "HP"], // PPP
    LT: ["LK", "MK", "HK"], // KKK
    BACK: ["LP", "LK"], // throw
    START: ["HP", "HK"], // Drive Impact
  },
  deadzone: 0.5,
  triggerThreshold: 0.5,
});

/** Keyboard fallback so the trainer is usable with no pad attached. */
export const DEFAULT_KEY_PROFILE = Object.freeze({
  schemaVersion: 1,
  name: "Keyboard",
  mapping: {
    u: ["LP"], i: ["MP"], o: ["HP"],
    j: ["LK"], k: ["MK"], l: ["HK"],
    p: ["LP", "MP", "HP"],
    ";": ["LK", "MK", "HK"],
  },
  directions: {
    // WASD -> numpad
    w: "8", a: "4", s: "2", d: "6",
  },
});

/**
 * Base class: sources push InputEvents to subscribers.
 * Subclasses implement start()/stop().
 */
export class InputSource {
  constructor() {
    /** @type {Set<(e: InputEvent) => void>} */
    this.listeners = new Set();
    this.connected = false;
  }

  /** @param {(e: InputEvent) => void} fn */
  onInput(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** @protected @param {InputEvent} event */
  emit(event) {
    for (const fn of this.listeners) fn(event);
  }

  /**
   * Subscribe to the full controller state each poll, not just fresh presses.
   *
   * The history display needs to know what is being HELD and for how long,
   * which press-only events cannot express — a button held for 20 frames and
   * one tapped for 1 look identical if you only see the press.
   *
   * @param {(state: {direction: string, buttons: string[], timestamp: number}) => void} fn
   */
  onState(fn) {
    this.stateListeners ??= new Set();
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  /** @protected */
  emitState(state) {
    if (!this.stateListeners) return;
    for (const fn of this.stateListeners) fn(state);
  }

  start() {}
  stop() {}
}

/**
 * Convert an analog stick / d-pad state into numpad notation.
 * @returns {string} "1".."9", where "5" is neutral
 */
export function toNumpad(x, y, deadzone = 0.5) {
  const h = Math.abs(x) < deadzone ? 0 : Math.sign(x);
  // Screen coordinates run downward; numpad 8 is up.
  const v = Math.abs(y) < deadzone ? 0 : -Math.sign(y);
  return String(5 + h + v * 3);
}
