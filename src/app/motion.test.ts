import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The entrance animation cannot be verified by screenshot: headless Chrome
 * disables CSS animations entirely, so a capture shows the finished state and
 * `document.getAnimations()` returns nothing. These assertions check the rules
 * themselves, which is the part that can actually be wrong.
 */

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** The reduced-motion block that overrides a given animation name. */
function reducedBlockFor(animation: string): string {
  const blocks = [...css.matchAll(/@media \(prefers-reduced-motion[^{]*\{/g)];
  for (const m of blocks) {
    // Take a generous slice; these blocks are short.
    const slice = css.slice(m.index!, m.index! + 900);
    if (slice.includes(`@keyframes ${animation}`)) return slice;
  }
  return "";
}

describe("the page entrance animation", () => {
  it("defines a rise keyframe that starts low and faded", () => {
    expect(css).toMatch(/@keyframes rise\s*\{/);
    expect(css).toMatch(/opacity:\s*0/);
    expect(css).toMatch(/translateY\(18px\)/);
  });

  it("finishes at full opacity and no offset, so content is not left hidden", () => {
    const block = css.slice(
      css.indexOf("@keyframes rise"),
      css.indexOf("@keyframes rise") + 260,
    );
    expect(block).toMatch(/opacity:\s*1/);
    expect(block).toMatch(/translateY\(0\)/);
  });

  /**
   * `both` holds the from-state through the delay. Without it a staggered
   * section flashes visible, hides, then animates — which reads as a bug.
   */
  it("uses both fill mode so delayed sections do not flash first", () => {
    expect(css).toMatch(/\.rise\s*\{[^}]*animation:\s*rise[^;]*both/);
  });

  it("staggers in increasing steps, so the page resolves top to bottom", () => {
    const delays = [
      ...css.matchAll(/\.rise-(\d)\s*\{\s*animation-delay:\s*(\d+)ms/g),
    ].map((m) => [Number(m[1]), Number(m[2])] as const);

    expect(delays.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i][1], `rise-${delays[i][0]}`).toBeGreaterThan(delays[i - 1][1]);
    }
  });

  it("offsets far enough to be visible", () => {
    // 6px was too subtle to read as motion at all.
    const offset = css.match(/translateY\((\d+)px\)/);
    expect(Number(offset?.[1])).toBeGreaterThanOrEqual(12);
  });

  it("replays on route change", () => {
    expect(css).toMatch(/\.route-enter\s*\{[^}]*animation:\s*rise/);
  });

  /**
   * Reduced motion is about vestibular discomfort from movement, not about
   * animation as such. Removing every animation was over-correction: it left
   * those visitors with a page that snapped into place while every other site
   * they visit still fades. The contract is that the translate goes and the
   * fade stays.
   */
  it("drops movement but keeps a fade under prefers-reduced-motion", () => {
    const reduced = reducedBlockFor("rise");

    // The override redefines the keyframe without a transform.
    expect(reduced).toMatch(/@keyframes rise\s*\{/);
    expect(reduced).not.toMatch(/translateY/);

    // And it still animates opacity rather than switching animation off.
    expect(reduced).toMatch(/opacity:\s*0/);
    expect(reduced).toMatch(/opacity:\s*1/);
    expect(reduced).not.toMatch(/animation:\s*none/);
  });

  it("still animates the entrance and route change when motion is reduced", () => {
    const reduced = reducedBlockFor("rise");
    expect(reduced).toMatch(/\.rise,\s*\.route-enter\s*\{[^}]*animation-duration/);
  });
});

describe("the filter swap animation", () => {
  it("brings a card forward from behind the one it replaces", () => {
    expect(css).toMatch(/@keyframes swap-in\s*\{/);
    // Starting smaller and lower reads as arriving from depth.
    expect(css).toMatch(/scale\(0\.88\)\s*translateY\(10px\)/);
    expect(css).toMatch(/scale\(1\)\s*translateY\(0\)/);
  });

  it("staggers the row so it resolves left to right", () => {
    const delays = [
      ...css.matchAll(/\.swap-(\d)\s*\{\s*animation-delay:\s*(\d+)ms/g),
    ].map((m) => Number(m[2]));

    expect(delays.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });

  /** A card scaling toward the viewer is exactly what the preference is about. */
  it("drops the scale under reduced motion but keeps the fade", () => {
    const reduced = reducedBlockFor("swap-in");

    expect(reduced).toMatch(/@keyframes swap-in\s*\{/);
    expect(reduced).not.toMatch(/scale\(/);
    expect(reduced).toMatch(/opacity:\s*0/);
    expect(reduced).not.toMatch(/animation:\s*none/);
  });
});
