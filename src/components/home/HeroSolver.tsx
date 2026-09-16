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
 * Attract mode.
 *
 * An arcade cabinet plays itself while nobody is watching, which is exactly what
 * this is: the real backtracking solver from the Sudoku project, working the
 * hardest known board on a loop. The same `solveSteps` generator the full demo
 * uses — not a recording and not a re-implementation — so the counters are the
 * genuine cost of the search.
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
    backtracks: state.backtracks + (action.step.type === "backtrack" ? 1 : 0),
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
    <div className="relative">
      <div
        className="grid aspect-square w-full grid-cols-9 gap-px border-2 border-[var(--rule)] bg-[var(--rule-soft)] p-px"
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
                  "score flex items-center justify-center bg-[var(--ground-panel)] text-[0.8rem] sm:text-base",
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

      {/* Cabinet scores: the real cost of the search, counted as it runs. */}
      <dl className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <dt className="screened text-[0.65rem] text-[var(--ink-dim)]">Decisions</dt>
          <dd className="score marquee mt-1 text-2xl text-[var(--score)]">
            {state.steps.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="screened text-[0.65rem] text-[var(--ink-dim)]">Backtracks</dt>
          <dd className="score marquee mt-1 text-2xl text-[var(--score)]">
            {state.backtracks.toLocaleString()}
          </dd>
        </div>
        {!running && (
          <button
            type="button"
            onClick={() => setStartedByHand(true)}
            className="screened ml-auto self-center bg-[var(--live)] px-4 py-2.5 text-[0.7rem] text-[var(--on-live)] transition-opacity hover:opacity-90"
          >
            Run it
          </button>
        )}
      </dl>
    </div>
  );
}
