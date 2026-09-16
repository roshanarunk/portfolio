/**
 * Frame meter: turns a move's frame data into a per-frame segment list, the
 * way SF6's training-mode meter draws it.
 *
 * One entry per frame, so a renderer can draw one bar per frame with no
 * arithmetic of its own.
 *
 * Pure: move in, segments out. No DOM, no timers.
 */

/**
 * @typedef {"startup"|"active"|"gap"|"recovery"|"unknown"} Phase
 *
 * `gap` matters: 303 moves in the data have multi-hit active frames with
 * inactive frames between them (active [3,5,3] = 3 active, 5 idle, 3 active).
 * Drawing those as one solid active block would misrepresent when the move can
 * actually hit.
 */

/** @typedef {{phase: Phase, frame: number, hitIndex: number|null}} FrameCell */

const num = (fv) => (fv && typeof fv.value === "number" ? fv.value : null);

/**
 * Expand a move into one cell per frame.
 *
 * Returns an empty list when startup is unknown — a meter that invents frame
 * counts is worse than no meter, since the whole point is showing real data.
 *
 * @param {object} move
 * @returns {{cells: FrameCell[], startup: number|null, active: number|null,
 *            recovery: number|null, total: number, complete: boolean}}
 */
export function frameMeter(move) {
  const startup = num(move?.startup);
  const recovery = num(move?.recovery);

  /** @type {FrameCell[]} */
  const cells = [];
  let frame = 1;

  // Startup: the frames before the move can hit. SF6 counts the first active
  // frame as the last frame of startup, so a "4f" move has 3 startup cells
  // then becomes active on frame 4.
  const startupCells = startup === null ? 0 : Math.max(0, startup - 1);
  for (let i = 0; i < startupCells; i++) cells.push({ phase: "startup", frame: frame++, hitIndex: null });

  // Active, honouring multi-hit gaps. The `frames` kind stores the raw
  // alternating groups: [active, gap, active, ...].
  let activeTotal = 0;
  const av = move?.active;
  if (av?.kind === "frames" && Array.isArray(av.active)) {
    let hit = 0;
    av.active.forEach((len, i) => {
      const isActive = i % 2 === 0;
      for (let j = 0; j < len; j++) {
        cells.push({ phase: isActive ? "active" : "gap", frame: frame++, hitIndex: isActive ? hit : null });
      }
      if (isActive) { activeTotal += len; hit++; }
    });
  } else {
    const a = num(av);
    if (a !== null) {
      for (let i = 0; i < a; i++) cells.push({ phase: "active", frame: frame++, hitIndex: 0 });
      activeTotal = a;
    }
  }

  for (let i = 0; i < (recovery ?? 0); i++) {
    cells.push({ phase: "recovery", frame: frame++, hitIndex: null });
  }

  const complete = startup !== null && activeTotal > 0 && recovery !== null;
  return {
    cells,
    startup,
    active: activeTotal || null,
    recovery,
    total: cells.length,
    complete,
  };
}

/**
 * Lay several moves out end to end at their scheduled frames, for a combo.
 *
 * Each move begins at its cue frame, so gaps between moves appear as real
 * dead frames — which is what makes a too-slow link visible.
 *
 * @param {Array<{move: object, frame: number}>} entries
 * @returns {{lanes: Array<{move: object, start: number, meter: ReturnType<frameMeter>}>, total: number}}
 */
export function comboMeter(entries) {
  const lanes = entries.map(({ move, frame }) => ({
    move,
    start: frame,
    meter: frameMeter(move),
  }));
  const total = lanes.reduce((max, l) => Math.max(max, l.start + l.meter.total), 0);
  return { lanes, total };
}

/** Colours matching SF6's meter convention. */
export const PHASE_COLORS = {
  startup: "#2fd39a",  // green
  active: "#ff5d68",   // red
  gap: "#8a94a6",      // grey — between hits
  recovery: "#5b9dff", // blue
  idle: "#232937",     // nothing happening
  unknown: "#39414f",
};
