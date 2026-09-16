"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  type Board,
  type SolveStep,
  cloneBoard,
  solveSteps,
} from "@/components/demos/sudoku/solver";
import { puzzles } from "@/components/demos/sudoku/puzzles";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The detector cross-section.
 *
 * A collider event display reads one collision: tracks curve out of a central
 * vertex through concentric detector layers, and energy deposited in the
 * calorimeter stacks as bars in the outer wedges. Here the collision is the
 * Sudoku solver's search — the real `solveSteps` generator from the project,
 * not a recording — so every figure on screen is a genuine measurement of it.
 *
 * Each of the 81 board cells owns one wedge of the ring. A cell the solver has
 * filled shows a track; the cell it is working on right now is the live track.
 * Energy bars in the outer ring grow with the backtracks charged to each column,
 * which is what makes the cost of the search visible rather than stated.
 */

/** The board from the original GUI.py, which is dense enough to read as a field. */
const BOARD = puzzles[0];
const STEPS_PER_FRAME = 3;

interface RunState {
  board: Board;
  step: SolveStep | null;
  steps: number;
  backtracks: number;
  /** Backtracks charged per column, drawn as calorimeter energy. */
  energy: number[];
  solved: boolean;
}

type Action = { type: "advance"; step: SolveStep; board: Board } | { type: "restart" };

function init(): RunState {
  return {
    board: cloneBoard(BOARD.board),
    step: null,
    steps: 0,
    backtracks: 0,
    energy: Array(9).fill(0),
    solved: false,
  };
}

function reducer(state: RunState, action: Action): RunState {
  if (action.type === "restart") return init();

  const { step } = action;
  let energy = state.energy;
  if (step.type === "backtrack") {
    const col = step.pos[1];
    energy = state.energy.slice();
    energy[col] += 1;
  }

  return {
    board: action.board,
    step,
    steps: state.steps + 1,
    backtracks: state.backtracks + (step.type === "backtrack" ? 1 : 0),
    energy,
    solved: step.type === "solved",
  };
}

export interface EventReadout {
  steps: number;
  backtracks: number;
  solved: boolean;
  running: boolean;
  start: () => void;
}

/*
 * Detector geometry. The layers are sized so tracks actually traverse them:
 * an earlier pass had tracks stopping at the inner ring, which left the outer
 * structure floating with nothing passing through it.
 */
const SIZE = 420;
const C = SIZE / 2;
const R_VERTEX = 18;
const R_INNER = 104;
const R_OUTER = 168;
const R_CALO_IN = 172;
const R_CALO_OUT = 206;

function polar(angle: number, radius: number): [number, number] {
  const a = (angle - 90) * (Math.PI / 180);
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)];
}

/** A wedge of the calorimeter ring, drawn as a filled annular sector. */
function wedgePath(from: number, to: number, rIn: number, rOut: number): string {
  const [x1, y1] = polar(from, rIn);
  const [x2, y2] = polar(to, rIn);
  const [x3, y3] = polar(to, rOut);
  const [x4, y4] = polar(from, rOut);
  const large = to - from > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${rIn} ${rIn} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rOut} ${rOut} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

/**
 * A track: a curve from the vertex out through the detector, bent the way a
 * charged particle bends in a magnetic field.
 *
 * The bend has to be large to read as curvature at all — a few degrees renders
 * as a radial spoke, which is a starburst rather than an event display. A real
 * track sweeps tens of degrees over its flight, and lower-momentum particles
 * (here, cells the solver had to work harder for) curl further.
 */
function trackPath(angle: number, radius: number, bend: number): string {
  const [sx, sy] = polar(angle, R_VERTEX);
  const [ex, ey] = polar(angle + bend, radius);
  // Two control points so the curve leaves the vertex straight and tightens as
  // it travels, which is how a track in a uniform field actually looks.
  const [c1x, c1y] = polar(angle + bend * 0.1, R_VERTEX + (radius - R_VERTEX) * 0.4);
  const [c2x, c2y] = polar(angle + bend * 0.6, R_VERTEX + (radius - R_VERTEX) * 0.75);
  return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;
}

export function useEventDisplay(): EventReadout & { svg: React.ReactNode } {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const reducedMotion = useReducedMotion();
  // Someone who asked for reduced motion gets a still readout until they opt in,
  // so `running` is derived rather than written from an effect.
  const [startedByHand, setStartedByHand] = useState(false);
  const running = !reducedMotion || startedByHand;

  const genRef = useRef<Generator<SolveStep, boolean, void> | null>(null);
  const boardRef = useRef<Board | null>(null);

  useEffect(() => {
    if (!running) return;

    let frame = 0;
    let restartAt = 0;

    const tick = () => {
      // Hold the solved event briefly, then take the next one.
      if (restartAt) {
        if (performance.now() >= restartAt) {
          restartAt = 0;
          genRef.current = null;
          dispatch({ type: "restart" });
        }
        frame = requestAnimationFrame(tick);
        return;
      }

      if (!genRef.current) {
        boardRef.current = cloneBoard(BOARD.board);
        genRef.current = solveSteps(boardRef.current);
      }

      const gen = genRef.current;
      const board = boardRef.current!;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        const next = gen.next();
        if (next.done) {
          restartAt = performance.now() + 2800;
          break;
        }
        dispatch({ type: "advance", step: next.value, board });
        if (next.value.type === "solved") {
          restartAt = performance.now() + 2800;
          break;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const active = state.step && "pos" in state.step ? state.step.pos : null;
  const peakEnergy = Math.max(1, ...state.energy);

  /** One track per solved cell; 81 cells map to 81 slots around the ring. */
  const tracks = useMemo(() => {
    const out: { key: string; d: string; live: boolean; given: boolean }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const value = state.board[r][c];
        if (value === 0) continue;
        const slot = r * 9 + c;
        const angle = (slot / 81) * 360;
        const given = BOARD.board[r][c] !== 0;
        // A given is short and quiet; a solved cell reaches the outer layer.
        const radius = given ? R_INNER : R_OUTER;
        // Charge sign alternates so tracks curl both ways, as in a real event.
        // The value the solver placed sets the curvature: a large digit curls
        // harder, so the field reads as varied rather than uniform.
        const charge = slot % 2 === 0 ? 1 : -1;
        const bend = charge * (given ? 22 : 34 + value * 3);
        out.push({
          key: `${r}-${c}`,
          d: trackPath(angle, radius, bend),
          live: active?.[0] === r && active?.[1] === c,
          given,
        });
      }
    }
    return out;
  }, [state.board, active]);

  const svg = (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Detector view of the Sudoku solver's search: ${state.steps.toLocaleString()} decisions and ${state.backtracks.toLocaleString()} backtracks so far`}
    >
      {/* Calorimeter wedges: energy deposited per column, from real backtracks. */}
      {state.energy.map((e, i) => {
        const from = (i / 9) * 360;
        const to = ((i + 1) / 9) * 360 - 1.5;
        const depth = (e / peakEnergy) * (R_CALO_OUT - R_CALO_IN);
        return (
          <g key={`calo-${i}`}>
            <path
              d={wedgePath(from, to, R_CALO_IN, R_CALO_OUT)}
              fill="none"
              stroke="var(--steel)"
              strokeWidth="1"
            />
            {e > 0 && (
              <path
                d={wedgePath(from, to, R_CALO_IN, R_CALO_IN + Math.max(depth, 2))}
                fill="var(--energy)"
                opacity="0.85"
              />
            )}
          </g>
        );
      })}

      {/* Detector layers. */}
      <circle
        cx={C}
        cy={C}
        r={R_OUTER}
        fill="none"
        stroke="var(--ring)"
        strokeWidth="1"
      />
      <circle
        cx={C}
        cy={C}
        r={R_INNER}
        fill="none"
        stroke="var(--steel)"
        strokeWidth="1"
      />
      <circle
        cx={C}
        cy={C}
        r={(R_INNER + R_OUTER) / 2}
        fill="none"
        stroke="var(--steel)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* Tracks: one per filled cell, curving out of the vertex. */}
      {tracks.map((t) => (
        <path
          key={t.key}
          d={t.d}
          fill="none"
          stroke={t.live ? "var(--beam)" : "var(--track)"}
          strokeWidth={t.live ? 2.5 : t.given ? 0.7 : 1}
          opacity={t.live ? 1 : t.given ? 0.35 : 0.75}
          strokeLinecap="round"
          className={t.live ? "track-live" : undefined}
          strokeDasharray={t.live ? "6 5" : undefined}
        />
      ))}

      {/* The collision vertex. */}
      <circle
        cx={C}
        cy={C}
        r={R_VERTEX}
        fill="var(--vac)"
        stroke="var(--ring)"
        strokeWidth="1"
      />
      <circle cx={C} cy={C} r="3" fill="var(--beam)" />
    </svg>
  );

  return {
    steps: state.steps,
    backtracks: state.backtracks,
    solved: state.solved,
    running,
    start: () => setStartedByHand(true),
    svg,
  };
}
