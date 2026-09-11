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
 * The landing page's artifact: the real backtracking solver from the Sudoku
 * project, running the hardest board on a loop.
 *
 * This is the same `solveSteps` generator the full demo uses — not a recording
 * and not a re-implementation — so the counters below are the genuine cost of
 * the search. It exists because a portfolio in Experience mode has to lead with
 * the work rather than a description of it.
 */

const HARDEST = puzzles[2];
const STEPS_PER_FRAME = 42;

interface RunState {
  board: Board;
  step: SolveStep | null;
  steps: number;
  backtracks: number;
  done: boolean;
}

type Action = { type: "advance"; step: SolveStep; board: Board } | { type: "restart" };

function init(): RunState {
  return {
    board: cloneBoard(HARDEST.board),
    step: null,
    steps: 0,
    backtracks: 0,
    done: false,
  };
}

function reducer(state: RunState, action: Action): RunState {
  if (action.type === "restart") return init();
  return {
    board: action.board,
    step: action.step,
    steps: state.steps + 1,
    backtracks:
      state.backtracks + (action.step.type === "backtrack" ? 1 : 0),
    done: action.step.type === "solved",
  };
}

export function HeroSolver() {
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
      // Hold the solved grid briefly, then start over.
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
        boardRef.current = cloneBoard(HARDEST.board);
        genRef.current = solveSteps(boardRef.current);
      }

      const gen = genRef.current;
      const board = boardRef.current!;

      // Many steps per frame: the honest cost of this board is ~450k decisions,
      // so one-per-frame would take hours to finish.
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        const next = gen.next();
        if (next.done) {
          restartAt = performance.now() + 2200;
          break;
        }
        dispatch({ type: "advance", step: next.value, board });
        if (next.value.type === "solved") {
          restartAt = performance.now() + 2200;
          break;
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const active = state.step && "pos" in state.step ? state.step.pos : null;

  return (
    <figure className="m-0">
      <div
        className="grid aspect-square w-full grid-cols-9 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 p-px dark:border-neutral-800 dark:bg-neutral-800"
        role="img"
        aria-label={`The Sudoku solver working through the hardest board: ${state.steps.toLocaleString()} decisions so far`}
      >
        {state.board.map((row, r) =>
          row.map((value, c) => {
            const given = HARDEST.board[r][c] !== 0;
            const isActive = active?.[0] === r && active?.[1] === c;
            return (
              <span
                key={`${r}-${c}`}
                className={cn(
                  "flex items-center justify-center bg-white text-[0.8rem] tabular-nums sm:text-sm dark:bg-neutral-950",
                  given
                    ? "font-semibold text-neutral-900 dark:text-neutral-100"
                    : "text-emerald-700 dark:text-emerald-400",
                  isActive && "bg-emerald-500/15 dark:bg-emerald-400/20",
                )}
              >
                {value !== 0 ? value : ""}
              </span>
            );
          }),
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <span className="text-neutral-900 tabular-nums dark:text-neutral-100">
            {state.steps.toLocaleString()}
          </span>{" "}
          decisions
        </span>
        <span>
          <span className="text-neutral-900 tabular-nums dark:text-neutral-100">
            {state.backtracks.toLocaleString()}
          </span>{" "}
          backtracks
        </span>
        {!running && (
          <button
            type="button"
            onClick={() => setStartedByHand(true)}
            className="text-emerald-700 underline underline-offset-4 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Run it
          </button>
        )}
      </figcaption>
    </figure>
  );
}
