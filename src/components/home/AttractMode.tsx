"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  type Board,
  type SolveStep,
  cloneBoard,
  solveSteps,
} from "@/components/demos/sudoku/solver";
import { puzzles } from "@/components/demos/sudoku/puzzles";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * The machine, running itself.
 *
 * This fills the first viewport rather than sitting beside it: an arcade
 * cabinet in attract mode IS the screen, and the marquee sits over the glass.
 * The board is the real backtracking solver from the Sudoku project — the same
 * `solveSteps` generator the full demo uses, not a recording — so the counters
 * are the genuine cost of the search.
 */

/**
 * The board from the original GUI.py, not the famous hardest one.
 *
 * Inkala's puzzle has 21 givens, which renders as a nearly empty grid — fine in
 * a small panel, wrong as the thing filling the first viewport. The original
 * board is denser, so the screen reads as a machine mid-search rather than as a
 * scattering of digits, and it is the puzzle this project actually shipped with.
 */
const BOARD = puzzles[0];

/**
 * Slow enough to watch. The original board solves in a few thousand decisions,
 * so a large per-frame budget would finish it before anyone looked up.
 */
const STEPS_PER_FRAME = 3;

interface RunState {
  board: Board;
  step: SolveStep | null;
  steps: number;
  backtracks: number;
  solved: boolean;
}

type Action = { type: "advance"; step: SolveStep; board: Board } | { type: "restart" };

function init(): RunState {
  return {
    board: cloneBoard(BOARD.board),
    step: null,
    steps: 0,
    backtracks: 0,
    solved: false,
  };
}

function reducer(state: RunState, action: Action): RunState {
  if (action.type === "restart") return init();
  return {
    board: action.board,
    step: action.step,
    steps: state.steps + 1,
    backtracks: state.backtracks + (action.step.type === "backtrack" ? 1 : 0),
    solved: action.step.type === "solved",
  };
}

export interface AttractModeState {
  steps: number;
  backtracks: number;
  solved: boolean;
  running: boolean;
  start: () => void;
}

/** Drives the solver and reports its state, so the frame can render the score. */
export function useAttractMode(): AttractModeState & { node: React.ReactNode } {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const reducedMotion = useReducedMotion();
  // Someone who asked for reduced motion gets a still board until they opt in,
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
      // Hold the solved grid briefly, then start over — the attract loop.
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

      // A few steps per frame: fast enough that the grid visibly fills, slow
      // enough that the backtracking is legible as it happens.
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        const next = gen.next();
        if (next.done) {
          restartAt = performance.now() + 2600;
          break;
        }
        dispatch({ type: "advance", step: next.value, board });
        if (next.value.type === "solved") {
          restartAt = performance.now() + 2600;
          break;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const active = state.step && "pos" in state.step ? state.step.pos : null;

  const node = (
    <div
      className="grid h-full w-full grid-cols-9 grid-rows-9"
      role="img"
      aria-label={`The Sudoku solver working the board from the original project: ${state.steps.toLocaleString()} decisions so far`}
    >
      {state.board.map((row, r) =>
        row.map((value, c) => {
          const given = BOARD.board[r][c] !== 0;
          const isActive = active?.[0] === r && active?.[1] === c;
          return (
            <span
              key={`${r}-${c}`}
              className={cn(
                "score relative flex items-center justify-center text-[clamp(0.7rem,2.2vw,1.6rem)]",
                // Hairlines everywhere, heavy rules on the 3x3 box seams, so
                // the grid reads as a Sudoku board rather than graph paper.
                "border-t border-l border-[var(--rule-soft)]",
                r % 3 === 0 && "border-t-2 border-t-[var(--rule)]",
                c % 3 === 0 && "border-l-2 border-l-[var(--rule)]",
                r === 8 && "border-b border-b-[var(--rule-soft)]",
                c === 8 && "border-r border-r-[var(--rule-soft)]",
                given
                  ? "font-bold text-[var(--ink)]"
                  : "font-semibold text-[var(--score)]",
                isActive && "bg-[var(--live)] text-[var(--on-live)]",
              )}
            >
              {value !== 0 ? value : ""}
            </span>
          );
        }),
      )}
    </div>
  );

  return {
    steps: state.steps,
    backtracks: state.backtracks,
    solved: state.solved,
    running,
    start: () => setStartedByHand(true),
    node,
  };
}
