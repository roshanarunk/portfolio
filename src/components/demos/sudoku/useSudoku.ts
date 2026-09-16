"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  type Board,
  type Pos,
  type SolveStep,
  cloneBoard,
  isValid,
  solve,
  solveSteps,
} from "./solver";
import { defaultPuzzle, puzzles, type Puzzle } from "./puzzles";

export type Mode = "playing" | "solving" | "paused" | "solved" | "unsolvable";

export interface SudokuState {
  puzzleId: string;
  /** The untouched puzzle, used for reset and for styling given cells. */
  initial: Board;
  board: Board;
  /** Pencil marks, mirroring the "sketch" values in the original GUI.py. */
  notes: number[][][];
  selected: Pos | null;
  strikes: number;
  elapsedMs: number;
  mode: Mode;
  stepsPerSecond: number;
  stepCount: number;
  backtracks: number;
  /** Current recursion depth, shown so the search is legible. */
  depth: number;
  lastStep: SolveStep | null;
}

type Action =
  | { type: "select"; pos: Pos }
  | { type: "move"; dRow: number; dCol: number }
  | { type: "input"; value: number }
  | { type: "toggleNote"; value: number }
  | { type: "clearCell" }
  | { type: "loadPuzzle"; puzzle: Puzzle }
  | { type: "reset" }
  | { type: "startSolving" }
  | { type: "pause" }
  | { type: "applyStep"; step: SolveStep; board: Board }
  | { type: "instantSolve" }
  | { type: "setSpeed"; value: number }
  | { type: "tick"; deltaMs: number };

const emptyNotes = (): number[][][] =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

export function initState(puzzle: Puzzle = defaultPuzzle): SudokuState {
  return {
    puzzleId: puzzle.id,
    initial: cloneBoard(puzzle.board),
    board: cloneBoard(puzzle.board),
    notes: emptyNotes(),
    selected: null,
    strikes: 0,
    elapsedMs: 0,
    mode: "playing",
    stepsPerSecond: 60,
    stepCount: 0,
    backtracks: 0,
    depth: 0,
    lastStep: null,
  };
}

function reducer(state: SudokuState, action: Action): SudokuState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.pos };

    case "move": {
      const [row, col] = state.selected ?? [0, 0];
      const next: Pos = [
        Math.min(8, Math.max(0, row + action.dRow)),
        Math.min(8, Math.max(0, col + action.dCol)),
      ];
      return { ...state, selected: next };
    }

    case "input": {
      if (!state.selected || state.mode === "solving") return state;
      const [row, col] = state.selected;
      // Givens are fixed, exactly as in the original.
      if (state.initial[row][col] !== 0) return state;

      // The original counts a strike for each wrong guess rather than blocking it.
      const correct = isValid(state.board, action.value, [row, col]);
      if (!correct) {
        return { ...state, strikes: state.strikes + 1 };
      }

      const board = cloneBoard(state.board);
      board[row][col] = action.value;
      const notes = state.notes.map((r) => r.map((c) => [...c]));
      notes[row][col] = [];

      const full = board.every((r) => r.every((v) => v !== 0));
      return {
        ...state,
        board,
        notes,
        mode: full ? "solved" : state.mode,
      };
    }

    case "toggleNote": {
      if (!state.selected || state.mode === "solving") return state;
      const [row, col] = state.selected;
      if (state.initial[row][col] !== 0 || state.board[row][col] !== 0) return state;

      const notes = state.notes.map((r) => r.map((c) => [...c]));
      const cell = notes[row][col];
      const index = cell.indexOf(action.value);
      if (index >= 0) cell.splice(index, 1);
      else cell.push(action.value);
      return { ...state, notes };
    }

    case "clearCell": {
      if (!state.selected || state.mode === "solving") return state;
      const [row, col] = state.selected;
      if (state.initial[row][col] !== 0) return state;
      const board = cloneBoard(state.board);
      board[row][col] = 0;
      const notes = state.notes.map((r) => r.map((c) => [...c]));
      notes[row][col] = [];
      return { ...state, board, notes, mode: "playing" };
    }

    case "loadPuzzle":
      return { ...initState(action.puzzle), stepsPerSecond: state.stepsPerSecond };

    case "reset": {
      const puzzle = puzzles.find((p) => p.id === state.puzzleId) ?? defaultPuzzle;
      return { ...initState(puzzle), stepsPerSecond: state.stepsPerSecond };
    }

    case "startSolving":
      return {
        ...state,
        mode: "solving",
        selected: null,
        stepCount: 0,
        backtracks: 0,
        depth: 0,
        lastStep: null,
      };

    case "pause":
      return { ...state, mode: state.mode === "solving" ? "paused" : state.mode };

    case "applyStep": {
      const { step } = action;
      const next: SudokuState = {
        ...state,
        // The generator mutates one array in place; copy so React sees a change.
        board: cloneBoard(action.board),
        stepCount: state.stepCount + 1,
        lastStep: step,
      };

      if (step.type === "place") next.depth = state.depth + 1;
      if (step.type === "backtrack") {
        next.backtracks = state.backtracks + 1;
        next.depth = Math.max(0, state.depth - 1);
      }
      if (step.type === "solved") next.mode = "solved";
      if (step.type === "unsolvable") next.mode = "unsolvable";

      return next;
    }

    case "instantSolve": {
      const board = cloneBoard(state.board);
      const ok = solve(board);
      return {
        ...state,
        board: ok ? board : state.board,
        mode: ok ? "solved" : "unsolvable",
        selected: null,
      };
    }

    case "setSpeed":
      return { ...state, stepsPerSecond: action.value };

    case "tick":
      return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };

    default:
      return state;
  }
}

/** Caps work per frame so a fast setting cannot block the main thread. */
const MAX_STEPS_PER_FRAME = 2000;

export function useSudoku(reducedMotion: boolean) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initState());

  // The generator and its mutable board live outside React state: they are
  // iteration cursors, not renderable values.
  const genRef = useRef<Generator<SolveStep, boolean, void> | null>(null);
  const boardRef = useRef<Board | null>(null);

  const startSolving = useCallback(() => {
    boardRef.current = cloneBoard(state.board);
    genRef.current = solveSteps(boardRef.current);
    dispatch({ type: "startSolving" });
  }, [state.board]);

  const stepOnce = useCallback(() => {
    const gen = genRef.current;
    const board = boardRef.current;
    if (!gen || !board) return false;

    const next = gen.next();
    if (next.done) {
      dispatch({
        type: "applyStep",
        step: next.value ? { type: "solved" } : { type: "unsolvable" },
        board,
      });
      return false;
    }
    dispatch({ type: "applyStep", step: next.value, board });
    return true;
  }, []);

  // Drive the animation with rAF rather than setInterval: it pauses in
  // background tabs, never drifts, and the per-frame budget lets high speeds
  // run thousands of steps while React still renders only once per frame.
  useEffect(() => {
    if (state.mode !== "solving") return;

    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      const msPerStep = 1000 / state.stepsPerSecond;
      carry += now - last;
      last = now;

      let budget = 0;
      let alive = true;
      while (carry >= msPerStep && budget < MAX_STEPS_PER_FRAME && alive) {
        carry -= msPerStep;
        budget++;
        alive = stepOnce();
      }

      if (alive) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.mode, state.stepsPerSecond, stepOnce]);

  // Play-mode timer, mirroring the original.
  useEffect(() => {
    if (state.mode !== "playing") return;
    const id = window.setInterval(() => {
      dispatch({ type: "tick", deltaMs: 1000 });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.mode]);

  // Visitors who asked for reduced motion get a slower default they can raise.
  useEffect(() => {
    if (reducedMotion) dispatch({ type: "setSpeed", value: 8 });
  }, [reducedMotion]);

  return { state, dispatch, startSolving, stepOnce };
}
