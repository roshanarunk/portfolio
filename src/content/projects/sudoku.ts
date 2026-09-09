import type { Project } from "@/lib/types";

export const sudoku: Project = {
  slug: "sudoku",
  title: "Sudoku Solver",
  tagline: "A backtracking solver you can watch think.",
  year: "2022",
  tier: 1,
  featured: true,
  collection: "personal",
  tech: [
    { label: "Python", category: "language" },
    { label: "pygame", category: "library" },
    { label: "TypeScript", category: "language" },
  ],
  repoUrl: "https://github.com/roshanarunk/Sudoku",
  summary:
    "A playable Sudoku board with a depth-first backtracking solver, written in Python with pygame. The solver is ported to TypeScript here so you can step through the search in the browser.",
  longDescription: [
    "The original is two files: solver.py holds the algorithm and GUI.py draws a pygame board with cell selection, pencil marks, a strike counter and a timer. Keeping the solver free of any dependency on the UI was the point — it imports nothing at all, which is what made it portable years later.",
    "The interesting part of a Sudoku solver is not that it finds the answer but how much work it does to get there. Backtracking commits to a guess, walks as deep as it can, and unwinds the moment the board becomes contradictory. That cost is invisible when you print the finished grid, so the demo exposes it: every attempt, placement and undo is a step you can watch.",
    "To animate it without rewriting the algorithm, I re-expressed solve() as a generator that yields each decision. The recursion is unchanged — yield* delegates through it — but the caller now controls the pace, which is what makes stepping, pausing and speed control possible.",
  ],
  highlights: [
    "Solver logic is pure and dependency-free, so it unit tests in plain Node with no DOM",
    "Generator-based stepping animates the real recursion rather than a re-implementation",
    "Runs on requestAnimationFrame with a per-frame budget, so high speeds never block the page",
    "The hardest board takes ~700x the search of the original — visible live in the step counter",
  ],
  challenges: [
    {
      problem:
        "Porting the box-conflict check looked trivial but hid a real bug. The Python compares tuples — (i, j) != pos — and the obvious translation, r !== row && c !== col, is not equivalent: it also skips every cell sharing just a row or just a column, missing genuine conflicts.",
      solution:
        "The correct negation is !(r === row && c === col). Two unit tests pin the exact case the naive port would get wrong. It happens not to change the answer here because the row and column scans already ran, but only by accident.",
    },
    {
      problem:
        "My first choice of showcase puzzle was one built to defeat left-to-right backtracking. Measured, it needed 622 million decisions and pegged a CPU core for 12 seconds — which reads as a broken page, not an impressive one.",
      solution:
        "Swapped in Arto Inkala's 2012 puzzle: roughly 450,000 decisions, still ~700x the original board, but done in under 20ms.",
    },
  ],
  demo: {
    kind: "live",
    componentId: "sudoku",
    title: "Sudoku, solved live",
    instructions:
      "Play it yourself, or switch to Watch it solve and try the hardest board.",
    badge: "Runs entirely in your browser",
    sourceUrl: "https://github.com/roshanarunk/Sudoku/blob/main/solver.py",
  },
};
