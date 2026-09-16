/**
 * Motion recognition: which special-move motion did the player just complete?
 *
 * Without this, an input is only a button, and a button alone cannot tell a
 * Hadoken from a standing LP — 14 of Ryu's moves match a bare LP press. The
 * frame data names the required motion per move (moveMotion: QCF, DP, HCB…),
 * so recognising the motion is what makes specials selectable at all.
 *
 * Directions are numpad notation, matching the input history:
 *
 *      7 8 9
 *      4 5 6      5 = neutral, 6 = forward (facing right)
 *      1 2 3
 *
 * Pure: a direction history in, motion names out. No DOM, no timers.
 */

/** SF6 buffers motion inputs generously; ~11 frames is the usual figure. */
export const MOTION_WINDOW_FRAMES = 11;

/**
 * Motion definitions as ordered direction sequences.
 *
 * Each is a list of directions that must appear in order (not necessarily
 * adjacently — players roll through intermediate directions, and the
 * recogniser should not care). Listed longest-first so DQCF is preferred over
 * the QCF it contains.
 */
const MOTIONS = [
  // Double quarter-circles (supers) — must be tested before the single form.
  { name: "DQCF", seq: ["2", "3", "6", "2", "3", "6"] },
  { name: "DQCB", seq: ["2", "1", "4", "2", "1", "4"] },
  // 360 / 720 are approximated by a full rotation of cardinals.
  { name: "720", seq: ["6", "2", "4", "8", "6", "2", "4", "8"] },
  { name: "360", seq: ["6", "2", "4", "8"] },
  // Half circles.
  { name: "HCB", seq: ["6", "3", "2", "1", "4"] },
  { name: "HCF", seq: ["4", "1", "2", "3", "6"] },
  // Dragon punch: forward, down, down-forward.
  { name: "DP", seq: ["6", "2", "3"] },
  { name: "RDP", seq: ["4", "2", "1"] },
  // Quarter circles.
  { name: "QCF", seq: ["2", "3", "6"] },
  { name: "QCB", seq: ["2", "1", "4"] },
  // Double-tap down (e.g. Ryu's Denjin Charge).
  { name: "DD", seq: ["2", "5", "2"] },
];

/**
 * Does `seq` appear in order within `directions`?
 * Intermediate directions are skipped, so a rolled input still matches.
 */
function containsSequence(directions, seq) {
  let i = 0;
  for (const d of directions) {
    if (d === seq[i]) i++;
    if (i === seq.length) return true;
  }
  return false;
}

/**
 * Which motions were completed within the recent direction history?
 *
 * @param {Array<{direction: string, startFrame: number, frames: number}>} entries
 *   Direction states, oldest first — the shape core/history.mjs records.
 * @param {number} now Current frame.
 * @param {number} [window] How far back to look.
 * @returns {string[]} Motion names, most specific first.
 */
export function detectMotions(entries, now, window = MOTION_WINDOW_FRAMES) {
  if (!entries?.length) return [];

  // Only directions still inside the buffer window count.
  const recent = entries
    .filter((e) => now - (e.startFrame + e.frames) <= window)
    .map((e) => e.direction);

  if (!recent.length) return [];

  const found = [];
  for (const { name, seq } of MOTIONS) {
    if (containsSequence(recent, seq)) found.push(name);
  }
  return found;
}

/**
 * Does a move's required motion match what the player just did?
 *
 * @param {string|null} moveMotion The move's moveMotion field.
 * @param {string[]} detected Motions from detectMotions().
 * @param {string} direction The direction held at the moment of the press.
 */
export function motionSatisfied(moveMotion, detected, direction = "5") {
  const m = String(moveMotion ?? "").trim().toUpperCase();

  // No motion required: a plain press, possibly with a direction held.
  if (!m || m === "N" || m === "(NONE)") return true;

  if (detected.includes(m)) return true;

  // Single-direction requirements are satisfied by simply holding it.
  const HELD = {
    F: ["6", "9", "3"],
    B: ["4", "7", "1"],
    D: ["2", "1", "3"],
    U: ["8", "7", "9"],
  };
  if (HELD[m]) return HELD[m].includes(direction);

  // Charge moves and anything unrecognised: accept rather than block the move,
  // since charge state is not tracked and refusing would make the move
  // unreachable entirely.
  return !MOTIONS.some((x) => x.name === m);
}
