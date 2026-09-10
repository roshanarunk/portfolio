/**
 * The CC3K combat model, ported from the C++ original.
 *
 * Damage is `ceil((100 / (100 + def)) * atk)` — defence gives diminishing
 * returns rather than flat reduction, so doubling def never halves damage. Each
 * race and enemy carries the stats from its constructor in the source.
 *
 * Pure and dependency-free, so it unit tests in plain Node.
 */

export interface Combatant {
  name: string;
  maxHP: number;
  atk: number;
  def: number;
  /** The character the original renders on the terminal grid. */
  symbol: string;
  note?: string;
}

/** Player races, from the Player subclass constructors. */
export const RACES: Combatant[] = [
  {
    name: "Human",
    maxHP: 140,
    atk: 20,
    def: 20,
    symbol: "@",
    note: "The baseline: no special rule, balanced stats.",
  },
  {
    name: "Drow",
    maxHP: 150,
    atk: 25,
    def: 15,
    symbol: "@",
    note: "Highest HP of the races, and potions do more for it.",
  },
  {
    name: "Vampire",
    maxHP: 999,
    atk: 25,
    def: 25,
    symbol: "@",
    note: "Starts at 50 HP with no cap, gaining 5 with every hit landed.",
  },
  {
    name: "Troll",
    maxHP: 120,
    atk: 25,
    def: 15,
    symbol: "@",
    note: "Regains 5 HP each turn, so attrition favours it.",
  },
  {
    name: "Goblin",
    maxHP: 110,
    atk: 15,
    def: 20,
    symbol: "@",
    note: "Weakest attack, but steals 5 gold from anything it kills.",
  },
];

/** Enemy types, from the Enemy subclass constructors. */
export const ENEMIES: Combatant[] = [
  { name: "Human", maxHP: 140, atk: 20, def: 20, symbol: "H" },
  { name: "Dwarf", maxHP: 100, atk: 20, def: 30, symbol: "W" },
  { name: "Elf", maxHP: 140, atk: 30, def: 10, symbol: "E" },
  { name: "Orc", maxHP: 180, atk: 30, def: 25, symbol: "O" },
  { name: "Halfling", maxHP: 100, atk: 15, def: 20, symbol: "L" },
  {
    name: "Merchant",
    maxHP: 30,
    atk: 70,
    def: 5,
    symbol: "M",
    note: "Harmless until provoked, then hits harder than anything else.",
  },
];

/**
 * The damage formula from the C++ source, ceiling included.
 * `double dmg = (100.00 / (100.00 + e.def)) * atk; int damage = ceil(dmg);`
 */
export function damage(attackerAtk: number, defenderDef: number): number {
  return Math.ceil((100 / (100 + defenderDef)) * attackerAtk);
}

export interface Attack {
  /** 1-based turn number. */
  turn: number;
  by: "player" | "enemy";
  amount: number;
  /** Defender HP after the hit. */
  remaining: number;
  /** HP regained this turn by a racial trait, if any. */
  healed?: number;
}

export interface Fight {
  attacks: Attack[];
  winner: "player" | "enemy";
  turns: number;
  playerHP: number;
  enemyHP: number;
}

export interface FightOptions {
  /** Troll regenerates; Vampire drains. Applied per turn, as in the original. */
  trait?: "regen" | "drain" | "none";
}

const MAX_TURNS = 200;

/**
 * Runs a fight to its conclusion, player striking first.
 *
 * The original resolves combat one exchange per turn, so a defender that dies
 * to the player's blow never swings back — which is why turn order matters and
 * why the Merchant is survivable at all.
 */
export function simulate(
  player: Combatant,
  enemy: Combatant,
  options: FightOptions = {},
): Fight {
  const trait = options.trait ?? "none";
  // The Vampire opens at 50 despite an uncapped maximum.
  let playerHP = player.name === "Vampire" ? 50 : player.maxHP;
  let enemyHP = enemy.maxHP;

  const attacks: Attack[] = [];
  let turn = 0;

  while (playerHP > 0 && enemyHP > 0 && turn < MAX_TURNS) {
    turn++;

    const dealt = damage(player.atk, enemy.def);
    enemyHP = Math.max(0, enemyHP - dealt);

    // Draining only happens on a landed hit, so it stops when the enemy dies.
    const drained = trait === "drain" ? 5 : 0;
    if (drained) playerHP += drained;

    attacks.push({
      turn,
      by: "player",
      amount: dealt,
      remaining: enemyHP,
      healed: drained || undefined,
    });

    if (enemyHP <= 0) break;

    const taken = damage(enemy.atk, player.def);
    playerHP = Math.max(0, playerHP - taken);

    // Regeneration is a turn effect, so it applies even on a turn spent taking damage.
    const healed = trait === "regen" && playerHP > 0 ? 5 : 0;
    if (healed) playerHP = Math.min(player.maxHP, playerHP + healed);

    attacks.push({
      turn,
      by: "enemy",
      amount: taken,
      remaining: playerHP,
      healed: healed || undefined,
    });
  }

  return {
    attacks,
    winner: enemyHP <= 0 ? "player" : "enemy",
    turns: turn,
    playerHP,
    enemyHP,
  };
}

/** The racial trait a given race applies during a fight. */
export function traitFor(race: string): FightOptions["trait"] {
  if (race === "Troll") return "regen";
  if (race === "Vampire") return "drain";
  return "none";
}
