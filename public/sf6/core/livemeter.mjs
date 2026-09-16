/**
 * Live frame meter: the state of the character right now, driven by what was
 * actually pressed — the way SF6's training-mode meter behaves.
 *
 * Three behaviours distinguish this from a static preview of a planned combo:
 *
 *  1. It reacts to real inputs, not to a pre-built move list.
 *  2. It holds its state after a move ends, clearing only once the character
 *     has been idle for a while (SF6 uses roughly 60 frames).
 *  3. A cancel TRUNCATES the previous move. If a cancellable normal is
 *     cancelled into a special, the normal's remaining recovery never happens
 *     — the special's frames replace it. Appending both in full would draw
 *     recovery frames that the game never played.
 *
 * Pure: frames and moves in, timeline out. No DOM, no timers.
 */

import { frameMeter } from "./framemeter.mjs";
import { classifyTransition } from "./cancel.mjs";

/** Idle frames before the meter clears itself. */
export const IDLE_CLEAR_FRAMES = 60;

/**
 * @typedef {Object} Entry
 * @property {object} move
 * @property {number} start      Frame the move began.
 * @property {number} length     Frames actually played (may be truncated).
 * @property {number} full       Frames the move would take uninterrupted.
 * @property {boolean} truncated Cut short by a cancel.
 * @property {string|null} via   How it was reached: cancel / chain / link / null.
 * @property {ReturnType<frameMeter>} meter
 */

export class LiveMeter {
  constructor({ idleFrames = IDLE_CLEAR_FRAMES } = {}) {
    /** @type {Entry[]} */
    this.entries = [];
    this.idleFrames = idleFrames;
    this.lastInputFrame = -Infinity;
  }

  clear() {
    this.entries = [];
    this.lastInputFrame = -Infinity;
  }

  /** The move currently playing at `frame`, if any. */
  activeEntry(frame) {
    const last = this.entries[this.entries.length - 1];
    if (!last) return null;
    return frame < last.start + last.length ? last : null;
  }

  /**
   * Record a move starting on `frame`.
   *
   * If a move is still playing and the new one legitimately cancels it, the
   * playing move is truncated at this frame rather than running to completion.
   */
  press(move, frame) {
    const meter = frameMeter(move);
    const full = meter.total;
    const prev = this.entries[this.entries.length - 1];

    // Classify once: calling it again after truncating would re-read mutated
    // state, and the two answers must not be able to disagree.
    const via = prev ? classifyTransition(prev.move, move).kind : null;

    if (prev && frame < prev.start + prev.length) {
      if (via === "cancel" || via === "chain") {
        // The rest of the previous move never plays.
        prev.length = Math.max(1, frame - prev.start);
        prev.truncated = prev.length < prev.full;
      } else {
        // Not a legal cancel: the input is ignored while the move is busy,
        // exactly as the game would ignore it.
        return null;
      }
    }
    const entry = { move, start: frame, length: full, full, truncated: false, via, meter };
    this.entries.push(entry);
    this.lastInputFrame = frame;
    return entry;
  }

  /**
   * Advance to `frame`, clearing the timeline after a spell of inactivity.
   * Returns true when the meter was cleared.
   */
  tick(frame) {
    if (!this.entries.length) return false;
    const last = this.entries[this.entries.length - 1];
    const endedAt = last.start + last.length;
    if (frame - Math.max(endedAt, this.lastInputFrame) >= this.idleFrames) {
      this.clear();
      return true;
    }
    return false;
  }

  /**
   * Flatten to ONE continuous strip of frames, the way SF6 draws it.
   *
   * This is a single timeline, not a lane per move: frame N of the strip is
   * whatever the character was doing on frame N. Moves flow into each other,
   * idle frames between them appear as real gaps, and a cancel simply means
   * the next move's frames begin where the previous one was cut.
   *
   * @returns {{cells: Array<{phase: string, frame: number, entry: Entry|null}>, start: number}}
   */
  timeline() {
    if (!this.entries.length) return { cells: [], start: 0 };
    const start = this.entries[0].start;
    const last = this.entries[this.entries.length - 1];
    const total = last.start + last.length - start;

    // Pre-fill with idle, then paint each move over its own span. Painting in
    // order means a later move naturally overwrites the tail of one it
    // cancelled, without needing to reason about overlap here.
    /** @type {Array<{phase: string, frame: number, entry: Entry|null}>} */
    const cells = Array.from({ length: Math.max(0, total) }, (_, i) => ({
      phase: "idle",
      frame: i,
      entry: null,
    }));

    for (const entry of this.entries) {
      const offset = entry.start - start;
      for (let i = 0; i < entry.length; i++) {
        const at = offset + i;
        if (at < 0 || at >= cells.length) continue;
        const cell = entry.meter.cells[i];
        cells[at] = { phase: cell ? cell.phase : "recovery", frame: at, entry };
      }
    }

    return { cells, start };
  }
}
