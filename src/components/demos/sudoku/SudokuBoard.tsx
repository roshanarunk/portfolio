"use client";

import { useEffect, useRef } from "react";
import type { SudokuState } from "./useSudoku";
import type { Pos } from "./solver";
import { cn } from "@/lib/utils";

interface Props {
  state: SudokuState;
  onSelect: (pos: Pos) => void;
  onMove: (dRow: number, dCol: number) => void;
  onInput: (value: number) => void;
  onToggleNote: (value: number) => void;
  onClear: () => void;
  reducedMotion: boolean;
}

/** Cell highlight driven by the solver's most recent decision. */
function stepClass(state: SudokuState, row: number, col: number) {
  const step = state.lastStep;
  if (!step || state.mode === "playing") return "";
  if (!("pos" in step)) return "";
  if (step.pos[0] !== row || step.pos[1] !== col) return "";

  switch (step.type) {
    case "try":
      return "bg-amber-100 dark:bg-amber-950/60";
    case "place":
      return "bg-emerald-100 dark:bg-emerald-950/60";
    case "reject":
    case "backtrack":
      return "bg-rose-100 dark:bg-rose-950/60";
    default:
      return "";
  }
}

export function SudokuBoard({
  state,
  onSelect,
  onMove,
  onInput,
  onToggleNote,
  onClear,
  reducedMotion,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selRow, selCol] = state.selected ?? [-1, -1];

  // Keep DOM focus on the selected cell so arrow keys and screen readers agree.
  useEffect(() => {
    if (!state.selected || !gridRef.current) return;
    if (!gridRef.current.contains(document.activeElement)) return;
    const cell = gridRef.current.querySelector<HTMLButtonElement>(
      `[data-cell="${selRow}-${selCol}"]`,
    );
    cell?.focus();
  }, [selRow, selCol, state.selected]);

  function handleKeyDown(event: React.KeyboardEvent) {
    const { key, shiftKey } = event;

    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (key in moves) {
      event.preventDefault();
      onMove(moves[key][0], moves[key][1]);
      return;
    }

    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      // Shift enters a pencil mark, matching the sketch values in the original.
      if (shiftKey) onToggleNote(Number(key));
      else onInput(Number(key));
      return;
    }

    if (key === "Backspace" || key === "Delete" || key === "0") {
      event.preventDefault();
      onClear();
      return;
    }

    // Escape must release focus rather than trap the visitor inside the grid.
    if (key === "Escape") {
      (event.currentTarget as HTMLElement).blur();
    }
  }

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Sudoku board"
      onKeyDown={handleKeyDown}
      className="grid aspect-square w-[min(90vw,28rem)] shrink-0 grid-cols-9 gap-px overflow-hidden rounded-lg bg-neutral-300 p-px dark:bg-neutral-700"
    >
      {state.board.map((cells, row) =>
        cells.map((value, col) => {
          const given = state.initial[row][col] !== 0;
          const selected = selRow === row && selCol === col;
          const notes = state.notes[row][col];
          // One tab stop for the whole grid; arrows move within it.
          const isTabStop = state.selected ? selected : row === 0 && col === 0;

          const label = `Row ${row + 1}, column ${col + 1}, ${
            value === 0 ? "empty" : value
          }${given ? ", given" : ""}`;

          return (
            <button
              key={`${row}-${col}`}
              type="button"
              role="gridcell"
              data-cell={`${row}-${col}`}
              tabIndex={isTabStop ? 0 : -1}
              aria-label={label}
              aria-selected={selected}
              onClick={() => onSelect([row, col])}
              className={cn(
                "relative flex items-center justify-center bg-white text-lg font-medium tabular-nums outline-none dark:bg-neutral-950",
                !reducedMotion && "tx duration-150",
                // Thicker rules on 3x3 box seams.
                col % 3 === 0 && col !== 0 && "ml-0.5",
                row % 3 === 0 && row !== 0 && "mt-0.5",
                given
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-blue-600 dark:text-blue-400",
                stepClass(state, row, col),
                selected && "ring-2 ring-neutral-900 ring-inset dark:ring-neutral-100",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
              )}
            >
              {value !== 0 ? (
                value
              ) : notes.length > 0 ? (
                <span className="grid size-full grid-cols-3 p-0.5 text-[0.5rem] leading-none text-neutral-500 dark:text-neutral-400">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className="flex items-center justify-center">
                      {notes.includes(i + 1) ? i + 1 : ""}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        }),
      )}
    </div>
  );
}
