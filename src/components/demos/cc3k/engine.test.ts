import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENEMY_SPECS,
  FLOOR_COUNT,
  GOLD_VALUE,
  HEIGHT,
  RACES,
  WIDTH,
  attack,
  damage,
  generateFloor,
  makePlayer,
  makeRng,
  move,
  parseFloors,
  use,
  type Direction,
  type GameState,
} from "./engine";

const MAP_TEXT = readFileSync(
  join(process.cwd(), "public/data/cc3k/default.txt"),
  "utf8",
);

let floors: string[][][];

beforeAll(() => {
  floors = parseFloors(MAP_TEXT);
});

/** A freshly generated floor with a deterministic seed. */
function newGame(seed = 42, race: "Shade" | "Drow" | "Vampire" | "Troll" | "Goblin" = "Shade") {
  const rng = makeRng(seed);
  const player = makePlayer(race);
  const state = generateFloor(floors[0], player, 1, rng);
  return { state, rng };
}

describe("the map file", () => {
  it("holds five floors of 79x25", () => {
    expect(floors).toHaveLength(FLOOR_COUNT);
    for (const floor of floors) {
      expect(floor).toHaveLength(HEIGHT);
      for (const row of floor) expect(row).toHaveLength(WIDTH);
    }
  });

  it("uses only the characters the original draws", () => {
    const seen = new Set(floors.flat(2));
    for (const ch of seen) expect(" #+-.|").toContain(ch);
  });

  it("gives every floor open ground to walk on", () => {
    for (const floor of floors) {
      const open = floor.flat().filter((c) => c === ".").length;
      expect(open).toBeGreaterThan(100);
    }
  });
});

describe("damage", () => {
  /** ceil(100 / (100 + def) * atk), straight from the C++. */
  it("matches the formula from the original", () => {
    expect(damage(25, 20)).toBe(21);
    expect(damage(30, 30)).toBe(24);
    expect(damage(100, 0)).toBe(100);
  });

  it("always lands for at least one point", () => {
    expect(damage(1, 10000)).toBe(1);
  });
});

describe("floor generation", () => {
  it("places the player and the stairs on open ground", () => {
    const { state } = newGame();
    expect(state.map[state.player.y][state.player.x]).toBe(".");
    expect(state.map[state.stairs.y][state.stairs.x]).toBe(".");
  });

  it("never starts the player on the staircase", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { state } = newGame(seed);
      const samePlace =
        state.player.x === state.stairs.x && state.player.y === state.stairs.y;
      expect(samePlace, `seed ${seed}`).toBe(false);
    }
  });

  it("spawns roughly the original's counts", () => {
    const { state } = newGame();
    // Placement is skipped when a chamber roll lands on an occupied tile, so
    // the counts are close to but not always exactly 10/10/20.
    expect(state.items.filter((i) => i.kind === "potion").length).toBeGreaterThan(5);
    expect(state.items.filter((i) => i.kind === "gold").length).toBeGreaterThan(5);
    expect(state.enemies.length).toBeGreaterThan(12);
    expect(state.enemies.length).toBeLessThanOrEqual(30);
  });

  it("puts everything it spawns on open ground", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { state } = newGame(seed);
      for (const e of state.enemies) {
        expect(state.map[e.y][e.x], `enemy seed ${seed}`).toBe(".");
      }
      for (const i of state.items) {
        expect(state.map[i.y][i.x], `item seed ${seed}`).toBe(".");
      }
    }
  });

  it("never stacks two enemies on one tile", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { state } = newGame(seed);
      const seen = new Set(state.enemies.map((e) => `${e.x},${e.y}`));
      expect(seen.size, `seed ${seed}`).toBe(state.enemies.length);
    }
  });

  it("gives each dragon hoard a dragon standing beside it", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { state } = newGame(seed);
      for (const hoard of state.items.filter((i) => i.gold === "dragon")) {
        if (hoard.dragonId === undefined) continue;
        const dragon = state.enemies.find((e) => e.id === hoard.dragonId)!;
        expect(dragon, `seed ${seed}`).toBeDefined();
        expect(Math.abs(dragon.x - hoard.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(dragon.y - hoard.y)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("replays identically for the same seed", () => {
    const a = newGame(7).state;
    const b = newGame(7).state;
    expect(a.player).toEqual(b.player);
    expect(a.enemies).toEqual(b.enemies);
    expect(a.items).toEqual(b.items);
  });
});

describe("movement", () => {
  /** Finds a direction the player can legally step in. */
  function openDirection(state: GameState): Direction {
    const order: Direction[] = ["ea", "we", "no", "so", "ne", "nw", "se", "sw"];
    for (const d of order) {
      const { dx, dy } = { ea: { dx: 1, dy: 0 }, we: { dx: -1, dy: 0 }, no: { dx: 0, dy: -1 }, so: { dx: 0, dy: 1 }, ne: { dx: 1, dy: -1 }, nw: { dx: -1, dy: -1 }, se: { dx: 1, dy: 1 }, sw: { dx: -1, dy: 1 } }[d];
      const nx = state.player.x + dx;
      const ny = state.player.y + dy;
      if (state.map[ny]?.[nx] !== ".") continue;
      if (state.enemies.some((e) => e.x === nx && e.y === ny)) continue;
      if (state.stairs.x === nx && state.stairs.y === ny) continue;
      return d;
    }
    return "ea";
  }

  it("moves the player onto open ground", () => {
    const { state, rng } = newGame(3);
    const dir = openDirection(state);
    const before = { x: state.player.x, y: state.player.y };
    move(state, dir, rng);
    expect({ x: state.player.x, y: state.player.y }).not.toEqual(before);
  });

  it("refuses to walk into a wall", () => {
    const { state, rng } = newGame();
    // Drop the player beside a known wall and try to walk into it.
    state.player.x = 1;
    state.player.y = 1;
    const before = { ...state.player };
    move(state, "nw", rng);
    expect(state.player.x).toBe(before.x);
    expect(state.player.y).toBe(before.y);
  });

  it("keeps the player inside the map", () => {
    const { state, rng } = newGame(11);
    for (let i = 0; i < 300; i++) {
      const dirs: Direction[] = ["no", "so", "ea", "we", "ne", "nw", "se", "sw"];
      move(state, dirs[i % dirs.length], rng);
      expect(state.player.x).toBeGreaterThanOrEqual(0);
      expect(state.player.x).toBeLessThan(WIDTH);
      expect(state.player.y).toBeGreaterThanOrEqual(0);
      expect(state.player.y).toBeLessThan(HEIGHT);
      if (state.status !== "playing") break;
    }
  });

  it("reports descending when it reaches the staircase", () => {
    const { state, rng } = newGame(5);
    // Stand next to the stairs and step on.
    state.player.x = state.stairs.x - 1;
    state.player.y = state.stairs.y;
    state.enemies = [];
    const result = move(state, "ea", rng);
    expect(result.descended).toBe(true);
  });

  it("collects gold it steps on", () => {
    const { state, rng } = newGame(9);
    state.enemies = [];
    const gold = state.items.find(
      (i) => i.kind === "gold" && i.gold === "small",
    )!;
    state.player.x = gold.x - 1;
    state.player.y = gold.y;
    state.map[gold.y][gold.x - 1] = ".";

    const before = state.player.gold;
    move(state, "ea", rng);
    expect(state.player.gold).toBeGreaterThan(before);
    expect(state.items).not.toContain(gold);
  });

  it("leaves a guarded dragon hoard alone", () => {
    const { state, rng } = newGame(13);
    const hoard = state.items.find(
      (i) => i.gold === "dragon" && i.dragonId !== undefined,
    );
    if (!hoard) return; // not every seed rolls a hoard

    state.player.x = hoard.x - 1;
    state.player.y = hoard.y;
    state.map[hoard.y][hoard.x - 1] = ".";
    const before = state.player.gold;

    move(state, "ea", rng);
    expect(state.player.gold).toBe(before);
    expect(state.items).toContain(hoard);
  });
});

describe("combat", () => {
  /** Drops one enemy of the given race directly east of the player. */
  function placeEnemy(state: GameState, race: keyof typeof ENEMY_SPECS) {
    const spec = ENEMY_SPECS[race];
    const x = state.player.x + 1;
    const y = state.player.y;
    state.map[y][x] = ".";
    state.enemies = [
      { id: 99, race: spec.race, hp: spec.maxHP, maxHP: spec.maxHP, atk: spec.atk, def: spec.def, x, y },
    ];
    return state.enemies[0];
  }

  it("damages an adjacent enemy by the formula", () => {
    const { state, rng } = newGame();
    const enemy = placeEnemy(state, "orc");
    const expected = damage(state.player.atk, enemy.def);
    attack(state, "ea", rng);
    expect(enemy.maxHP - enemy.hp).toBe(expected);
  });

  it("does nothing but pass the turn when swinging at air", () => {
    const { state, rng } = newGame();
    state.enemies = [];
    const before = state.turn;
    attack(state, "we", rng);
    expect(state.log.at(-1) ?? "").toMatch(/hits nothing/i);
    expect(state.turn).toBeGreaterThan(before);
  });

  it("removes an enemy it kills and pays out gold", () => {
    const { state, rng } = newGame();
    // Deliberately not a halfling: those dodge half of what is thrown at them,
    // so a kill would not reliably land.
    const enemy = placeEnemy(state, "orc");
    enemy.hp = 1;
    const before = state.player.gold;
    attack(state, "ea", rng);
    expect(state.enemies).toHaveLength(0);
    expect(state.player.gold).toBeGreaterThan(before);
  });

  it("drops a merchant hoard when a merchant dies", () => {
    const { state, rng } = newGame();
    const enemy = placeEnemy(state, "merchant");
    enemy.hp = 1;
    attack(state, "ea", rng);
    const hoard = state.items.find(
      (i) => i.gold === "merchant" && i.x === enemy.x && i.y === enemy.y,
    );
    expect(hoard).toBeDefined();
    expect(GOLD_VALUE.merchant).toBe(4);
  });

  it("turns every merchant hostile once one is attacked", () => {
    const { state, rng } = newGame();
    placeEnemy(state, "merchant");
    expect(state.merchantsHostile).toBe(false);
    attack(state, "ea", rng);
    expect(state.merchantsHostile).toBe(true);
  });

  it("pays the Goblin its five gold per kill", () => {
    const { state, rng } = newGame(4, "Goblin");
    const enemy = placeEnemy(state, "elf");
    enemy.hp = 1;
    const before = state.player.gold;
    attack(state, "ea", rng);
    // Five from the racial rule, plus the ordinary 1-2 drop.
    expect(state.player.gold - before).toBeGreaterThanOrEqual(6);
  });

  /**
   * The drain is +1 against anything but a dwarf, and -5 against one. Both are
   * dwarfed by the counter-attack on the enemy turn, so this measures the swing
   * with retaliation removed rather than trying to read it off the raw HP.
   */
  it("drains health to the Vampire, except against dwarves", () => {
    const swing = (race: "orc" | "dwarf") => {
      const { state, rng } = newGame(6, "Vampire");
      const enemy = placeEnemy(state, race);
      // Enough HP that the kill lands first and no enemy turn follows.
      enemy.hp = 1;
      const before = state.player.hp;
      attack(state, "ea", rng);
      return state.player.hp - before;
    };

    expect(swing("orc")).toBe(1);
    expect(swing("dwarf")).toBe(-5);
  });

  it("never leaves HP below zero", () => {
    const { state, rng } = newGame(15);
    for (let i = 0; i < 200 && state.status === "playing"; i++) {
      attack(state, "ea", rng);
      expect(state.player.hp).toBeGreaterThanOrEqual(0);
      for (const e of state.enemies) expect(e.hp).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("potions", () => {
  function placePotion(state: GameState, potion: "RH" | "BA" | "PH") {
    const x = state.player.x + 1;
    const y = state.player.y;
    state.map[y][x] = ".";
    state.enemies = [];
    state.items = [{ x, y, kind: "potion", potion }];
  }

  it("restores health, capped at the maximum", () => {
    const { state, rng } = newGame();
    state.player.hp = state.player.maxHP - 4;
    placePotion(state, "RH");
    use(state, "ea", rng);
    expect(state.player.hp).toBe(state.player.maxHP);
  });

  it("boosts attack", () => {
    const { state, rng } = newGame();
    const before = state.player.atk;
    placePotion(state, "BA");
    use(state, "ea", rng);
    expect(state.player.atk).toBe(before + 5);
  });

  it("gives the Drow one and a half times the effect", () => {
    const { state, rng } = newGame(2, "Drow");
    const before = state.player.atk;
    placePotion(state, "BA");
    use(state, "ea", rng);
    expect(state.player.atk).toBe(before + 7); // floor(5 * 1.5)
  });

  it("can be fatal", () => {
    const { state, rng } = newGame();
    state.player.hp = 3;
    placePotion(state, "PH");
    use(state, "ea", rng);
    expect(state.player.hp).toBe(0);
    expect(state.status).toBe("dead");
  });

  it("says so when there is no potion", () => {
    const { state, rng } = newGame();
    state.items = [];
    state.enemies = [];
    use(state, "ea", rng);
    expect(state.log.at(-1) ?? "").toMatch(/no potion/i);
  });
});

describe("enemy behaviour", () => {
  it("leaves merchants peaceful until provoked", () => {
    const { state, rng } = newGame();
    const x = state.player.x + 1;
    const y = state.player.y;
    state.map[y][x] = ".";
    state.enemies = [
      { id: 1, race: "merchant", hp: 30, maxHP: 30, atk: 70, def: 5, x, y },
    ];
    const before = state.player.hp;
    // Pass several turns beside it; an unprovoked merchant never strikes.
    for (let i = 0; i < 10; i++) use(state, "we", rng);
    expect(state.player.hp).toBe(before);
  });

  it("keeps dragons beside their hoard", () => {
    const { state, rng } = newGame(21);
    const dragon = state.enemies.find((e) => e.guards);
    if (!dragon) return;
    const start = { x: dragon.x, y: dragon.y };
    // Move the player far away so the dragon has no reason to strike.
    state.player.x = 1;
    state.player.y = 1;
    for (let i = 0; i < 20; i++) use(state, "ea", rng);
    expect({ x: dragon.x, y: dragon.y }).toEqual(start);
  });

  it("holds every enemy still while frozen", () => {
    const { state, rng } = newGame(17);
    state.enemiesFrozen = true;
    state.player.x = 1;
    state.player.y = 1;
    const before = state.enemies.map((e) => `${e.x},${e.y}`);
    for (let i = 0; i < 10; i++) use(state, "ea", rng);
    expect(state.enemies.map((e) => `${e.x},${e.y}`)).toEqual(before);
  });

  it("keeps enemies on walkable ground as they wander", () => {
    const { state, rng } = newGame(23);
    state.player.x = 1;
    state.player.y = 1;
    for (let i = 0; i < 40; i++) {
      use(state, "ea", rng);
      for (const e of state.enemies) {
        expect(state.map[e.y][e.x], `${e.race} left the floor`).toBe(".");
      }
    }
  });

  it("regenerates the Troll each turn", () => {
    const { state, rng } = newGame(8, "Troll");
    state.enemies = [];
    state.player.hp = 50;
    use(state, "ea", rng); // spends a turn
    expect(state.player.hp).toBe(55);
  });
});

describe("races", () => {
  it("lists the five playable races", () => {
    expect(RACES.map((r) => r.name)).toEqual([
      "Shade",
      "Drow",
      "Vampire",
      "Troll",
      "Goblin",
    ]);
  });

  it("starts the Vampire at 50 with no practical cap", () => {
    const vampire = makePlayer("Vampire");
    expect(vampire.hp).toBe(50);
    expect(vampire.maxHP).toBeGreaterThan(1000);
  });

  it("gives the Shade half again as much gold", () => {
    const { state, rng } = newGame(31, "Shade");
    state.enemies = [];
    const gold = state.items.find((i) => i.gold === "normal");
    if (!gold) return;
    state.player.x = gold.x - 1;
    state.player.y = gold.y;
    state.map[gold.y][gold.x - 1] = ".";
    move(state, "ea", rng);
    expect(state.player.gold).toBe(Math.floor(GOLD_VALUE.normal * 1.5));
  });
});

describe("a full run", () => {
  it("survives a long random walk without corrupting state", () => {
    const rng = makeRng(99);
    const player = makePlayer("Troll");
    const state = generateFloor(floors[0], player, 1, rng);
    const dirs: Direction[] = ["no", "so", "ea", "we", "ne", "nw", "se", "sw"];

    for (let i = 0; i < 800 && state.status === "playing"; i++) {
      const roll = Math.floor(rng() * 3);
      const dir = dirs[Math.floor(rng() * dirs.length)];
      if (roll === 0) attack(state, dir, rng);
      else if (roll === 1) use(state, dir, rng);
      else move(state, dir, rng);

      expect(state.player.hp).toBeGreaterThanOrEqual(0);
      expect(state.player.gold).toBeGreaterThanOrEqual(0);
      expect(state.map[state.player.y]?.[state.player.x]).toBeDefined();
    }
  });
});

describe("faithful combat rules", () => {
  /** Places one enemy of the given race directly east of the player. */
  function adjacent(state: GameState, race: keyof typeof ENEMY_SPECS) {
    const spec = ENEMY_SPECS[race];
    const x = state.player.x + 1;
    const y = state.player.y;
    state.map[y][x] = ".";
    state.enemies = [
      {
        id: 77,
        race: spec.race,
        hp: spec.maxHP,
        maxHP: spec.maxHP,
        atk: spec.atk,
        def: spec.def,
        x,
        y,
      },
    ];
    return state.enemies[0];
  }

  /**
   * Every enemy in the C++ rolls rand() % 2 before dealing damage — there is no
   * always-hits enemy. Getting this wrong roughly doubles incoming damage and
   * makes the game unwinnable, so it is worth pinning.
   */
  it("lets every enemy miss roughly half the time", () => {
    for (const race of ["human", "dwarf", "orc", "halfling"] as const) {
      let misses = 0;
      const trials = 120;
      for (let seed = 1; seed <= trials; seed++) {
        const { state, rng } = newGame(seed);
        adjacent(state, race);
        state.items = [];
        const before = state.player.hp;
        // Spend a turn without attacking, so only the enemy acts.
        use(state, "we", rng);
        if (state.player.hp === before) misses++;
      }
      // Well short of both 0 and 100%: the roll is real.
      expect(misses, `${race} never missed`).toBeGreaterThan(trials * 0.2);
      expect(misses, `${race} never hit`).toBeLessThan(trials * 0.8);
    }
  });

  it("lets an elf hit harder than a human of the same roll", () => {
    // An elf swings twice, so its worst case exceeds a single-swing enemy's.
    let elfMax = 0;
    let humanMax = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const elf = newGame(seed);
      adjacent(elf.state, "elf");
      elf.state.items = [];
      const beforeElf = elf.state.player.hp;
      use(elf.state, "we", elf.rng);
      elfMax = Math.max(elfMax, beforeElf - elf.state.player.hp);

      const human = newGame(seed);
      adjacent(human.state, "human");
      human.state.items = [];
      const beforeHuman = human.state.player.hp;
      use(human.state, "we", human.rng);
      humanMax = Math.max(humanMax, beforeHuman - human.state.player.hp);
    }
    expect(elfMax).toBeGreaterThan(humanMax);
  });

  it("spares the Drow an elf's second swing", () => {
    // The Drow can only ever take one swing's worth from an elf.
    const single = damage(ENEMY_SPECS.elf.atk, makePlayer("Drow").def);
    for (let seed = 1; seed <= 60; seed++) {
      const { state, rng } = newGame(seed, "Drow");
      adjacent(state, "elf");
      state.items = [];
      const before = state.player.hp;
      use(state, "we", rng);
      expect(before - state.player.hp).toBeLessThanOrEqual(single);
    }
  });

  it("makes an orc hit a Goblin half again as hard", () => {
    const plain = damage(ENEMY_SPECS.orc.atk, makePlayer("Shade").def);
    let goblinMax = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { state, rng } = newGame(seed, "Goblin");
      adjacent(state, "orc");
      state.items = [];
      const before = state.player.hp;
      use(state, "we", rng);
      goblinMax = Math.max(goblinMax, before - state.player.hp);
    }
    expect(goblinMax).toBeGreaterThan(plain);
  });

  it("lets a halfling dodge about half of what the player throws", () => {
    let dodges = 0;
    const trials = 120;
    for (let seed = 1; seed <= trials; seed++) {
      const { state, rng } = newGame(seed);
      const halfling = adjacent(state, "halfling");
      attack(state, "ea", rng);
      if (halfling.hp === halfling.maxHP) dodges++;
    }
    expect(dodges).toBeGreaterThan(trials * 0.2);
    expect(dodges).toBeLessThan(trials * 0.8);
  });
});
