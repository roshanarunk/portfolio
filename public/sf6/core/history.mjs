/**
 * Input history: what was pressed or held, and for how many frames.
 *
 * This is the SF6 training-mode style display — each entry is a state (a
 * direction, a set of buttons, or neutral) plus how long it was held. Hold
 * durations and neutral gaps are what make execution problems visible:
 * a plink, a too-short charge, or dead time between links.
 *
 * Pure: frames in, entries out. No timers, no DOM.
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} direction    Numpad notation; "5" is neutral.
 * @property {string[]} buttons    SF6 button flags held during this state.
 * @property {number} startFrame
 * @property {number} frames       How long this state persisted.
 * @property {boolean} neutral     True when nothing was held at all.
 */

const MAX_ENTRIES = 40;

export class InputHistory {
  constructor(max = MAX_ENTRIES) {
    /** @type {HistoryEntry[]} */
    this.entries = [];
    this.max = max;
    this.current = null;
  }

  clear() {
    this.entries = [];
    this.current = null;
  }

  /**
   * Record the controller state for a frame. Consecutive identical states are
   * coalesced into one entry with a growing frame count, which is what makes
   * "held for 12f" legible rather than 12 separate rows.
   *
   * @param {string} direction
   * @param {string[]} buttons
   * @param {number} frame
   */
  sample(direction, buttons, frame) {
    const key = `${direction}|${[...buttons].sort().join("+")}`;

    if (this.current && this.current.key === key) {
      this.current.entry.frames = frame - this.current.entry.startFrame + 1;
      return;
    }

    const entry = {
      direction,
      buttons: [...buttons],
      startFrame: frame,
      frames: 1,
      neutral: direction === "5" && buttons.length === 0,
    };

    this.entries.push(entry);
    if (this.entries.length > this.max) this.entries.shift();
    this.current = { key, entry };
  }

  /** Most recent first, for display. */
  recent(n = 12) {
    return this.entries.slice(-n).reverse();
  }
}

/** Arrow glyphs for numpad directions, for compact display. */
export const DIRECTION_GLYPHS = {
  1: "↙", 2: "↓", 3: "↘",
  4: "←", 5: "·", 6: "→",
  7: "↖", 8: "↑", 9: "↗",
};
