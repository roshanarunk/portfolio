import type { Board } from "./solver";

export interface Puzzle {
  id: string;
  name: string;
  /** Why this board is worth showing — surfaced in the UI. */
  note: string;
  board: Board;
}

/** The board hard-coded in the original GUI.py. */
const ORIGINAL: Board = [
  [7, 8, 0, 4, 0, 0, 1, 2, 0],
  [6, 0, 0, 0, 7, 5, 0, 0, 9],
  [0, 0, 0, 6, 0, 1, 0, 7, 8],
  [0, 0, 7, 0, 4, 0, 2, 6, 0],
  [0, 0, 1, 0, 5, 0, 9, 3, 0],
  [9, 0, 4, 0, 6, 0, 0, 0, 5],
  [0, 7, 0, 3, 0, 0, 0, 1, 2],
  [1, 2, 0, 0, 0, 7, 4, 0, 0],
  [0, 4, 9, 2, 0, 6, 0, 0, 7],
];

/** Comfortable board: lots of givens, so the solver barely has to guess. */
const EASY: Board = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

/**
 * Arto Inkala's 2012 puzzle, widely billed as the hardest Sudoku ever composed.
 * Naive left-to-right backtracking needs roughly 700x the decisions of the
 * original board to crack it — which is the entire point of showing it. It still
 * finishes in well under a second, so the demo never appears to hang.
 */
const HARDEST: Board = [
  [8, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 3, 6, 0, 0, 0, 0, 0],
  [0, 7, 0, 0, 9, 0, 2, 0, 0],
  [0, 5, 0, 0, 0, 7, 0, 0, 0],
  [0, 0, 0, 0, 4, 5, 7, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 3, 0],
  [0, 0, 1, 0, 0, 0, 0, 6, 8],
  [0, 0, 8, 5, 0, 0, 0, 1, 0],
  [0, 9, 0, 0, 0, 0, 4, 0, 0],
];

export const puzzles: Puzzle[] = [
  {
    id: "original",
    name: "The original",
    note: "The exact board hard-coded in my GUI.py.",
    board: ORIGINAL,
  },
  {
    id: "easy",
    name: "Easy",
    note: "Plenty of givens — the solver walks it almost without guessing.",
    board: EASY,
  },
  {
    id: "hardest",
    name: "World's hardest",
    note: "Inkala's 2012 puzzle. ~700x the search of the original — watch the counter.",
    board: HARDEST,
  },
];

export const defaultPuzzle = puzzles[0];
