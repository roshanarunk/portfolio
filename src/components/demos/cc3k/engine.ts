/**
 * The CC3K game engine, ported from the C++ original.
 *
 * This is the whole game, not a simulation of it: the 79x25 grid loaded from
 * default.txt, five floors, the same spawn counts and weights, the same enemy
 * AI, and the same combat arithmetic. Pure and dependency-free, so it unit
 * tests in plain Node with no DOM.
 *
 * Rules carried over verbatim from the source:
 *  - damage = ceil(100 / (100 + def) * atk)
 *  - 10 potions, 10 gold piles, 20 enemies per floor, placed in five chambers
 *  - enemies attack when the player is within one cell, else step to a random
 *    adjacent floor tile
 *  - dragons never wander; they guard their hoard and strike anything adjacent
 *  - merchants ignore the player until one of them is attacked, forever after
 *  - every enemy rolls rand() % 2 and misses on a zero
 *  - an elf swings twice, sparing only a Drow; an orc hits a Goblin 1.5x
 *  - a halfling dodges half of what the player throws at it
 */

export const WIDTH = 79;
export const HEIGHT = 25;
export const FLOOR_COUNT = 5;

export type Direction = "no" | "so" | "ea" | "we" | "ne" | "nw" | "se" | "sw";

export const DIRECTIONS: Record<Direction, { dx: number; dy: number }> = {
  no: { dx: 0, dy: -1 },
  so: { dx: 0, dy: 1 },
  ea: { dx: 1, dy: 0 },
  we: { dx: -1, dy: 0 },
  ne: { dx: 1, dy: -1 },
  nw: { dx: -1, dy: -1 },
  se: { dx: 1, dy: 1 },
  sw: { dx: -1, dy: 1 },
};

export type RaceName = "Shade" | "Drow" | "Vampire" | "Troll" | "Goblin";

export interface RaceSpec {
  name: RaceName;
  maxHP: number;
  startHP: number;
  atk: number;
  def: number;
  blurb: string;
}

/** Stats from the Player subclass constructors. */
export const RACES: RaceSpec[] = [
  {
    name: "Shade",
    maxHP: 125,
    startHP: 125,
    atk: 25,
    def: 25,
    blurb: "Scores 1.5x gold. The balanced pick.",
  },
  {
    name: "Drow",
    maxHP: 150,
    startHP: 150,
    atk: 25,
    def: 15,
    blurb: "Potions do 1.5x — for better and for worse.",
  },
  {
    name: "Vampire",
    maxHP: Number.MAX_SAFE_INTEGER,
    startHP: 50,
    atk: 25,
    def: 25,
    blurb: "No HP cap: +1 per hit landed, but dwarves drain 5.",
  },
  {
    name: "Troll",
    maxHP: 120,
    startHP: 120,
    atk: 25,
    def: 15,
    blurb: "Regains 5 HP every turn.",
  },
  {
    name: "Goblin",
    maxHP: 110,
    startHP: 110,
    atk: 15,
    def: 20,
    blurb: "Steals 5 gold from every enemy it kills.",
  },
];

export type EnemyRace =
  "human" | "dwarf" | "halfling" | "elf" | "orc" | "merchant" | "dragon";

interface EnemySpec {
  race: EnemyRace;
  symbol: string;
  maxHP: number;
  atk: number;
  def: number;
}

/** Stats from the Enemy subclass constructors. */
export const ENEMY_SPECS: Record<EnemyRace, EnemySpec> = {
  human: { race: "human", symbol: "H", maxHP: 140, atk: 20, def: 20 },
  dwarf: { race: "dwarf", symbol: "W", maxHP: 100, atk: 20, def: 30 },
  halfling: { race: "halfling", symbol: "L", maxHP: 100, atk: 15, def: 20 },
  elf: { race: "elf", symbol: "E", maxHP: 140, atk: 30, def: 10 },
  orc: { race: "orc", symbol: "O", maxHP: 180, atk: 30, def: 25 },
  merchant: { race: "merchant", symbol: "M", maxHP: 30, atk: 70, def: 5 },
  dragon: { race: "dragon", symbol: "D", maxHP: 150, atk: 20, def: 20 },
};

export type PotionType = "RH" | "BA" | "BD" | "PH" | "WA" | "WD";

export const POTION_NAMES: Record<PotionType, string> = {
  RH: "Restore Health",
  BA: "Boost Attack",
  BD: "Boost Defence",
  PH: "Poison Health",
  WA: "Wound Attack",
  WD: "Wound Defence",
};

export type GoldType = "small" | "normal" | "merchant" | "dragon";

export const GOLD_VALUE: Record<GoldType, number> = {
  small: 1,
  normal: 2,
  merchant: 4,
  dragon: 6,
};

export interface Enemy {
  id: number;
  race: EnemyRace;
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  x: number;
  y: number;
  /** Guards a dragon hoard at this position; such enemies never wander. */
  guards?: { x: number; y: number };
}

export interface Item {
  x: number;
  y: number;
  kind: "potion" | "gold";
  potion?: PotionType;
  gold?: GoldType;
  /** A dragon hoard cannot be taken while its dragon lives. */
  dragonId?: number;
}

export interface Player {
  race: RaceName;
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  gold: number;
  x: number;
  y: number;
}

export interface GameState {
  /** Static terrain for the current floor: wall, floor, door, passage, stairs. */
  map: string[][];
  floor: number;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  stairs: { x: number; y: number };
  /** Set once any merchant is attacked; they turn hostile for the rest of the run. */
  merchantsHostile: boolean;
  enemiesFrozen: boolean;
  log: string[];
  status: "playing" | "dead" | "won";
  turn: number;
}

/** Deterministic RNG, so a seeded game replays identically in tests. */
export function makeRng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

type Rng = () => number;

const randInt = (rng: Rng, n: number) => Math.floor(rng() * n);

/** Damage formula from the C++, ceiling included. */
export function damage(atk: number, def: number): number {
  return Math.ceil((100 / (100 + def)) * atk);
}

/**
 * Chamber bounds from Floor::getRandom. Chambers are irregular, so some rows
 * span different columns; the generator retries until it lands on a floor tile,
 * exactly as the original do/while loops do.
 */
function randomInChamber(
  rng: Rng,
  map: string[][],
  chamber: number,
): { x: number; y: number } {
  for (let attempt = 0; attempt < 500; attempt++) {
    let x = 0;
    let y = 0;
    switch (chamber) {
      case 1:
        y = randInt(rng, 4) + 3;
        x = randInt(rng, 26) + 3;
        break;
      case 2:
        y = randInt(rng, 10) + 3;
        if (y === 3 || y === 4) x = randInt(rng, 23) + 39;
        else if (y === 5) x = randInt(rng, 31) + 39;
        else if (y === 6) x = randInt(rng, 34) + 39;
        else x = randInt(rng, 15) + 61;
        break;
      case 3:
        y = randInt(rng, 3) + 10;
        x = randInt(rng, 12) + 38;
        break;
      case 4:
        y = randInt(rng, 7) + 15;
        x = randInt(rng, 21) + 4;
        break;
      default:
        y = randInt(rng, 6) + 16;
        if (y >= 16 && y <= 18) x = randInt(rng, 11) + 65;
        else x = randInt(rng, 39) + 37;
        break;
    }
    if (map[y]?.[x] === ".") return { x, y };
  }
  // Fall back to any open tile rather than looping forever on a broken map.
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (map[y][x] === ".") return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

/** Splits the 125-line map file into its five 25-row floors. */
export function parseFloors(text: string): string[][][] {
  const lines = text.split(/\r?\n/);
  const floors: string[][][] = [];
  for (let f = 0; f < FLOOR_COUNT; f++) {
    const rows: string[][] = [];
    for (let r = 0; r < HEIGHT; r++) {
      const line = lines[f * HEIGHT + r] ?? "";
      rows.push(line.padEnd(WIDTH, " ").slice(0, WIDTH).split(""));
    }
    floors.push(rows);
  }
  return floors;
}

function occupied(state: GameState, x: number, y: number): boolean {
  if (state.player.x === x && state.player.y === y) return true;
  return state.enemies.some((e) => e.x === x && e.y === y);
}

/**
 * Populates a floor: player and stairs in different chambers, then 10 potions,
 * 10 gold piles and 20 enemies with the original's weightings.
 */
export function generateFloor(
  map: string[][],
  player: Player,
  floor: number,
  rng: Rng,
): GameState {
  const state: GameState = {
    map,
    floor,
    player,
    enemies: [],
    items: [],
    stairs: { x: 0, y: 0 },
    merchantsHostile: false,
    enemiesFrozen: false,
    log: [],
    status: "playing",
    turn: 0,
  };

  const playerChamber = randInt(rng, 5) + 1;
  let stairsChamber = randInt(rng, 5) + 1;
  while (stairsChamber === playerChamber) stairsChamber = randInt(rng, 5) + 1;

  const start = randomInChamber(rng, map, playerChamber);
  player.x = start.x;
  player.y = start.y;

  state.stairs = randomInChamber(rng, map, stairsChamber);

  // 10 potions, one of six types each.
  const potionTypes: PotionType[] = ["RH", "BA", "BD", "PH", "WA", "WD"];
  for (let i = 0; i < 10; i++) {
    const spot = randomInChamber(rng, map, randInt(rng, 5) + 1);
    if (occupied(state, spot.x, spot.y)) continue;
    state.items.push({
      ...spot,
      kind: "potion",
      potion: potionTypes[randInt(rng, 6)],
    });
  }

  // 10 gold piles: 5/8 small, 2/8 normal, 1/8 dragon hoard with a guard.
  let nextId = 1;
  for (let i = 0; i < 10; i++) {
    const spot = randomInChamber(rng, map, randInt(rng, 5) + 1);
    if (occupied(state, spot.x, spot.y)) continue;
    const roll = randInt(rng, 8) + 1;
    if (roll <= 5) {
      state.items.push({ ...spot, kind: "gold", gold: "small" });
    } else if (roll <= 7) {
      state.items.push({ ...spot, kind: "gold", gold: "normal" });
    } else {
      // A dragon spawns on an adjacent floor tile and guards the hoard.
      const spec = ENEMY_SPECS.dragon;
      const dragonId = nextId++;
      let placed = false;
      for (let attempt = 0; attempt < 40 && !placed; attempt++) {
        const dx = randInt(rng, 3) - 1;
        const dy = randInt(rng, 3) - 1;
        if (dx === 0 && dy === 0) continue;
        const nx = spot.x + dx;
        const ny = spot.y + dy;
        if (map[ny]?.[nx] !== "." || occupied(state, nx, ny)) continue;
        state.enemies.push({
          id: dragonId,
          race: "dragon",
          hp: spec.maxHP,
          maxHP: spec.maxHP,
          atk: spec.atk,
          def: spec.def,
          x: nx,
          y: ny,
          guards: { x: spot.x, y: spot.y },
        });
        placed = true;
      }
      state.items.push({
        ...spot,
        kind: "gold",
        gold: "dragon",
        dragonId: placed ? dragonId : undefined,
      });
    }
  }

  // 20 enemies, weighted 4/3/5/2/2/2 out of 18 as in the original.
  for (let i = 0; i < 20; i++) {
    const spot = randomInChamber(rng, map, randInt(rng, 5) + 1);
    if (occupied(state, spot.x, spot.y)) continue;
    const roll = randInt(rng, 18) + 1;
    let race: EnemyRace;
    if (roll <= 4) race = "human";
    else if (roll <= 7) race = "dwarf";
    else if (roll <= 12) race = "halfling";
    else if (roll <= 14) race = "elf";
    else if (roll <= 16) race = "orc";
    else race = "merchant";

    const spec = ENEMY_SPECS[race];
    state.enemies.push({
      id: nextId++,
      race,
      hp: spec.maxHP,
      maxHP: spec.maxHP,
      atk: spec.atk,
      def: spec.def,
      ...spot,
    });
  }

  return state;
}

export function makePlayer(race: RaceName): Player {
  const spec = RACES.find((r) => r.name === race)!;
  return {
    race,
    hp: spec.startHP,
    maxHP: spec.maxHP,
    atk: spec.atk,
    def: spec.def,
    gold: 0,
    x: 0,
    y: 0,
  };
}

const isWalkable = (ch: string) => ch === "." || ch === "+" || ch === "#";

function enemyAt(state: GameState, x: number, y: number): Enemy | undefined {
  return state.enemies.find((e) => e.x === x && e.y === y);
}

function itemAt(state: GameState, x: number, y: number): Item | undefined {
  return state.items.find((i) => i.x === x && i.y === y);
}

function log(state: GameState, message: string) {
  state.log.push(message);
  // Only the recent history is ever shown, so the array need not grow forever.
  if (state.log.length > 60) state.log.shift();
}

/** Applies a potion, with the Drow's 1.5x multiplier. */
function drink(state: GameState, potion: PotionType) {
  const p = state.player;
  const scale = p.race === "Drow" ? 1.5 : 1;
  const hp = Math.floor(10 * scale);
  const stat = Math.floor(5 * scale);

  switch (potion) {
    case "RH":
      p.hp = Math.min(p.maxHP, p.hp + hp);
      break;
    case "PH":
      p.hp = Math.max(0, p.hp - hp);
      break;
    case "BA":
      p.atk += stat;
      break;
    case "WA":
      p.atk = Math.max(0, p.atk - stat);
      break;
    case "BD":
      p.def += stat;
      break;
    case "WD":
      p.def = Math.max(0, p.def - stat);
      break;
  }
  log(state, `PC drinks ${POTION_NAMES[potion]}.`);
  if (p.hp <= 0) {
    state.status = "dead";
    log(state, "The potion was fatal.");
  }
}

/** One enemy's turn: strike if adjacent, else wander. */
function actEnemy(state: GameState, enemy: Enemy, rng: Rng) {
  const p = state.player;
  const adjacent = Math.abs(enemy.x - p.x) <= 1 && Math.abs(enemy.y - p.y) <= 1;

  if (adjacent) {
    // Merchants stay peaceful until provoked, and stay hostile afterwards.
    if (enemy.race === "merchant" && !state.merchantsHostile) return;

    // EVERY enemy rolls rand() % 2 and misses on a zero — there is no
    // always-hits enemy in the original, which is what keeps the game winnable.
    let base = damage(enemy.atk, p.def);

    // An orc hits a goblin half again as hard.
    if (enemy.race === "orc" && p.race === "Goblin") {
      base = Math.ceil(base * 1.5);
    }

    let dealt = randInt(rng, 2) === 1 ? base : 0;

    // An elf swings twice; only a Drow is spared the second blow.
    if (enemy.race === "elf" && p.race !== "Drow" && randInt(rng, 2) === 1) {
      dealt += base;
    }

    if (dealt > 0) {
      p.hp = Math.max(0, p.hp - dealt);
      log(state, `${enemy.race} hits PC for ${dealt}.`);
      if (p.hp <= 0) {
        state.status = "dead";
        log(state, `PC is slain by a ${enemy.race}.`);
      }
    } else {
      log(state, `${enemy.race} misses.`);
    }
    return;
  }

  // Dragons guard their hoard and never wander.
  if (enemy.guards || state.enemiesFrozen) return;

  for (let attempt = 0; attempt < 12; attempt++) {
    const dx = randInt(rng, 3) - 1;
    const dy = randInt(rng, 3) - 1;
    if (dx === 0 && dy === 0) continue;
    const nx = enemy.x + dx;
    const ny = enemy.y + dy;
    // The original restricts wandering to chamber floor, not doors or passages.
    if (state.map[ny]?.[nx] !== "." || occupied(state, nx, ny)) continue;
    enemy.x = nx;
    enemy.y = ny;
    return;
  }
}

function enemyTurn(state: GameState, rng: Rng) {
  for (const enemy of [...state.enemies]) {
    if (state.status !== "playing") return;
    actEnemy(state, enemy, rng);
  }
  // The Troll regenerates each turn it survives.
  if (state.player.race === "Troll" && state.status === "playing") {
    state.player.hp = Math.min(state.player.maxHP, state.player.hp + 5);
  }
  state.turn++;
}

export interface MoveResult {
  /** Set when the player stepped onto the staircase. */
  descended: boolean;
}

/** Moves the player, collecting gold and stepping onto stairs. */
export function move(state: GameState, direction: Direction, rng: Rng): MoveResult {
  if (state.status !== "playing") return { descended: false };

  const { dx, dy } = DIRECTIONS[direction];
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  const tile = state.map[ny]?.[nx];

  if (!tile || !isWalkable(tile)) {
    log(state, "PC tries to move but is blocked.");
    enemyTurn(state, rng);
    return { descended: false };
  }
  if (enemyAt(state, nx, ny)) {
    log(state, "PC is blocked by an enemy.");
    enemyTurn(state, rng);
    return { descended: false };
  }

  if (state.stairs.x === nx && state.stairs.y === ny) {
    state.player.x = nx;
    state.player.y = ny;
    return { descended: true };
  }

  state.player.x = nx;
  state.player.y = ny;

  const item = itemAt(state, nx, ny);
  if (item?.kind === "gold") {
    // A dragon hoard cannot be taken while its dragon still lives.
    const guarded =
      item.dragonId !== undefined && state.enemies.some((e) => e.id === item.dragonId);
    if (!guarded) {
      const scale = state.player.race === "Shade" ? 1.5 : 1;
      const amount = Math.floor(GOLD_VALUE[item.gold!] * scale);
      state.player.gold += amount;
      state.items = state.items.filter((i) => i !== item);
      log(state, `PC picks up ${amount} gold.`);
    } else {
      log(state, "A dragon guards this hoard.");
    }
  }

  enemyTurn(state, rng);
  return { descended: false };
}

/** Attacks whatever stands in the given direction. */
export function attack(state: GameState, direction: Direction, rng: Rng) {
  if (state.status !== "playing") return;

  const { dx, dy } = DIRECTIONS[direction];
  const target = enemyAt(state, state.player.x + dx, state.player.y + dy);

  if (!target) {
    log(state, "PC tries to attack but hits nothing.");
    enemyTurn(state, rng);
    return;
  }

  // Attacking any merchant turns every merchant hostile, permanently.
  if (target.race === "merchant") state.merchantsHostile = true;

  // A halfling dodges half of everything thrown at it: Halfling::getAttackedby
  // rolls rand() % 2 and only then lets the blow through.
  if (target.race === "halfling" && randInt(rng, 2) !== 1) {
    log(state, "The halfling dodges.");
    enemyTurn(state, rng);
    return;
  }

  const dealt = damage(state.player.atk, target.def);
  target.hp = Math.max(0, target.hp - dealt);

  // The Vampire drains on a hit, but dwarves cost it 5 instead.
  if (state.player.race === "Vampire") {
    if (target.race === "dwarf") {
      state.player.hp = Math.max(0, state.player.hp - 5);
    } else {
      state.player.hp += 1;
    }
  }

  log(state, `PC hits ${target.race} for ${dealt}.`);

  if (target.hp <= 0) {
    state.enemies = state.enemies.filter((e) => e !== target);
    log(state, `PC kills ${target.race}.`);

    if (state.player.race === "Goblin") state.player.gold += 5;

    if (target.race === "merchant" || target.race === "human") {
      state.items.push({
        x: target.x,
        y: target.y,
        kind: "gold",
        gold: "merchant",
      });
    } else if (target.race !== "dragon") {
      state.player.gold += randInt(rng, 2) + 1;
    }
  }

  if (state.player.hp <= 0) {
    state.status = "dead";
    log(state, "PC dies.");
    return;
  }

  enemyTurn(state, rng);
}

/** Drinks the potion in the given direction. */
export function use(state: GameState, direction: Direction, rng: Rng) {
  if (state.status !== "playing") return;

  const { dx, dy } = DIRECTIONS[direction];
  const x = state.player.x + dx;
  const y = state.player.y + dy;
  const item = itemAt(state, x, y);

  if (item?.kind !== "potion") {
    log(state, "There is no potion there.");
    enemyTurn(state, rng);
    return;
  }

  state.items = state.items.filter((i) => i !== item);
  drink(state, item.potion!);
  if (state.status === "playing") enemyTurn(state, rng);
}

/** Final score: gold, with the Shade's bonus already applied on pickup. */
export function score(state: GameState): number {
  return state.player.gold;
}
