/**
 * The training loop: runs a 60Hz frame clock, fires cues, and grades inputs.
 *
 * Two decisions here are load-bearing for timing accuracy.
 *
 * 1. The run starts on the first INPUT, not on a button press in the UI.
 *    Anchoring the clock to a click made frame 0 the moment of the click, so
 *    the first input was graded as the user's reaction time — and because the
 *    whole schedule hangs off that origin, every later input inherited the
 *    same error.
 *
 * 2. Inputs are graded from the event's own timestamp, not from the current
 *    frame counter. The counter only advances on clock ticks, so grading
 *    against it quantizes every input to the last tick and throws away the
 *    precision the input sources already captured.
 *
 * The logical clock is exactly 60Hz and display-rate independent (see
 * core/clock.mjs). Sampling runs faster than 60Hz to reduce how long a press
 * can sit unseen. What remains and cannot be removed: this clock is not
 * phase-locked to SF6's frame boundaries, so ~1 frame of quantization between
 * the two is irreducible. Hence no "timing offset" knob — the residual error
 * is phase noise, not constant bias, so a fixed offset cannot cancel it.
 */

import { buildSchedule, gradeInput, cueAtFrame } from "/sf6/core/schedule.mjs";
import { FrameClock, FRAME_MS, frameAt } from "/sf6/core/clock.mjs";

export { FRAME_MS };

/** Frames to wait after the last cue before calling a run finished. */
const TAIL_FRAMES = 45;

export class Trainer {
  /**
   * @param {{audio: import("./audio.mjs").AudioCues, onUpdate: Function}} opts
   */
  constructor({ audio, onUpdate, onSample, now } = {}) {
    this.audio = audio;
    this.onUpdate = onUpdate;
    this.schedule = { cues: [], transitions: [], totalFrames: 0 };
    this.running = false;
    this.armed = false;
    this.frame = 0;
    this.startTime = 0;
    /** @type {Array<{index:number, verdict:string, delta:number}>} */
    this.results = [];
    this.nextCueIndex = 0;

    // The clock is injected so the 60Hz logical stepping is testable without a
    // browser, and so input sampling can run faster than the display refresh.
    this.clock = new FrameClock({
      onFrame: (f) => this.onFrameAdvance(f),
      onSample,
      now,
    });
  }

  /** @param {object[]} moves */
  setCombo(moves) {
    this.schedule = buildSchedule(moves);
    this.reset();
    return this.schedule;
  }

  reset() {
    this.frame = 0;
    this.results = [];
    this.nextCueIndex = 0;
    this.armed = false;
    this.clock.stop();
  }

  /**
   * Arm the trainer: wait for the combo's first input rather than starting a
   * clock immediately.
   *
   * Starting the clock on a button click made frame 0 the moment of the click,
   * so the first input was graded as the user's reaction time — and since the
   * whole schedule hangs off that origin, every later input inherited the same
   * error. The run now begins on the first matching input, which is by
   * definition frame 0.
   */
  arm() {
    if (!this.schedule.cues.length) return;
    this.reset();
    this.armed = true;
    this.running = false;
    this.onUpdate?.(this.state());
  }

  /** @param {number} originTime timestamp of the first input. */
  beginAt(originTime) {
    this.armed = false;
    this.running = true;
    this.startTime = originTime;
    this.clock.start(originTime);
  }

  /**
   * @param {{rearm?: boolean}} [opts] rearm: wait for the first input again
   *   rather than going fully idle.
   */
  stop({ rearm = false } = {}) {
    this.running = false;
    this.clock.stop();

    if (rearm && this.schedule.cues.length) {
      // Re-arm rather than going idle. A run ends on the clock timing out, not
      // on an input, so re-arming from the input handler never fired and the
      // trainer stayed dead after one successful pass.
      this.frame = 0;
      this.results = [];
      this.nextCueIndex = 0;
      this.armed = true;
    } else {
      this.armed = false;
    }

    this.onUpdate?.(this.state());
  }

  /** One logical 60Hz frame elapsed. */
  onFrameAdvance(frame) {
    this.frame = frame;

    const cue = cueAtFrame(this.schedule.cues, frame);
    if (cue) this.audio?.step();

    const last = this.schedule.cues[this.schedule.cues.length - 1];
    if (last && frame > last.frame + TAIL_FRAMES) {
      this.audio?.finish();
      // Ready for another attempt immediately — the user just plays it again.
      this.stop({ rearm: true });
      return;
    }
    this.onUpdate?.(this.state());
  }

  /**
   * Grade an input against the next expected cue.
   * @param {import("./input/source.mjs").InputEvent} event
   */
  handleInput(event) {
    const cue = this.schedule.cues[this.nextCueIndex];
    if (!cue) return null;
    if (!matchesMove(event, cue.move)) return null;

    // Armed and waiting: this input IS frame 0. Start the clock from the
    // event's own timestamp, not from now — the event may have been captured
    // a few milliseconds ago.
    if (this.armed) {
      this.beginAt(event.timestamp);
      this.results.push({ index: 0, verdict: "perfect", delta: 0, inWindow: true });
      this.nextCueIndex = 1;
      this.audio?.start();
      this.onUpdate?.(this.state());
      return { verdict: "perfect", delta: 0, inWindow: true };
    }

    if (!this.running) return null;

    // Grade from the event's own timestamp rather than this.frame, which only
    // advances on clock ticks and would quantize every input to the last tick.
    const frame = frameAt(event.timestamp, this.startTime);
    const result = gradeInput(cue, frame);
    this.results.push({ index: cue.index, ...result });
    this.nextCueIndex++;

    this.audio?.[result.inWindow ? "hit" : "miss"]();
    this.onUpdate?.(this.state());
    return result;
  }

  state() {
    return {
      running: this.running,
      armed: this.armed,
      frame: this.frame,
      cues: this.schedule.cues,
      transitions: this.schedule.transitions,
      results: this.results,
      nextCueIndex: this.nextCueIndex,
      sampleHz: this.clock.sampleHz,
    };
  }
}

/**
 * Does an input event match the move a cue expects?
 *
 * Matching is intentionally lenient on direction: the frame data's numCmd
 * encodes a motion ("236LP"), and reconstructing a full motion from discrete
 * samples is a different problem from timing. We check the button, which is
 * what the timing verdict is actually about.
 */
export function matchesMove(event, move) {
  const req = parseMoveButton(move.moveButton);
  if (!req) return true; // no button requirement recorded — accept anything

  const got = new Set(event.buttons.map((b) => b.toUpperCase()));
  if (!got.size) return false;

  switch (req.mode) {
    case "all":
      // Throws and Drive Impact need every listed button together.
      return req.buttons.every((b) => got.has(b));
    case "any":
      return req.buttons.some((b) => got.has(b));
    case "count": {
      const of = (kind) => [...got].filter((b) => b.endsWith(kind)).length;
      if (req.kind === "ANY") return got.size >= req.n;
      return of(req.kind) >= req.n;
    }
    default:
      return false;
  }
}

/**
 * Parse the sheet's moveButton field into a button requirement.
 *
 * The field uses several notations, all present in the live data:
 *
 *   "HP"            one specific button
 *   "1P" / "1K"     one punch/kick of ANY strength (the usual special-move
 *                   notation, and the most common form after the plain ones)
 *   "2P" / "3K"     N punches/kicks together — OD/EX moves and macros
 *   "P" / "K"       any punch / any kick
 *   "LPLK"          concatenated specific buttons (throw)
 *   "HPHK" "MPMK"   Drive Impact / Drive Parry
 *   "3P3K"          all six
 *   "HPorHK"        either of two
 *   "LPMP or LPHP"  either of two combinations
 *
 * Returns a requirement the caller tests against the pressed flags:
 *   {mode:"all",  buttons:[...]}  every listed button must be held
 *   {mode:"any",  buttons:[...]}  at least one must be held
 *   {mode:"count", kind:"P"|"K", n} at least n buttons of that kind
 *
 * @param {string|null} raw
 * @returns {{mode:string, buttons?:string[], kind?:string, n?:number}|null}
 */
export function parseMoveButton(raw) {
  const s = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return null;

  const ALL_P = ["LP", "MP", "HP"];
  const ALL_K = ["LK", "MK", "HK"];

  // "AorB" — either alternative satisfies the move. Split first so each side
  // can be parsed by the rules below.
  if (s.includes("OR")) {
    const alts = s.split("OR").filter(Boolean).flatMap((part) => {
      const sub = parseMoveButton(part);
      if (!sub) return [];
      // Flatten alternatives to a simple any-of over concrete buttons.
      if (sub.mode === "count") return sub.kind === "P" ? ALL_P : ALL_K;
      return sub.buttons ?? [];
    });
    return alts.length ? { mode: "any", buttons: [...new Set(alts)] } : null;
  }

  // "3P3K" — all punches and all kicks.
  if (s === "3P3K") return { mode: "count", kind: "ANY", n: 6 };

  // "1P" / "2K" / "3P" — N buttons of one kind, any strengths.
  const count = s.match(/^([123])([PK])$/);
  if (count) return { mode: "count", kind: count[2], n: Number(count[1]) };

  // Bare "P" / "K" — any single button of that kind.
  if (s === "P") return { mode: "count", kind: "P", n: 1 };
  if (s === "K") return { mode: "count", kind: "K", n: 1 };

  // Concatenated specific buttons: "LPLK", "HPHK", "LPMP".
  const pairs = s.match(/[LMH][PK]/g);
  if (pairs?.length) return { mode: "all", buttons: [...new Set(pairs)] };

  // "N", "F", "F,F" and similar are movement/direction markers, not buttons.
  return null;
}
