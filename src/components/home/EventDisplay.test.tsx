import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { EventPanel } from "./EventPanel";

/**
 * The event display is the landing page's whole thesis: a real search running,
 * measured. A screenshot cannot prove a requestAnimationFrame loop advanced —
 * headless capture fires no frames at all — so the frames are driven by hand.
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
  return Number(
    screen.getByText(label).parentElement!.textContent!.replace(/\D/g, ""),
  );
}

beforeEach(() => stubMatchMedia(false));
afterEach(() => vi.restoreAllMocks());

describe("the event display", () => {
  it("advances the real solver across animation frames", async () => {
    const frames = captureFrames();
    render(<EventPanel playableCount={6} />);

    expect(readCount("Decisions")).toBe(0);
    await pump(frames, 10);

    expect(readCount("Decisions")).toBeGreaterThan(0);
  });

  it("charges backtracks as calorimeter energy", async () => {
    const frames = captureFrames();
    const { container } = render(<EventPanel playableCount={6} />);
    await pump(frames, 400);

    expect(readCount("Backtracks")).toBeGreaterThan(0);

    // Every lit wedge is a column the solver actually had to back out of.
    const lit = [...container.querySelectorAll("path")].filter((p) =>
      (p.getAttribute("fill") ?? "").includes("energy"),
    );
    expect(lit.length).toBeGreaterThan(0);
  });

  it("draws one track per filled cell", async () => {
    const frames = captureFrames();
    const { container } = render(<EventPanel playableCount={6} />);
    await pump(frames, 400);

    const tracks = [...container.querySelectorAll("path")].filter((p) =>
      /track|beam/.test(p.getAttribute("stroke") ?? ""),
    );
    // The board starts with 30 givens and fills toward 81.
    expect(tracks.length).toBeGreaterThan(30);
    expect(tracks.length).toBeLessThanOrEqual(81);
  });

  it("holds still until asked when the visitor prefers reduced motion", async () => {
    stubMatchMedia(true);
    const frames = captureFrames();
    render(<EventPanel playableCount={6} />);

    expect(frames).toHaveLength(0);
    expect(readCount("Decisions")).toBe(0);
    expect(
      screen.getByRole("button", { name: /start acquisition/i }),
    ).toBeInTheDocument();
  });

  it("starts when that visitor opts in", async () => {
    stubMatchMedia(true);
    const frames = captureFrames();
    render(<EventPanel playableCount={6} />);

    await act(async () => {
      screen.getByRole("button", { name: /start acquisition/i }).click();
    });
    await pump(frames, 10);

    expect(readCount("Decisions")).toBeGreaterThan(0);
  });

  it("reports how many projects actually run", () => {
    captureFrames();
    render(<EventPanel playableCount={6} />);

    expect(screen.getByText("6 projects")).toBeInTheDocument();
  });
});
