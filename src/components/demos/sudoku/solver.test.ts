import { describe, it, expect } from "vitest";
import {
  type Board,
  type SolveStep,
  cloneBoard,
  findEmpty,
  isSolved,
  isValid,
  solve,
  solveSteps,
} from "./solver";
import { puzzles } from "./puzzles";

const original = () => cloneBoard(puzzles[0].board);
const easy = () => cloneBoard(puzzles[1].board);

/** Runs a generator to completion, collecting the steps it emitted. */
function runSteps(board: Board) {
  const steps: SolveStep[] = [];
  const gen = solveSteps(board);
  let next = gen.next();
  while (!next.done) {
    steps.push(next.value);
    next = gen.next();
  }
  return { steps, solved: next.value };
}

/**
 * Tallies steps without retaining them. The hardest board emits hundreds of
 * thousands of steps, and holding them all would only measure array growth.
 */
function tallySteps(board: Board) {
  const counts = { total: 0, place: 0, backtrack: 0, try: 0 };
  const gen = solveSteps(board);
  let next = gen.next();
  while (!next.done) {
    counts.total++;
    const type = next.value.type;
    if (type === "place") counts.place++;
    else if (type === "backtrack") counts.backtrack++;
    else if (type === "try") counts.try++;
    next = gen.next();
  }
  return { counts, solved: next.value };
}

describe("findEmpty", () => {
  it("returns the first empty cell in row-major order", () => {
    expect(findEmpty(original())).toEqual([0, 2]);
  });

  it("returns null when the board is full", () => {
    const board = original();
    solve(board);
    expect(findEmpty(board)).toBeNull();
  });
});

describe("isValid", () => {
  it("rejects a number already in the same row", () => {
    expect(isValid(original(), 7, [0, 2])).toBe(false);
  });

  it("rejects a number already in the same column", () => {
    // Column 2 holds a 7 at row 3, so 7 cannot go at [0,2].
    expect(isValid(original(), 7, [0, 2])).toBe(false);
  });

  it("accepts a number that conflicts nowhere", () => {
    // Row 0, column 2 and the top-left box leave only 3 and 5 open at [0,2].
    expect(isValid(original(), 3, [0, 2])).toBe(true);
    expect(isValid(original(), 5, [0, 2])).toBe(true);
  });

  it("ignores the candidate cell itself when it already holds the number", () => {
    // Cell [0,0] holds 7; asking whether 7 is valid there must not self-conflict.
    expect(isValid(original(), 7, [0, 0])).toBe(true);
  });

  /**
   * Guards the tuple-comparison gotcha called out in solver.ts: a cell sharing
   * only a row (or only a column) with `pos` must still count as a conflict.
   * The naive `r !== row && c !== col` port would wrongly skip it and return true.
   */
  it("still sees a box conflict in a cell sharing only the row", () => {
    const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0][1] = 4; // same row as [0,0], same box
    expect(isValid(board, 4, [0, 0])).toBe(false);
  });

  it("still sees a box conflict in a cell sharing only the column", () => {
    const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[1][0] = 4; // same column as [0,0], same box
    expect(isValid(board, 4, [0, 0])).toBe(false);
  });
});

describe("solve", () => {
  it("solves the original GUI.py board to its known solution", () => {
    const board = original();
    expect(solve(board)).toBe(true);
    expect(board).toEqual([
      [7, 8, 5, 4, 3, 9, 1, 2, 6],
      [6, 1, 2, 8, 7, 5, 3, 4, 9],
      [4, 9, 3, 6, 2, 1, 5, 7, 8],
      [8, 5, 7, 9, 4, 3, 2, 6, 1],
      [2, 6, 1, 7, 5, 8, 9, 3, 4],
      [9, 3, 4, 1, 6, 2, 7, 8, 5],
      [5, 7, 8, 3, 9, 4, 6, 1, 2],
      [1, 2, 6, 5, 8, 7, 4, 9, 3],
      [3, 4, 9, 2, 1, 6, 8, 5, 7],
    ]);
  });

  /**
   * Broader than a single fixture: any solved board must satisfy the rules on
   * every row, column and box. Catches isValid bugs one puzzle would miss.
   */
  it.each(puzzles.map((p) => [p.name, p.board] as const))(
    "produces a structurally valid solution for %s",
    (_name, board) => {
      const working = cloneBoard(board);
      expect(solve(working)).toBe(true);
      expect(isSolved(working)).toBe(true);
    },
  );

  it("preserves every given from the puzzle", () => {
    const start = original();
    const board = cloneBoard(start);
    solve(board);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (start[r][c] !== 0) expect(board[r][c]).toBe(start[r][c]);
      }
    }
  });

  it("returns false and fully unwinds on an unsolvable board", () => {
    const board = easy();
    board[0][2] = 5; // duplicate 5 in row 0 — no solution exists
    const before = cloneBoard(board);
    expect(solve(board)).toBe(false);
    expect(board).toEqual(before);
  });
});

describe("solveSteps", () => {
  it("reaches the same solution as solve()", () => {
    const viaSolve = original();
    solve(viaSolve);

    const viaSteps = original();
    const { solved } = runSteps(viaSteps);

    expect(solved).toBe(true);
    expect(viaSteps).toEqual(viaSolve);
  });

  it("ends with a solved step", () => {
    const { steps } = runSteps(original());
    expect(steps.at(-1)).toEqual({ type: "solved" });
  });

  it("reports an already-solved board immediately with no guessing", () => {
    const board = original();
    solve(board);
    const { steps, solved } = runSteps(board);
    expect(solved).toBe(true);
    expect(steps).toEqual([{ type: "solved" }]);
  });

  it("emits a place step for every cell it fills", () => {
    const board = original();
    const emptyCount = board.flat().filter((v) => v === 0).length;
    const { counts } = tallySteps(board);
    // Every fill either survives to the end or is undone by a backtrack.
    expect(counts.place - counts.backtrack).toBe(emptyCount);
  });

  it("solves the hardest board with far more search than the original", () => {
    const originalWork = tallySteps(original());
    const hardest = tallySteps(cloneBoard(puzzles[2].board));

    expect(hardest.solved).toBe(true);
    // The whole reason that puzzle is in the picker: the cost is visceral.
    expect(hardest.counts.total).toBeGreaterThan(originalWork.counts.total * 50);
  });
});
