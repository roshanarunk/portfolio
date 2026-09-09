/**
 * A TypeScript port of solver.py from github.com/roshanarunk/Sudoku.
 *
 * The original is 63 lines of pure Python with zero imports — a textbook
 * depth-first backtracking search. This file deliberately keeps that structure
 * (findEmpty / isValid / solve) so the two can be read side by side, and imports
 * nothing itself so it can be unit tested in plain Node with no DOM.
 */

/** A single cell. 0 means empty, matching the Python representation. */
export type Cell = number;

/** A 9x9 grid, row-major. */
export type Board = Cell[][];

export type Pos = readonly [row: number, col: number];

export const SIZE = 9;
export const BOX = 3;

/** Port of `find_empty(bo)`. Returns the first empty cell in row-major order. */
export function findEmpty(board: Board): Pos | null {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) return [row, col];
    }
  }
  return null;
}

/**
 * Port of `valid(bo, num, pos)`. True when `num` may be placed at `pos` without
 * conflicting with the row, column, or 3x3 box.
 *
 * Note on the box check: the Python compares whole tuples — `(i, j) != pos` —
 * which excludes only the candidate cell itself. The tempting translation
 * `r !== row && c !== col` is NOT equivalent: it also skips every cell sharing
 * just a row or just a column with `pos`, silently missing real conflicts. The
 * correct negation of a tuple comparison is `!(r === row && c === col)`, used
 * below. (Here the row and column scans above already caught those cases, so the
 * naive version happens to give the same answer — but only by accident.)
 */
export function isValid(board: Board, num: number, pos: Pos): boolean {
  const [row, col] = pos;

  for (let c = 0; c < SIZE; c++) {
    if (board[row][c] === num && c !== col) return false;
  }

  for (let r = 0; r < SIZE; r++) {
    if (board[r][col] === num && r !== row) return false;
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r++) {
    for (let c = boxCol; c < boxCol + BOX; c++) {
      if (board[r][c] === num && !(r === row && c === col)) return false;
    }
  }

  return true;
}

/**
 * Port of `solve(bo)`. Mutates `board` in place and returns whether it solved.
 * On failure every tentative placement is undone, so the board is left as found.
 * Used for the "Instant" button; the animated path uses `solveSteps`.
 */
export function solve(board: Board): boolean {
  const empty = findEmpty(board);
  if (!empty) return true;

  const [row, col] = empty;
  for (let num = 1; num <= SIZE; num++) {
    if (isValid(board, num, [row, col])) {
      board[row][col] = num;
      if (solve(board)) return true;
      board[row][col] = 0; // backtrack
    }
  }

  return false;
}

/** One decision made by the solver, replayed by the UI to animate the search. */
export type SolveStep =
  | { type: "try"; pos: Pos; value: number }
  | { type: "place"; pos: Pos; value: number }
  | { type: "reject"; pos: Pos; value: number }
  | { type: "backtrack"; pos: Pos }
  | { type: "solved" }
  | { type: "unsolvable" };

/**
 * `solve` rewritten as a generator so the recursion can be paused, stepped and
 * speed-controlled by the UI without changing the algorithm. `yield*` delegation
 * gives the recursive descent for free.
 *
 * The board is mutated in place; the caller holds the same reference, so there
 * is no per-step copying.
 */
export function* solveSteps(board: Board): Generator<SolveStep, boolean, void> {
  const empty = findEmpty(board);
  if (!empty) {
    yield { type: "solved" };
    return true;
  }

  const [row, col] = empty;
  for (let num = 1; num <= SIZE; num++) {
    yield { type: "try", pos: [row, col], value: num };

    if (isValid(board, num, [row, col])) {
      board[row][col] = num;
      yield { type: "place", pos: [row, col], value: num };

      if (yield* solveSteps(board)) return true;

      board[row][col] = 0;
      yield { type: "backtrack", pos: [row, col] };
    } else {
      yield { type: "reject", pos: [row, col], value: num };
    }
  }

  return false;
}

/** Deep copy, so a puzzle can be replayed from its initial state. */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** True when the grid is full and every row, column and box holds 1-9 exactly once. */
export function isSolved(board: Board): boolean {
  const complete = (values: Cell[]) => {
    const seen = new Set(values);
    return seen.size === SIZE && !seen.has(0);
  };

  for (let i = 0; i < SIZE; i++) {
    if (!complete(board[i])) return false;
    if (!complete(board.map((row) => row[i]))) return false;
  }

  for (let boxRow = 0; boxRow < SIZE; boxRow += BOX) {
    for (let boxCol = 0; boxCol < SIZE; boxCol += BOX) {
      const cells: Cell[] = [];
      for (let r = boxRow; r < boxRow + BOX; r++) {
        for (let c = boxCol; c < boxCol + BOX; c++) cells.push(board[r][c]);
      }
      if (!complete(cells)) return false;
    }
  }

  return true;
}
