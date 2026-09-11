import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DIRECTIONS,
  FLOOR_COUNT,
  attack,
  generateFloor,
  makePlayer,
  makeRng,
  move,
  parseFloors,
  type Direction,
  type GameState,
  type RaceName,
} from "./engine";

let floors: string[][][];

beforeAll(() => {
  floors = parseFloors(
    readFileSync(join(process.cwd(), "public/data/cc3k/default.txt"), "utf8"),
  );
});

/** Breadth-first search for the next step toward a target. */
function stepToward(
  state: GameState,
  target: { x: number; y: number },
): Direction | null {
  const walkable = (x: number, y: number) => {
    const t = state.map[y]?.[x];
    return t === "." || t === "+" || t === "#";
  };

  const start = `${state.player.x},${state.player.y}`;
  const queue: [number, number][] = [[state.player.x, state.player.y]];
  const cameFrom = new Map<string, string>();
  const seen = new Set([start]);

  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === target.x && y === target.y) break;
    for (const dir of Object.keys(DIRECTIONS) as Direction[]) {
      const { dx, dy } = DIRECTIONS[dir];
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !walkable(nx, ny)) continue;
      seen.add(key);
      cameFrom.set(key, `${x},${y}`);
      queue.push([nx, ny]);
    }
  }

  // Walk the chain back to find the first step out of the start tile.
  let cursor = `${target.x},${target.y}`;
  if (!cameFrom.has(cursor) && cursor !== start) return null;
  while (cameFrom.get(cursor) && cameFrom.get(cursor) !== start) {
    cursor = cameFrom.get(cursor)!;
  }
  const [nx, ny] = cursor.split(",").map(Number);
  const dx = nx - state.player.x;
  const dy = ny - state.player.y;
  return (
    (Object.keys(DIRECTIONS) as Direction[]).find(
      (d) => DIRECTIONS[d].dx === dx && DIRECTIONS[d].dy === dy,
    ) ?? null
  );
}

/**
 * Plays a run properly: pathfind to the staircase, fighting whatever stands in
 * the way. This is what answers the question the rule tests cannot — whether a
 * real run is completable, rather than whether each rule fires correctly.
 */
function playRun(seed: number, race: RaceName) {
  const rng = makeRng(seed);
  const player = makePlayer(race);
  let state: GameState = generateFloor(floors[0], player, 1, rng);
  let floorsCleared = 0;

  for (let turn = 0; turn < 4000; turn++) {
    if (state.status !== "playing") break;

    const routed = stepToward(state, state.stairs);
    // Fall back to a sweep if the route is blocked this turn by an enemy.
    const preferred = routed
      ? [routed, ...(Object.keys(DIRECTIONS) as Direction[])]
      : (Object.keys(DIRECTIONS) as Direction[]);

    let acted = false;
    for (const dir of preferred) {
      const { dx: mx, dy: my } = DIRECTIONS[dir];
      const nx = state.player.x + mx;
      const ny = state.player.y + my;
      const tile = state.map[ny]?.[nx];
      if (!tile || !(tile === "." || tile === "+" || tile === "#")) continue;

      const blocker = state.enemies.find((e) => e.x === nx && e.y === ny);
      if (blocker) {
        // Never pick a fight with a peaceful merchant; it ends badly.
        if (blocker.race === "merchant" && !state.merchantsHostile) continue;
        attack(state, dir, rng);
        acted = true;
        break;
      }

      const before = state.floor;
      const result = move(state, dir, rng);
      if (result.descended) {
        floorsCleared++;
        if (before >= FLOOR_COUNT) {
          state.status = "won";
        } else {
          const next = floors[before].map((row) => [...row]);
          state = generateFloor(next, { ...state.player }, before + 1, rng);
        }
      }
      acted = true;
      break;
    }

    // Boxed in: shove in a fixed direction rather than stalling forever.
    if (!acted) move(state, "ea", rng);
  }

  return { status: state.status, floorsCleared, gold: state.player.gold };
}

describe("a real run", () => {
  /**
   * The point of this file: the rule tests prove the mechanics, but only
   * playing proves the game is a game. If no seed ever reaches the stairs, the
   * floor generation or the AI is broken in a way no unit test would show.
   */
  it("can reach the staircase", () => {
    let reached = 0;
    for (let seed = 1; seed <= 60; seed++) {
      if (playRun(seed, "Troll").floorsCleared > 0) reached++;
    }
    expect(reached).toBeGreaterThan(0);
  });

  it("is survivable often enough to be worth playing", () => {
    let survived = 0;
    const runs = 60;
    for (let seed = 1; seed <= runs; seed++) {
      const result = playRun(seed, "Troll");
      if (result.status !== "dead") survived++;
    }
    // A greedy bot dying every single time would mean the floor is a death trap.
    expect(survived).toBeGreaterThan(0);
  });

  it("is beatable — a run can clear all five floors", () => {
    let won = 0;
    for (let seed = 1; seed <= 40 && won === 0; seed++) {
      for (const race of ["Troll", "Vampire", "Shade"] as RaceName[]) {
        if (playRun(seed, race).status === "won") {
          won++;
          break;
        }
      }
    }
    expect(won).toBeGreaterThan(0);
  });

  it("descends past the first floor", () => {
    const deepest = Math.max(
      ...[...Array(20)].map((_, i) => playRun(i + 1, "Troll").floorsCleared),
    );
    expect(deepest).toBeGreaterThan(1);
  });

  it("accumulates gold along the way", () => {
    const totals = [1, 2, 3, 4, 5].map((s) => playRun(s, "Shade").gold);
    expect(Math.max(...totals)).toBeGreaterThan(0);
  });

  it("never ends in a corrupt state", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const result = playRun(seed, "Goblin");
      expect(["playing", "dead", "won"]).toContain(result.status);
      expect(result.gold).toBeGreaterThanOrEqual(0);
      expect(result.floorsCleared).toBeLessThanOrEqual(FLOOR_COUNT);
    }
  });
});
