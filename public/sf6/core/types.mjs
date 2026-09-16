/**
 * Shared vocabulary for the rules engine.
 *
 * Pure data and type declarations — no I/O, no imports from /web or /native.
 * That separation is what lets the validator be tested without a controller.
 */

/**
 * How one move leads into the next.
 *
 * `unverifiable` is a first-class result, not a synonym for `illegal`. The
 * frame data genuinely cannot express juggle states, counterhit situations,
 * spacing, or Drive Rush cancel legality, and a validator that reported those
 * as illegal would block real combos the user knows work — at which point they
 * would switch it off and the feature would be wasted.
 *
 * @typedef {"cancel"|"link"|"chain"|"illegal"|"unverifiable"} TransitionKind
 */

/**
 * @typedef {Object} Transition
 * @property {TransitionKind} kind
 * @property {string} reason          Human-readable explanation, shown in the UI.
 * @property {TimingWindow|null} timing
 * @property {"high"|"medium"|"low"} confidence
 * @property {string[]} caveats       Things the data cannot confirm.
 */

/**
 * @typedef {Object} TimingWindow
 * @property {number} expectedFrame   Frame the follow-up input is due, relative to move A's input.
 * @property {number} earliest        expectedFrame - bufferFrames.
 * @property {number} latest          expectedFrame.
 * @property {number} bufferFrames
 * @property {number} motionBufferFrames
 */

/** Cancel tags used by the `xx` column. */
export const CANCEL_TAGS = Object.freeze({
  CHAIN: "ch",
  SPECIAL: "sp",
  SUPER: "su",
  SUPER_1: "su1",
  SUPER_2: "su2",
  SUPER_3: "su3",
  TARGET_COMBO: "tc",
  JUMP: "j",
  SUPER_JUMP: "sj",
  STANCE: "ss",
  PARRY_STANCE: "ps",
});

/**
 * SF6 input buffer sizes, in frames.
 *
 * SuperCombo wiki, authoritative: "any move can be buffered up to 4 frames
 * early, meaning that there is a 5 frame window to get the follow-up input at
 * the earliest possible timing." Dashes and reversals get 7 (an 8-frame
 * window). Motion inputs buffer ~11 frames, but that applies to the *motion*,
 * not the button press, so it is tracked separately.
 */
export const BUFFER = Object.freeze({
  DEFAULT: 4,
  DASH_REVERSAL: 7,
  MOTION: 11,
});

/** Move types seen in the data. */
export const MOVE_TYPES = Object.freeze([
  "normal",
  "special",
  "super",
  "drive",
  "throw",
  "taunt",
  "command-grab",
  "movement-special",
]);

/**
 * Which cancel tag authorizes a super of each tier.
 * A move tagged only `su2` does not authorize a level-3 super.
 */
export const SUPER_TIER_TAGS = Object.freeze({
  1: ["su", "su1"],
  2: ["su", "su2"],
  3: ["su", "su3"],
});

/**
 * Read a super's level from its move data. The sheet encodes this in the
 * command (`236236P` is typically a level 1/2, `Critical Art` a level 3) but
 * not consistently, so callers must tolerate null.
 * @param {object} move
 * @returns {1|2|3|null}
 */
export function superTier(move) {
  const hay = `${move.name ?? ""} ${move.cmnName ?? ""}`.toLowerCase();
  if (/critical art|\bca\b|level 3|lv3|sa3/.test(hay)) return 3;
  if (/level 2|lv2|sa2/.test(hay)) return 2;
  if (/level 1|lv1|sa1/.test(hay)) return 1;
  return null;
}

/** True when a move needs a directional motion (QCF etc.) rather than a plain press. */
export function hasMotion(move) {
  const m = (move.moveMotion ?? "").trim().toUpperCase();
  return Boolean(m) && m !== "N";
}
