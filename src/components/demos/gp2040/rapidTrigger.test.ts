import { describe, it, expect } from "vitest";
import { STANDARD, initialState, run, step, type TriggerConfig } from "./rapidTrigger";

const plain: TriggerConfig = { ...STANDARD, rapidTrigger: false };

/** Presses from rest to `depth`, one unit per tick. */
function press(depth: number): number[] {
  return Array.from({ length: depth + 1 }, (_, i) => i);
}

describe("plain threshold actuation", () => {
  it("fires once travel passes actuation plus hysteresis", () => {
    const ticks = run(press(60), plain);
    const fired = ticks.findIndex((t) => t.state.active);
    expect(ticks[fired].travel).toBeGreaterThanOrEqual(plain.actuation + plain.noise);
  });

  /** A switch resting exactly on the actuation point must not chatter. */
  it("does not chatter on the actuation point", () => {
    let state = initialState(0);
    // Settle above the threshold first.
    for (const t of press(50)) state = step(state, t, plain);
    expect(state.active).toBe(true);

    // Now jitter by less than the hysteresis band.
    let flips = 0;
    let previous = state.active;
    for (const t of [40, 41, 39, 40, 41, 39, 40]) {
      state = step(state, t, plain);
      if (state.active !== previous) flips++;
      previous = state.active;
    }
    expect(flips).toBe(0);
  });
});

describe("rapid trigger", () => {
  it("stays released under light resting pressure near the top", () => {
    const ticks = run([5, 9, 12, 15, 12, 9, 11], STANDARD);
    expect(ticks.every((t) => !t.state.active)).toBe(true);
  });

  it("arms and fires when the switch crosses actuation", () => {
    const ticks = run(press(60), STANDARD);
    expect(ticks.at(-1)!.state.active).toBe(true);
    expect(ticks.at(-1)!.state.armed).toBe(true);
  });

  /**
   * The point of rapid trigger: a partial release then a partial press
   * re-fires, without returning to rest.
   */
  it("re-fires on a partial release and re-press", () => {
    const trace = [
      ...press(60), // press and fire
      ...[48, 44, 40], // release past the release sensitivity
      ...[44, 50, 56], // press again, still far from rest
    ];
    const ticks = run(trace, STANDARD);

    const states = ticks.map((t) => t.state.active);
    // Fired, released, fired again.
    expect(states.includes(true)).toBe(true);
    const firstFire = states.indexOf(true);
    const release = states.indexOf(false, firstFire);
    expect(release).toBeGreaterThan(firstFire);
    expect(states.indexOf(true, release)).toBeGreaterThan(release);
  });

  it("releases at the deadzone whatever the state", () => {
    const ticks = run([...press(60), 30, 10, 4], STANDARD);
    const last = ticks.at(-1)!.state;
    expect(last.active).toBe(false);
    expect(last.armed).toBe(false);
  });

  /**
   * The noise gap below the actuation point. Without it, a finger hovering
   * there makes sensor noise disarm and rearm repeatedly, which reads as the
   * button flickering.
   */
  it("does not flicker when resting near the actuation point", () => {
    let state = initialState(0);
    for (const t of press(60)) state = step(state, t, STANDARD);

    // Hover within the noise band around actuation.
    const hover = [41, 39, 40, 38, 41, 39, 40];
    let disarms = 0;
    for (const t of hover) {
      const next = step(state, t, STANDARD);
      if (state.armed && !next.armed) disarms++;
      state = next;
    }
    expect(disarms).toBe(0);
  });

  /**
   * Clamping the opposite extremum rather than resetting it. A slow, noisy
   * press has many tiny reversals; resetting outright would keep pushing the
   * trough up so the press never accumulates enough travel to fire.
   */
  it("still fires through a slow, noisy press", () => {
    const noisy: number[] = [];
    for (let t = 0; t <= 70; t += 2) {
      noisy.push(t, t - 1); // forward, tiny reversal
    }
    const ticks = run(noisy, STANDARD);
    expect(ticks.some((t) => t.state.active)).toBe(true);
  });

  it("keeps the zone live to the deadzone in continuous mode", () => {
    const cfg = { ...STANDARD, continuous: true };
    let state = initialState(0);
    for (const t of press(60)) state = step(state, t, cfg);

    // Drop below actuation but stay above the deadzone.
    state = step(state, 20, cfg);
    expect(state.armed).toBe(true);
  });
});
