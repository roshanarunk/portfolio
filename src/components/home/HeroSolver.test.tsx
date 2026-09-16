import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HeroSolver } from "./HeroSolver";

/**
 * Attract mode is the landing page's whole thesis: the machine is running
 * before the visitor touches anything. A screenshot cannot prove a
 * requestAnimationFrame loop advanced — headless capture reports zero frames —
 * so the frames are driven by hand here instead.
 */

/** jsdom ships no matchMedia, and the component asks it about reduced motion. */
function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduced : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

/** Collects rAF callbacks so a test can step the loop deterministically. */
function captureFrames() {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return frames;
}

async function pump(frames: FrameRequestCallback[], count: number) {
  for (let i = 0; i < count && frames.length; i++) {
    const next = frames.shift()!;
    await act(async () => {
      next(performance.now());
    });
  }
}

function readCount(label: string): number {
  const row = screen.getByText(label).parentElement!;
  return Number(row.textContent!.replace(/\D/g, ""));
}

beforeEach(() => stubMatchMedia(false));
afterEach(() => vi.restoreAllMocks());

describe("HeroSolver", () => {
  it("advances the real solver across animation frames", async () => {
    const frames = captureFrames();
    render(<HeroSolver />);

    expect(readCount("Decisions")).toBe(0);
    await pump(frames, 5);

    // Each frame runs many generator steps, so a few frames is plenty.
    expect(readCount("Decisions")).toBeGreaterThan(0);
  });

  it("counts backtracks, which is what makes this board expensive", async () => {
    const frames = captureFrames();
    render(<HeroSolver />);
    await pump(frames, 40);

    expect(readCount("Backtracks")).toBeGreaterThan(0);
  });

  it("holds still until asked when the visitor prefers reduced motion", async () => {
    stubMatchMedia(true);
    const frames = captureFrames();
    render(<HeroSolver />);

    // No loop is scheduled at all, so there is nothing to pump.
    expect(frames).toHaveLength(0);
    expect(readCount("Decisions")).toBe(0);
    expect(screen.getByRole("button", { name: /run it/i })).toBeInTheDocument();
  });

  it("starts when that visitor opts in", async () => {
    stubMatchMedia(true);
    const frames = captureFrames();
    const { rerender } = render(<HeroSolver />);

    await act(async () => {
      screen.getByRole("button", { name: /run it/i }).click();
    });
    rerender(<HeroSolver />);
    await pump(frames, 5);

    expect(readCount("Decisions")).toBeGreaterThan(0);
  });
});
