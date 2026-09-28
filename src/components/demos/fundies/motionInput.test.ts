import { describe, it, expect } from "vitest";
import {
  type Command,
  initialMotion,
  recognize,
  relative,
  sample,
  direction,
} from "./motionInput";

/**
 * These vectors are copied from Fundies' own `MotionHealthTests.cs`, so the
 * port is checked against the original's expectations rather than mine. The
 * helper mirrors the C# `Recognized`: each "d:f" run holds relative direction d
 * for f frames, then recognition runs with no button press.
 */
function recognized(sequence: string, facing: 1 | -1 = 1): Command {
  let m = initialMotion();
  for (const run of sequence.split(" ")) {
    const [d, f] = run.split(":");
    const abs = relative(Number(d), facing);
    for (let i = 0; i < (f ? Number(f) : 1); i++) {
      m = sample(m, abs, false, facing);
    }
  }
  return recognize(m, facing);
}

describe.each([1, -1] as const)("motion recognition, facing %i", (facing) => {
  it("236 is a fireball", () => {
    expect(recognized("2 3 6", facing)).toBe("fireball");
  });

  it("214 is a donkey kick", () => {
    expect(recognized("2 1 4", facing)).toBe("donkey");
  });

  it.each(["6 2 3", "6 2 6", "3 2 3", "6 3 6", "6 2 3 6"])(
    "%s is a DP (leniency)",
    (dp) => {
      expect(recognized(dp, facing)).toBe("dp");
    },
  );

  it("tolerates intervening directions", () => {
    expect(recognized("2 4 3 5 6", facing)).toBe("fireball");
  });

  it("requires a strict initial down for a quarter circle", () => {
    expect(recognized("1 3 6", facing)).toBe("none");
  });

  it("rejects a quarter circle missing its diagonal", () => {
    expect(recognized("2 6", facing)).toBe("none");
  });

  it("does not let a held diagonal satisfy three DP steps", () => {
    expect(recognized("3:20", facing)).toBe("none");
  });

  it("accepts an eleven-frame quarter-circle segment", () => {
    expect(recognized("2 3:11 6:11", facing)).toBe("fireball");
  });

  it("rejects a twelve-frame middle segment", () => {
    expect(recognized("2 3:12 6", facing)).toBe("none");
  });

  it("rejects a button pressed too late after the motion", () => {
    expect(recognized("2 3 6:12", facing)).toBe("none");
  });

  it("accepts a seven-frame DP segment", () => {
    expect(recognized("6 2:7 3:7", facing)).toBe("dp");
  });

  it("rejects an eight-frame DP middle segment", () => {
    expect(recognized("6 2:8 3", facing)).toBe("none");
  });

  it("finds an older valid diagonal by exhaustive matching", () => {
    expect(recognized("2 5:6 3 5:6 3 6:10", facing)).toBe("fireball");
  });

  it("gives a walking fireball priority over DP (half-circle correction)", () => {
    expect(recognized("6 4 1 2 3 6", facing)).toBe("fireball");
  });
});

describe("history and facing", () => {
  it("cancels opposite directions to neutral on both axes", () => {
    // Left+right and up+down both cancel, so the stick reads neutral.
    expect(direction(0, 0)).toBe(5);
  });

  /**
   * History is absolute and mirrored at match time. A 236 entered facing right
   * reads as 214 once the fighter has turned around.
   */
  it("mirrors absolute history when facing reverses", () => {
    let m = initialMotion();
    for (const d of [2, 3, 6]) m = sample(m, d, false, 1);
    expect(recognize(m, -1)).toBe("donkey");
  });

  it("buffers a press for five frames, then drops it", () => {
    let m = initialMotion();
    for (const d of [2, 3]) m = sample(m, d, false, 1);
    m = sample(m, 6, true, 1);
    expect(m.pending).toBe("fireball");
    for (let i = 0; i < 4; i++) m = sample(m, 6, false, 1);
    expect(m.pending).toBe("fireball");
    m = sample(m, 6, false, 1);
    expect(m.pending).toBe("none");
  });

  it("falls back to a normal when no motion matches", () => {
    let m = sample(initialMotion(), 2, true, 1);
    expect(m.pending).toBe("low");
    m = sample(initialMotion(), 5, true, 1);
    expect(m.pending).toBe("stand");
  });

  it("recognises a forward dash from tap, neutral, tap", () => {
    let m = initialMotion();
    m = sample(m, 6, false, 1);
    m = sample(m, 5, false, 1);
    m = sample(m, 6, false, 1);
    expect(m.dashDirection).toBe(1);
  });

  it("does not read a held direction as a dash", () => {
    let m = initialMotion();
    for (let i = 0; i < 12; i++) m = sample(m, 6, false, 1);
    expect(m.dashDirection).toBe(0);
  });
});
