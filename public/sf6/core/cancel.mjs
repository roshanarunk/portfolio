/**
 * Transition legality: given move A then move B for one character, can B
 * actually follow A in SF6, and when is its input due?
 *
 * Pure functions over normalized frame data. No I/O.
 *
 * The guiding rule: never claim more certainty than the data supports.
 * Absence of data is not evidence of illegality, so a missing field yields
 * `unverifiable`, never `illegal`.
 */

import { BUFFER, SUPER_TIER_TAGS, superTier, hasMotion } from "./types.mjs";

/** A usable number from a FrameValue, or null. */
function num(fv) {
  if (!fv || typeof fv !== "object") return null;
  return typeof fv.value === "number" ? fv.value : null;
}

/** True when a FrameValue carries no usable number. */
function unknown(fv) {
  return num(fv) === null;
}

/**
 * Things the frame data structurally cannot confirm. Surfaced as caveats so
 * the UI can say *why* it is hedging instead of just showing a warning icon.
 */
function caveatsFor(a, b) {
  const out = [];
  if (a.onHit?.kind === "knockdown") {
    out.push(`${a.name} causes a knockdown (${a.onHit.raw}) — follow-up timing depends on the opponent's wakeup, which this data does not model.`);
  }
  if (b.moveType === "drive") {
    out.push("Drive Rush cancel legality is not encoded in the frame data; advantage figures exist but legality does not.");
  }
  if (num(a.jugLimit) !== null || num(a.jugStart) !== null) {
    out.push("Juggle limits apply — air combo legality is not fully derivable from this data.");
  }
  return out;
}

/**
 * Which cancel tags on A would authorize B?
 * @returns {{tags: string[], label: string}|null}
 */
function requiredTags(b) {
  switch (b.moveType) {
    case "special":
    case "movement-special":
      return { tags: ["sp"], label: "special cancel" };
    case "super": {
      const tier = superTier(b);
      return {
        tags: tier ? SUPER_TIER_TAGS[tier] : ["su", "su1", "su2", "su3"],
        label: tier ? `level ${tier} super cancel` : "super cancel",
      };
    }
    case "normal":
      // Chains and target combos are both normal-into-normal, but they are
      // not interchangeable: `ch` is a genuine light chain into another
      // normal, while `tc` only reaches parts of that move's own target
      // combo. isTargetComboPart() below keeps `tc` from over-claiming.
      return { tags: ["tc", "ch"], label: "chain or target combo" };
    default:
      return null;
  }
}

/**
 * Is B a part of a target combo (rather than a standalone normal)?
 *
 * The sheet marks these with movesList "Target Combo" and flags later parts
 * with followUp "true". A `tc` tag on A authorizes only these — without the
 * check, any target-combo-able move would claim a chain into every normal.
 */
export function isTargetComboPart(b) {
  return (
    String(b.movesList ?? "").trim() === "Target Combo" ||
    String(b.followUp ?? "").trim().toLowerCase() === "true"
  );
}

/** "LP" -> "light", "MK" -> "medium", "HP" -> "heavy". */
export function buttonStrength(move) {
  const b = String(move?.moveButton ?? "").trim().toUpperCase();
  if (/^L/.test(b)) return "light";
  if (/^M/.test(b)) return "medium";
  if (/^H/.test(b)) return "heavy";
  return null;
}

/**
 * Can A chain into B?
 *
 * SF6's light chain (the `ch` tag) only reaches another light normal. Every
 * one of the 107 ch-tagged moves in the data is a light, and treating the tag
 * as "chains into any normal" made 5LP claim a chain into 5HP — over-claiming
 * legality, which is the failure this validator most needs to avoid.
 */
export function canChainInto(a, b) {
  if (b.moveType !== "normal") return false;
  return buttonStrength(b) === "light";
}

/**
 * Classify the transition A -> B.
 *
 * @param {object} a Normalized move data for the first move.
 * @param {object} b Normalized move data for the follow-up.
 * @returns {import("./types.mjs").Transition}
 */
export function classifyTransition(a, b) {
  const caveats = caveatsFor(a, b);
  const cancels = Array.isArray(a.cancels) ? a.cancels : [];
  const hasCancelData = cancels.length > 0 || a.confidence !== "low";

  const req = requiredTags(b);

  // 1. Cancel, when A carries a tag authorizing B's move type.
  if (req) {
    let matched = req.tags.filter((t) => cancels.includes(t));

    // A `tc` tag alone does not authorize an arbitrary normal — only a part of
    // that move's target combo. Drop it when B isn't one, so the transition
    // falls through to the link test rather than being wrongly verified.
    if (b.moveType === "normal" && matched.includes("tc") && !isTargetComboPart(b)) {
      matched = matched.filter((t) => t !== "tc");
    }

    // Likewise a `ch` tag only reaches another light normal.
    if (matched.includes("ch") && !canChainInto(a, b)) {
      matched = matched.filter((t) => t !== "ch");
    }

    if (matched.length) {
      const viaTc = matched.includes("tc");
      const kind = matched.some((t) => t === "tc" || t === "ch") ? "chain" : "cancel";
      return {
        kind,
        reason: viaTc
          ? `${b.name} is part of ${a.name}'s target combo (tc).`
          : `${a.name} is ${req.label}-able (${matched.join(", ")}).`,
        timing: cancelWindow(a, b),
        confidence: a.confidence === "low" ? "low" : "high",
        caveats,
      };
    }
  }

  // 2. Link, when A recovers in time for B to start.
  const adv = a.onHit?.kind === "knockdown" ? null : num(a.onHit);
  const startupB = num(b.startup);

  if (adv === null || startupB === null) {
    return {
      kind: "unverifiable",
      reason:
        adv === null
          ? `Cannot read frame advantage for ${a.name}${a.onHit?.raw ? ` ("${a.onHit.raw}")` : ""}.`
          : `Cannot read startup for ${b.name}${b.startup?.raw ? ` ("${b.startup.raw}")` : ""}.`,
      timing: linkWindow(a, b),
      confidence: "low",
      caveats,
    };
  }

  // Frame advantage +N means B may start on the frame after A's recovery,
  // giving an N+1 frame window. Keep this convention consistent everywhere.
  if (adv >= 0 && startupB <= adv + 1) {
    return {
      kind: "link",
      reason: `${a.name} is +${adv} on hit; ${b.name} starts in ${startupB}f.`,
      timing: linkWindow(a, b),
      confidence: "high",
      caveats,
    };
  }

  // 3. Neither cancel nor link. Only call this illegal when the data was
  // actually present to rule it out.
  if (!hasCancelData) {
    return {
      kind: "unverifiable",
      reason: `No cancel data recorded for ${a.name}.`,
      timing: linkWindow(a, b),
      confidence: "low",
      caveats,
    };
  }

  return {
    kind: "illegal",
    reason:
      req && cancels.length
        ? `${a.name} has no ${req.label} (cancels: ${cancels.join(", ")}), and ${b.name} starts in ${startupB}f against ${adv >= 0 ? `+${adv}` : adv} advantage.`
        : `${a.name} is ${adv >= 0 ? `+${adv}` : adv} on hit; ${b.name} needs ${startupB}f.`,
    timing: null,
    confidence: "high",
    caveats,
  };
}

/**
 * When a cancel's input is due, relative to A's own input.
 *
 * Prefer `hcWinSpCa` where present: it is the maintainers' own encoding of the
 * hit-confirm window, and more authoritative than deriving one from
 * startup + active + hitstop.
 */
export function cancelWindow(a, b) {
  const startup = num(a.startup);
  if (startup === null) return null;

  // A cancel is possible from the move's first active frame — it needs to
  // connect — and stays possible for the confirm window after that.
  // hcWinSpCa is the sheet's own measure of that window; without it, fall back
  // to the active frames plus hitstop, which is what buys the confirm time.
  const firstActive = startup;
  const confirm = num(a.hcWinSpCa);
  const lastLegal = confirm !== null
    ? startup + confirm - 1
    : startup + Math.max(0, (num(a.active) ?? 1) - 1) + Math.max(0, num(a.hitstop) ?? 0);

  // Aim for early in the window rather than its first frame. Pinning the cue
  // to firstActive demanded frame-perfect execution and graded every humanly
  // timed cancel LATE: Ryu 5LP chains landed at 6f in game against a cue of 4f,
  // and three of them compounded to +26f. A couple of frames in is both
  // achievable and still comfortably inside the window.
  const expected = Math.min(firstActive + 2, lastLegal);

  return buildWindow(expected, b, { earliest: firstActive, latest: lastLegal });
}

/** When a link's input is due: after A has fully recovered. */
export function linkWindow(a, b) {
  const startup = num(a.startup);
  const active = num(a.active);
  const recovery = num(a.recovery);
  if (startup === null || active === null || recovery === null) return null;
  return buildWindow(startup + active + recovery, b);
}

/**
 * @param {number} expectedFrame
 * @param {object} b
 * @param {{earliest?: number, latest?: number}} [span]
 *   Explicit window bounds. Cancels are late-tolerant: the input stays legal
 *   for the whole confirm window, so `latest` is well past `expectedFrame`.
 *   Links have no such tolerance — being late means the opponent has recovered
 *   — so they pass no span and get buffer-only bounds.
 */
function buildWindow(expectedFrame, b, span = {}) {
  // Always the universal 4-frame buffer here.
  //
  // The wiki's 7-frame buffer applies to dashes and *wakeup* reversals —
  // defensive and neutral actions. This function only ever sizes a window for
  // an attack following another attack in a combo, which is never either of
  // those. Matching on the move name instead handed the wider window to 48
  // attacks: every character's Drive Reversal, plus specials whose names merely
  // contain "dash" (C.Viper's Thunder Dash), making those cancels look 3 frames
  // more lenient than they are.
  const bufferFrames = BUFFER.DEFAULT;

  // The buffer extends the early edge: SF6 accepts an input up to 4 frames
  // before the move is actually available.
  const earliest = Math.max(0, (span.earliest ?? expectedFrame) - bufferFrames);
  const latest = Math.max(expectedFrame, span.latest ?? expectedFrame);

  return {
    expectedFrame,
    bufferFrames,
    motionBufferFrames: hasMotion(b) ? BUFFER.MOTION : 0,
    earliest,
    latest,
  };
}

/**
 * Validate a whole combo, returning one Transition per adjacent pair.
 * @param {object[]} moves
 * @returns {import("./types.mjs").Transition[]}
 */
export function validateCombo(moves) {
  const out = [];
  for (let i = 0; i < moves.length - 1; i++) {
    out.push(classifyTransition(moves[i], moves[i + 1]));
  }
  return out;
}
