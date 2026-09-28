/**
 * A port of `sim/src/Core/MotionInput.cs` from Fundies.
 *
 * Capcom-style bounded exhaustive matching over direction transitions. History
 * is stored as runs of absolute numpad directions, newest first, and mirrored
 * for the fighter's facing only when matching — so turning around mid-motion
 * reads the history correctly instead of inventing directions.
 *
 * Quarter circles need exactly 2,3,6 / 2,1,4. The DP is lenient: any forward,
 * any down, any forward (623, 626, 323, 636). DP beats a quarter circle, except
 * that returning through back and down to forward is read as an intentional
 * walking fireball. Intervening directions are tolerated inside each window.
 */

export type Command = "none" | "stand" | "low" | "fireball" | "donkey" | "dp";

export interface Run {
  /** Absolute numpad direction, 1-9, where 5 is neutral. */
  dir: number;
  frames: number;
}

export interface MotionState {
  /** Newest first. */
  runs: Run[];
  pending: Command;
  bufferFrames: number;
  /** Absolute world direction of a recognised dash, -1 or +1, or 0. */
  dashDirection: number;
  dashBufferFrames: number;
}

export const CAPACITY = 40;
export const QUARTER_WINDOW = 11;
export const DP_WINDOW = 7;
/** The execution frame plus four early frames. */
export const ACTION_BUFFER = 5;
export const DASH_TAP_WINDOW = 8;

export function initialMotion(): MotionState {
  return {
    runs: [],
    pending: "none",
    bufferFrames: 0,
    dashDirection: 0,
    dashBufferFrames: 0,
  };
}

/** Numpad direction from stick axes. Opposites cancel on each axis. */
export function direction(x: -1 | 0 | 1, y: -1 | 0 | 1): number {
  return 5 + x + y * 3;
}

/** Mirrors an absolute direction into the fighter's frame of reference. */
export function relative(dir: number, facing: 1 | -1): number {
  if (facing >= 0) return dir;
  switch (dir) {
    case 1:
      return 3;
    case 3:
      return 1;
    case 4:
      return 6;
    case 6:
      return 4;
    case 7:
      return 9;
    case 9:
      return 7;
    default:
      return dir;
  }
}

/** One simulation frame. Pure: returns the next state. */
export function sample(
  prev: MotionState,
  dir: number,
  attackPressed: boolean,
  facing: 1 | -1,
  paused = false,
): MotionState {
  const m: MotionState = { ...prev, runs: prev.runs.map((r) => ({ ...r })) };

  if (!paused && m.bufferFrames > 0 && --m.bufferFrames === 0) m.pending = "none";
  if (!paused && m.dashBufferFrames > 0 && --m.dashBufferFrames === 0)
    m.dashDirection = 0;

  if (m.runs.length > 0 && m.runs[0].dir === dir) {
    m.runs[0].frames = Math.min(CAPACITY, m.runs[0].frames + 1);
  } else {
    m.runs.unshift({ dir, frames: 1 });
    if (m.runs.length > CAPACITY) m.runs.length = CAPACITY;
  }

  // Strict cardinal tap, neutral, tap. Diagonal changes and held directions
  // cannot masquerade as a second tap of the same direction.
  const r = m.runs;
  if (
    r.length >= 3 &&
    (dir === 4 || dir === 6) &&
    r[0].frames === 1 &&
    r[1].dir === 5 &&
    r[1].frames <= DASH_TAP_WINDOW &&
    r[2].dir === dir &&
    r[2].frames <= DASH_TAP_WINDOW
  ) {
    m.dashDirection = dir === 6 ? 1 : -1;
    m.dashBufferFrames = ACTION_BUFFER;
  }

  if (!attackPressed) return m;

  let cmd = recognize(m, facing);
  if (cmd === "none") cmd = dir <= 3 ? "low" : "stand";
  m.pending = cmd;
  m.bufferFrames = ACTION_BUFFER;
  return m;
}

export function recognize(m: MotionState, facing: 1 | -1): Command {
  // Ryu-style half-circle correction: returning through back/down to forward
  // intentionally produces a fireball instead of a walking DP.
  if (
    match(m, facing, 4, 2, 6, QUARTER_WINDOW, false) &&
    match(m, facing, 2, 3, 6, QUARTER_WINDOW, false)
  )
    return "fireball";
  if (match(m, facing, 6, 2, 6, DP_WINDOW, true)) return "dp";
  if (match(m, facing, 2, 3, 6, QUARTER_WINDOW, false)) return "fireball";
  if (match(m, facing, 2, 1, 4, QUARTER_WINDOW, false)) return "donkey";
  return "none";
}

function fits(actual: number, wanted: number, lenient: boolean): boolean {
  if (!lenient) return actual === wanted;
  return wanted === 6
    ? actual === 3 || actual === 6 || actual === 9
    : actual === 1 || actual === 2 || actual === 3;
}

/**
 * Walks the history backwards looking for last, then middle, then first, each
 * within its window. Exhaustive: an older valid diagonal is still found if a
 * newer run failed to match.
 */
function match(
  m: MotionState,
  facing: 1 | -1,
  first: number,
  middle: number,
  last: number,
  window: number,
  lenient: boolean,
): boolean {
  const runs = m.runs;
  let tail = 0;
  for (let c = 0; c < runs.length; c++) {
    tail += runs[c].frames;
    if (tail > window) break;
    if (!fits(relative(runs[c].dir, facing), last, lenient)) continue;
    let gap = 0;
    for (let b = c + 1; b < runs.length; b++) {
      gap += runs[b].frames;
      if (gap > window) break;
      if (!fits(relative(runs[b].dir, facing), middle, lenient)) continue;
      let lead = 0;
      for (let a = b + 1; a < runs.length; a++) {
        if (lead + 1 > window) break;
        if (fits(relative(runs[a].dir, facing), first, lenient)) return true;
        lead += runs[a].frames;
      }
    }
  }
  return false;
}
