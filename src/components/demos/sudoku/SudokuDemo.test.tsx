import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SudokuDemo } from "./SudokuDemo";
import { puzzles } from "./puzzles";

/** The board renders row-major, so cell index maps directly to [row, col]. */
function cells() {
  return within(screen.getByRole("grid")).getAllByRole("gridcell");
}

function cellAt(row: number, col: number) {
  return cells()[row * 9 + col];
}

function renderDemo() {
  return render(<SudokuDemo resetToken={0} reducedMotion={false} />);
}

describe("SudokuDemo", () => {
  it("renders all 81 cells with the starting puzzle", () => {
    renderDemo();
    expect(cells()).toHaveLength(81);
    // The original board opens with a 7 at [0,0].
    expect(cellAt(0, 0)).toHaveTextContent("7");
  });

  it("labels each cell for screen readers", () => {
    renderDemo();
    expect(cellAt(0, 0)).toHaveAccessibleName("Row 1, column 1, 7, given");
    expect(cellAt(0, 2)).toHaveAccessibleName("Row 1, column 3, empty");
  });

  it("keeps one tab stop so the grid does not trap tabbing", () => {
    renderDemo();
    const stops = cells().filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
  });

  it("accepts a valid number in an empty cell", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("3"); // 3 and 5 are the only candidates at [0,2]

    expect(cellAt(0, 2)).toHaveTextContent("3");
  });

  it("counts a strike for a wrong guess instead of writing it", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("9"); // column 2 already holds a 9

    expect(cellAt(0, 2)).not.toHaveTextContent("9");
    expect(screen.getByText("Strikes").nextSibling).toHaveTextContent("1");
  });

  it("refuses to overwrite a given cell", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 0));
    await user.keyboard("4");

    expect(cellAt(0, 0)).toHaveTextContent("7");
  });

  it("moves the selection with arrow keys", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("{ArrowDown}");
    await user.keyboard("2"); // valid at [1,2]

    expect(cellAt(1, 2)).toHaveTextContent("2");
  });

  it("records a pencil mark with shift and clears it on entry", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("{Shift>}5{/Shift}");
    expect(cellAt(0, 2)).toHaveTextContent("5");

    await user.keyboard("3");
    // The pencil mark gives way to the entered value.
    expect(cellAt(0, 2)).toHaveTextContent("3");
    expect(cellAt(0, 2).textContent).toBe("3");
  });

  it("clears an entered value with Delete", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("3");
    await user.keyboard("{Delete}");

    expect(cellAt(0, 2).textContent).toBe("");
  });

  it("solves the board instantly and reports it", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(screen.getByRole("tab", { name: "Watch it solve" }));
    await user.click(screen.getByRole("button", { name: /instant/i }));

    expect(cellAt(0, 2)).toHaveTextContent("5"); // known solution value
    // "Solved" appears twice by design: once visibly, once in the live region.
    expect(screen.getAllByText(/Solved/)).toHaveLength(2);
  });

  it("advances one decision at a time when stepped", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(screen.getByRole("tab", { name: "Watch it solve" }));
    const stepButton = screen.getByRole("button", { name: /step/i });

    await user.click(stepButton); // starts and pauses the search
    await user.click(stepButton);

    const steps = Number(
      screen.getByText("Steps").nextSibling?.textContent?.replace(/,/g, ""),
    );
    expect(steps).toBeGreaterThan(0);
  });

  it("restores the starting board on reset", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(cellAt(0, 2));
    await user.keyboard("3");
    expect(cellAt(0, 2)).toHaveTextContent("3");

    await user.click(screen.getByRole("button", { name: /reset board/i }));
    expect(cellAt(0, 2).textContent).toBe("");
  });

  it("switches puzzles from the picker", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.selectOptions(
      screen.getByLabelText("Puzzle"),
      puzzles[2].id, // the hardest board opens with an 8 at [0,0]
    );

    expect(cellAt(0, 0)).toHaveTextContent("8");
  });
});
