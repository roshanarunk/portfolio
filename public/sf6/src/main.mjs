/**
 * App wiring: character data -> move browser -> combo builder -> trainer.
 *
 * Paths resolve relative to this module, so the page works wherever the repo
 * root is served from. Frame data lives outside web/, at data/dist/.
 */

import { validateCombo } from "/sf6/core/cancel.mjs";
import { InputHistory, DIRECTION_GLYPHS } from "/sf6/core/history.mjs";
import { detectMotions, motionSatisfied } from "/sf6/core/motion.mjs";
import { FRAME_MS } from "/sf6/core/clock.mjs";
import { PHASE_COLORS } from "/sf6/core/framemeter.mjs";
import { LiveMeter } from "/sf6/core/livemeter.mjs";
import { AudioCues } from "./audio.mjs";
import { Trainer, matchesMove } from "./trainer.mjs";
import { GamepadSource } from "./input/gamepad.mjs";
import { KeyboardSource } from "./input/keyboard.mjs";

/**
 * Relative in source, rewritten to root-absolute at build time.
 *
 * Source keeps relative paths so these modules stay importable by Node — the
 * test suite imports trainer.mjs directly, and a "/core/..." specifier
 * resolves to a filesystem root there, not the repo. scripts/build-site.mjs
 * rewrites these to "/data/dist/" and "/core/" when it flattens web/ to the
 * site root, where the relative depth no longer holds.
 */
const DATA = new URL("/sf6/data/", import.meta.url);

const el = (id) => document.getElementById(id);
const ui = {
  character: el("character"), movelist: el("movelist"), moveCount: el("move-count"),
  search: el("search"), typeFilter: el("type-filter"),
  combo: el("combo"), comboEmpty: el("combo-empty"), caveats: el("caveats"),
  meter: el("meter"), meterRows: el("meter-rows"), meterTitle: el("meter-title"),
  stage: el("stage"), verdict: el("verdict"), hint: el("hint"),
  history: el("history"), clear: el("clear"),
  fps: el("fps"), fpsPill: el("fps-pill"),
  inputStatus: el("input-status"), inputPill: el("input-pill"),
};

/**
 * Keep the roster here so the page never downloads the 4.7MB combined file;
 * each character lazy-loads its own ~150-300KB file. Sync with data/dist/characters/.
 */
const ROSTER = [
  "A.K.I.", "Akuma", "Alex", "Arjun", "Blanka", "C.Viper", "Cammy", "Chun-Li",
  "Dee Jay", "Dhalsim", "E.Honda", "Ed", "Elena", "Guile", "Ingrid", "JP",
  "Jamie", "Juri", "Ken", "Kimberly", "Lily", "Luke", "M.Bison", "Mai",
  "Manon", "Marisa", "Rashid", "Ryu", "Sagat", "Terry", "Yasmine", "Zangief",
];

const state = { character: null, moves: [], combo: [], live: null };
const history = new InputHistory();
const audio = new AudioCues();

const trainer = new Trainer({
  audio,
  onUpdate: (s) => { state.live = s; renderCombo(); renderStatus(); },
});

// --- data -----------------------------------------------------------------

const fileFor = (n) => new URL(`characters/${n.replace(/[^A-Za-z0-9.-]/g, "_")}.json`, DATA);

async function selectCharacter(name) {
  const c = await fetch(fileFor(name)).then((r) => r.json());
  state.character = c;
  state.moves = c.moves;
  state.combo = [];
  state.live = null;
  trainer.stop();
  renderMoves();
  renderCombo();
}

const fv = (v) => (v && typeof v.value === "number" ? v.value : "–");

// --- rendering ------------------------------------------------------------

function renderMoves() {
  const q = ui.search.value.trim().toLowerCase();
  const type = ui.typeFilter.value;
  const rows = state.moves.filter((m) => {
    if (type && m.moveType !== type) return false;
    if (!q) return true;
    return `${m.name} ${m.numCmd ?? ""} ${m.plnCmd ?? ""}`.toLowerCase().includes(q);
  });

  ui.moveCount.textContent = rows.length ? `${rows.length}` : "";
  ui.movelist.innerHTML = rows.length
    ? rows.map((m) => `
      <div class="move" data-id="${esc(m.id)}">
        <span class="cmd mono">${esc(m.numCmd ?? "")}</span>
        <span class="nm">${esc(m.name)}</span>
        <span class="su mono">${fv(m.startup)}f</span>
      </div>`).join("")
    : `<div class="empty">No moves match.</div>`;
}

const TAG_LABEL = {
  cancel: "CANCEL", chain: "CHAIN", link: "LINK",
  unverifiable: "UNVERIFIED", illegal: "ILLEGAL",
};

function renderCombo() {
  const { combo } = state;
  ui.comboEmpty.hidden = combo.length > 0;
  ui.stage.classList.toggle("armed", Boolean(state.live?.armed));

  if (!combo.length) {
    ui.combo.innerHTML = "";
    ui.caveats.hidden = true;
    ui.verdict.textContent = "";
    ui.verdict.className = "verdict mono";
    ui.hint.textContent = "Click moves to build a combo.";
    return;
  }

  const transitions = validateCombo(combo);
  const cues = state.live?.cues ?? trainer.schedule.cues;
  const results = state.live?.results ?? [];
  const next = state.live?.nextCueIndex ?? -1;
  const running = state.live?.running || state.live?.armed;

  ui.combo.innerHTML = combo.map((m, i) => {
    const t = i > 0 ? transitions[i - 1] : null;
    const cue = cues[i];
    const res = results.find((r) => r.index === i);
    const cls = res ? res.verdict : running && i === next ? "next" : "";
    const delta = res ? (res.delta > 0 ? `+${res.delta}` : `${res.delta}`) : "";

    return `
      ${t ? `<li class="xx">
        <span class="tag ${t.kind}">${TAG_LABEL[t.kind] ?? t.kind}</span>
        <span class="why" title="${esc(t.reason)}">${esc(t.reason)}</span>
      </li>` : ""}
      <li>
        <div class="step ${cls}">
          <span class="n mono">${i + 1}</span>
          <span class="cmd mono">${esc(m.numCmd ?? "")}</span>
          <span class="nm">${esc(m.name)}</span>
          <span class="at mono">${cue ? `${cue.frame}f${cue.estimated ? "?" : ""}` : ""}</span>
          <span class="res mono">${res ? (res.verdict === "perfect" ? "✓" : delta) : ""}</span>
          <button class="rm" data-remove="${i}" title="Remove">✕</button>
        </div>
      </li>`;
  }).join("");

  const caveats = [...new Set(transitions.flatMap((t) => t.caveats ?? []))];
  ui.caveats.hidden = caveats.length === 0;
  ui.caveats.innerHTML = caveats.map((c) => `<div>${esc(c)}</div>`).join("");

  renderMeter();

  if (!state.live?.running && !state.live?.armed) {
    const first = combo[0];
    ui.hint.innerHTML = `Press <b>${esc(first.plnCmd ?? first.name)}</b> to begin.`;
  }
}

/**
 * Live frame meter, driven by what was actually pressed — the way SF6's
 * training display behaves.
 *
 * It is not a preview of the planned combo: it reacts to real inputs, holds
 * its state for 60 idle frames, and a cancel truncates the previous move so
 * recovery frames the game never played are not drawn.
 */
const liveMeter = new LiveMeter();

function renderMeter() {
  const { cells } = liveMeter.timeline();

  // Always visible: the meter follows your inputs whether or not a combo is
  // being trained, so hiding it until a combo exists would be misleading.
  ui.meter.hidden = false;

  if (!cells.length) {
    ui.meterTitle.textContent = "Frame meter";
    ui.meterRows.innerHTML = `<div class="strip-empty">Press a button — the meter follows your inputs.</div>`;
    return;
  }

  // ONE continuous strip: frame N is whatever the character was doing on
  // frame N. Moves flow into each other and idle frames show as real gaps,
  // rather than each move getting its own lane.
  const bars = cells.map((c) => {
    const title = c.entry ? `${c.entry.move.name} — ${c.phase} (frame ${c.frame})` : `idle (frame ${c.frame})`;
    return `<span class="fcell ${c.phase}" style="background:${PHASE_COLORS[c.phase]}" title="${esc(title)}"></span>`;
  }).join("");

  // Labels sit under the strip, each aligned to where its move begins.
  const first = liveMeter.entries[0].start;
  const labels = liveMeter.entries.map((entry) => {
    const offset = entry.start - first;
    const m = entry.meter;
    const detail = m.complete
      ? `${m.startup}/${m.active}/${m.recovery}${entry.truncated ? ` → ${entry.length}f` : ""}`
      : "partial";
    return `<span class="flabel" style="left:calc(${offset} * var(--cell))">
      <b>${esc(entry.move.name)}</b> <i>${detail}</i></span>`;
  }).join("");

  ui.meterTitle.textContent = `Frame meter — ${cells.length}f`;
  ui.meterRows.innerHTML = `
    <div class="strip-wrap">
      <div class="strip">${bars}</div>
      <div class="strip-labels">${labels}</div>
    </div>`;
}

function renderHistory() {
  const rows = history.recent(14);
  if (!rows.length) {
    ui.history.innerHTML = `<div class="empty">Your inputs appear here.</div>`;
    return;
  }
  ui.history.innerHTML = rows.map((e) => `
    <div class="hrow ${e.neutral ? "neutral" : ""} ${e.frames >= 10 ? "long" : ""}">
      <span class="dir">${DIRECTION_GLYPHS[e.direction] ?? e.direction}</span>
      <span class="btns">${e.buttons.map((b) =>
        `<span class="chip ${b.endsWith("P") ? "P" : "K"}">${b}</span>`).join("")}</span>
      <span class="f mono">${e.frames}f</span>
    </div>`).join("");
}

function renderStatus() {
  const hz = state.live?.sampleHz ?? 0;
  if (hz) {
    ui.fps.textContent = `${hz}Hz poll`;
    ui.fpsPill.classList.toggle("on", hz >= 100);
  }
}

function showVerdict(result) {
  if (!result) return;
  const text = result.verdict === "perfect"
    ? "PERFECT"
    : `${result.verdict.toUpperCase()} ${result.delta > 0 ? "+" : ""}${result.delta}f`;
  ui.verdict.textContent = text;
  ui.verdict.className = `verdict mono ${result.verdict}`;
}

// --- combo editing --------------------------------------------------------

function rebuild() {
  state.live = null;
  history.clear();
  trainer.setCombo(state.combo);
  if (state.combo.length) {
    trainer.arm();
    state.live = trainer.state();
  }
  renderCombo();
  renderHistory();
}

ui.movelist.addEventListener("click", (e) => {
  const row = e.target.closest(".move");
  if (!row) return;
  const move = state.moves.find((m) => m.id === row.dataset.id);
  if (!move) return;
  state.combo.push(move);
  audio.resume();
  rebuild();
});

ui.combo.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  state.combo.splice(Number(btn.dataset.remove), 1);
  rebuild();
});

ui.clear.addEventListener("click", () => {
  trainer.stop();
  state.combo = [];
  rebuild();
});

ui.character.addEventListener("change", () => selectCharacter(ui.character.value));
ui.search.addEventListener("input", renderMoves);
ui.typeFilter.addEventListener("change", renderMoves);

// --- input ----------------------------------------------------------------

/**
 * The trainer re-arms itself when a run ends (see Trainer.stop), so this only
 * needs to forward the input and show the verdict. Re-arming from here was the
 * bug: a run ends on the clock timing out, with no input involved, so the
 * re-arm never ran and the trainer was dead after one pass.
 */
function onInput(event) {
  const result = trainer.handleInput(event);
  showVerdict(result);

  // Feed the live meter too, so it follows real inputs whether or not a combo
  // is being trained.
  const move = resolveMove(event);
  if (move) {
    liveMeter.press(move, meterFrame());
    renderMeter();
  }
  return result;
}

/**
 * A free-running 60Hz frame counter for the meter.
 *
 * The meter runs whether or not a combo is active, so it cannot borrow the
 * trainer's clock — that only advances during a run.
 */
const meterOrigin = performance.now();
const meterFrame = () => Math.floor((performance.now() - meterOrigin) / FRAME_MS);

/**
 * Which move does this press correspond to?
 *
 * A button alone cannot tell a Hadoken from a standing LP — 14 of Ryu's moves
 * match a bare LP press, and picking the normal every time made specials
 * unreachable. The recent direction history decides: if the player just
 * completed the motion a special requires, that special wins.
 */
function resolveMove(event) {
  if (!state.moves.length) return null;

  const candidates = state.moves.filter((m) =>
    ["normal", "special", "super", "throw", "drive"].includes(m.moveType) && matchesMove(event, m));
  if (!candidates.length) return null;

  const motions = detectMotions(history.entries, meterFrame());

  // Specials and supers first: a completed motion is a deliberate act, and a
  // normal sharing the button is the weaker interpretation.
  const motionMoves = candidates
    .filter((m) => ["special", "super"].includes(m.moveType))
    .filter((m) => {
      const required = String(m.moveMotion ?? "").trim().toUpperCase();
      // A bare press must not select a motion move; require a real motion.
      if (!required || required === "N") return false;
      return motionSatisfied(m.moveMotion, motions, event.direction);
    });

  if (motionMoves.length) {
    // Prefer the most demanding motion satisfied (DQCF over the QCF inside it).
    const rank = (m) => motions.indexOf(String(m.moveMotion).trim().toUpperCase());
    return motionMoves.sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    })[0];
  }

  // Otherwise a normal, stance-specific: 2MK and 5MK share a button.
  const crouching = ["1", "2", "3"].includes(event.direction);
  const stance = candidates.filter((m) =>
    m.moveType === "normal" && (crouching ? /^Crouch/.test(m.name) : /^Stand/.test(m.name)));
  if (stance.length) return stance[0];

  return candidates.find((m) => m.moveType === "normal") ?? candidates[0];
}

const sources = [new KeyboardSource(), new GamepadSource()];

/**
 * Latest held state per source, merged before sampling.
 *
 * Both sources report their held state independently and at their own rate.
 * Feeding each report straight into the history made them fight: the keyboard
 * says "nothing held" in the same instant the pad says "LP held", so samples
 * alternated between the two and a single press rendered as a run of
 * LP/neutral/LP/neutral rows instead of one entry.
 */
const heldBySource = new Map();

for (const src of sources) {
  src.onInput(onInput);
  src.onState(({ direction, buttons }) => {
    heldBySource.set(src, { direction, buttons });
  });
  src.start();
}

/** Union of every source's held buttons, and whichever direction is active. */
function mergedState() {
  let direction = "5";
  const buttons = new Set();
  for (const s of heldBySource.values()) {
    if (s.direction !== "5") direction = s.direction;
    for (const b of s.buttons) buttons.add(b);
  }
  return { direction, buttons: [...buttons] };
}

/**
 * Sample history on a real 60Hz wall clock.
 *
 * The previous counter incremented once per *sample*, so a frame count meant
 * "how many times we looked", not "how long it was held" — a 1-frame tap and
 * a 20-frame hold were indistinguishable. Deriving the frame from elapsed time
 * makes "12f" mean 12 actual frames, and keeps numbering continuous whether or
 * not a run is in progress.
 */
const histOrigin = performance.now();
setInterval(() => {
  const { direction, buttons } = mergedState();
  const frame = trainer.running
    ? trainer.frame
    : Math.floor((performance.now() - histOrigin) / FRAME_MS);
  history.sample(direction, buttons, frame);
}, 1);

// Render history on its own cadence: the ring is sampled far faster than a
// human can read, and re-rendering per sample would waste frames.
setInterval(renderHistory, 50);

// Drive the live meter's idle timeout, and redraw while a move is playing so
// the bars appear as the move progresses rather than all at once.
setInterval(() => {
  const f = meterFrame();
  const cleared = liveMeter.tick(f);
  if (cleared || liveMeter.activeEntry(f)) renderMeter();
}, 50);

setInterval(() => {
  const pads = (navigator.getGamepads?.() ?? []).filter(Boolean);
  if (pads.length) {
    ui.inputStatus.textContent = pads[0].id.replace(/\s*\(.*\)\s*/, "").slice(0, 26);
    ui.inputPill.classList.add("on");
  } else {
    ui.inputStatus.textContent = "Keyboard — press a pad button to connect";
    ui.inputPill.classList.remove("on");
  }
}, 500);

// --- misc -----------------------------------------------------------------

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

ui.character.innerHTML = ROSTER.map((n) => `<option value="${n}">${n}</option>`).join("");
ui.character.value = "Ed";
renderHistory();
selectCharacter("Ed").catch((err) => {
  ui.movelist.innerHTML = `<div class="empty">Could not load frame data.<br>
    Serve the <b>repo root</b> (not web/), then open /web/.<br>${esc(err.message)}</div>`;
});

// Tells the boot-error watchdog in index.html that the module ran to completion.
window.__sf6_booted = true;
