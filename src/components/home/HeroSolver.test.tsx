import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSolver } from "./HeroSolver";

// jsdom has no matchMedia; pin the default, where motion is allowed.
vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => false }));

describe("the hero solver", () => {
  /** It loops forever, so it must be stoppable (WCAG 2.2.2 Pause, Stop, Hide). */
  it("can be paused and resumed", async () => {
    const user = userEvent.setup();
    render(<HeroSolver href="/projects/sudoku" />);

    await user.click(screen.getByRole("button", { name: "Pause" }));
    const resume = screen.getByRole("button", { name: /Resume|Run it/ });
    await user.click(resume);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  /** The board is the way into the demo, not decoration. */
  it("opens the full demo from the board", () => {
    render(<HeroSolver href="/projects/sudoku" />);
    const board = screen.getByRole("link", { name: /Open the Sudoku demo/ });
    expect(board).toHaveAttribute("href", "/projects/sudoku");
  });

  /**
   * A label that included the live decision count would be re-read on every
   * frame by a screen reader, so it must not mention the counter.
   */
  it("keeps a label that does not change as the solver runs", () => {
    render(<HeroSolver href="/projects/sudoku" />);
    const label = screen.getByRole("link", { name: /Open the Sudoku demo/ });
    expect(label.getAttribute("aria-label")).not.toMatch(/\d/);
  });
});
