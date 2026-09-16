/**
 * Turns a validated combo into a cue schedule, and grades inputs against it.
 *
 * Pure functions over frame numbers. No I/O, no timers, no audio — the caller
 * owns the clock. That keeps this testable without a controller or a browser.
 *
 * Frames are 1/60s throughout. Frame 0 is the first move's input.
 */

import { validateCombo } from "./cancel.mjs";
import { BUFFER } from "./types.mjs";

/**
 * @typedef {Object} Cue
 * @property {number} index         Which step of the combo (0-based).
 * @property {object} move
 * @property {number} frame         Absolute frame the input is due.
 * @property {number} earliest      First frame the input is accepted.
 * @property {number} latest        Last frame the input is accepted.
 * @property {import("./types.mjs").TransitionKind|null} via
 * @property {"high"|"medium"|"low"} confidence
 * @property {boolean} estimated    True when timing was assumed, not derived.
 */

/** Fallback gap when a transition yields no usable timing window. */
const FALLBACK_GAP_FRAMES = 20;

/**
 * Build an absolute cue schedule for a combo.
 *
 * Each transition contributes a *relative* offset from the previous move's
 * input; this accumulates them into absolute frames. Note the accumulation
 * adds each step's own offset before recording it — the schedule for step i
 * must include the gap that precedes step i.
 *
 * @param {object[]} moves
 * @returns {{cues: Cue[], transitions: import("./types.mjs").Transition[], totalFrames: number}}
 */
export function buildSchedule(moves) {
  const transitions = validateCombo(moves);
  /** @type {Cue[]} */
  const cues = [];

  if (!moves.length) return { cues, transitions, totalFrames: 0 };

  cues.push({
    index: 0,
    move: moves[0],
    frame: 0,
    earliest: 0,
    latest: 0,
    via: null,
    confidence: moves[0].confidence ?? "high",
    estimated: false,
  });

  let frame = 0;
  for (let i = 1; i < moves.length; i++) {
    const t = transitions[i - 1];
    const timing = t?.timing ?? null;
    const estimated = !timing;

    // Without a usable window we still schedule a cue, flagged estimated, so
    // the user can train the combo rather than being blocked by missing data.
    const offset = timing ? timing.expectedFrame : FALLBACK_GAP_FRAMES;
    const buffer = timing ? timing.bufferFrames : BUFFER.DEFAULT;

    frame += Math.max(1, offset);

    // Carry the transition's own window across, rather than rebuilding it from
    // the buffer alone. A cancel stays legal for its whole confirm window, and
    // rebuilding as [frame - buffer, frame] discarded that late tolerance —
    // real in-game chain timings then graded LATE and compounded across a combo.
    const before = timing ? timing.expectedFrame - timing.earliest : buffer;
    const after = timing ? timing.latest - timing.expectedFrame : 0;

    cues.push({
      index: i,
      move: moves[i],
      frame,
      earliest: Math.max(0, frame - before),
      latest: frame + after,
      via: t?.kind ?? null,
      confidence: estimated ? "low" : t?.confidence ?? "medium",
      estimated,
    });
  }

  return { cues, transitions, totalFrames: frame };
}

/**
 * Grade one input against its cue.
 *
 * SF6 buffers a move up to 4 frames early, so anything inside
 * [earliest, latest] is correct — not just an exact frame match. Landing after
 * `latest` is late (the combo drops); before `earliest` is early (the input is
 * consumed or ignored).
 *
 * @param {Cue} cue
 * @param {number} actualFrame
 * @returns {{verdict:"perfect"|"early"|"late", delta:number, inWindow:boolean}}
 */
export function gradeInput(cue, actualFrame) {
  const delta = actualFrame - cue.frame;
  const inWindow = actualFrame >= cue.earliest && actualFrame <= cue.latest;
  if (inWindow) return { verdict: "perfect", delta, inWindow };
  return { verdict: actualFrame < cue.earliest ? "early" : "late", delta, inWindow };
}

/**
 * Which cue, if any, falls on this frame. Used to fire audio cues.
 * @param {Cue[]} cues
 * @param {number} frame
 * @returns {Cue|null}
 */
export function cueAtFrame(cues, frame) {
  return cues.find((c) => c.frame === frame) ?? null;
}

/**
 * Summarise a run: how many inputs landed in their windows.
 * @param {Array<{verdict:string}>} results
 */
export function summarise(results) {
  const total = results.length;
  const perfect = results.filter((r) => r.verdict === "perfect").length;
  return {
    total,
    perfect,
    early: results.filter((r) => r.verdict === "early").length,
    late: results.filter((r) => r.verdict === "late").length,
    accuracy: total ? perfect / total : 0,
  };
}

/** Frames to milliseconds at 60fps. */
export const framesToMs = (f) => (f * 1000) / 60;
/** Milliseconds to whole frames at 60fps. */
export const msToFrames = (ms) => Math.round((ms * 60) / 1000);
