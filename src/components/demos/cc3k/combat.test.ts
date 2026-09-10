import { describe, it, expect } from "vitest";
import {
  ENEMIES,
  RACES,
  damage,
  simulate,
  traitFor,
  type Combatant,
} from "./combat";

const race = (name: string) => RACES.find((r) => r.name === name)!;
const enemy = (name: string) => ENEMIES.find((e) => e.name === name)!;

describe("damage", () => {
  /** ceil((100 / (100 + def)) * atk), straight from the C++ source. */
  it("matches the formula from the original", () => {
    // (100 / 120) * 25 = 20.83… → 21
    expect(damage(25, 20)).toBe(21);
    // (100 / 130) * 30 = 23.07… → 24
    expect(damage(30, 30)).toBe(24);
  });

  it("rounds up, so an attack always lands for something", () => {
    expect(damage(1, 1000)).toBe(1);
  });

  it("gives defence diminishing returns rather than flat reduction", () => {
    const atZero = damage(100, 0);
    const atFifty = damage(100, 50);
    const atHundred = damage(100, 100);

    expect(atZero).toBe(100);
    // Doubling defence does not halve the damage taken.
    expect(atHundred).toBeGreaterThan(atZero / 4);
    expect(atFifty).toBeGreaterThan(atHundred);
  });

  it("is monotonic in both inputs", () => {
    expect(damage(30, 20)).toBeGreaterThan(damage(20, 20));
    expect(damage(20, 10)).toBeGreaterThan(damage(20, 30));
  });
});

describe("stat tables", () => {
  it("carries the five playable races", () => {
    expect(RACES.map((r) => r.name)).toEqual([
      "Human",
      "Drow",
      "Vampire",
      "Troll",
      "Goblin",
    ]);
  });

  it("gives every combatant usable stats", () => {
    for (const c of [...RACES, ...ENEMIES] as Combatant[]) {
      expect(c.maxHP, c.name).toBeGreaterThan(0);
      expect(c.atk, c.name).toBeGreaterThan(0);
      expect(c.def, c.name).toBeGreaterThanOrEqual(0);
      expect(c.symbol, c.name).toHaveLength(1);
    }
  });

  it("keeps the Merchant glassy: hardest hitter, least health", () => {
    const merchant = enemy("Merchant");
    expect(Math.max(...ENEMIES.map((e) => e.atk))).toBe(merchant.atk);
    expect(Math.min(...ENEMIES.map((e) => e.maxHP))).toBe(merchant.maxHP);
  });
});

describe("simulate", () => {
  it("resolves to a winner", () => {
    const fight = simulate(race("Human"), enemy("Dwarf"));
    expect(["player", "enemy"]).toContain(fight.winner);
    expect(fight.turns).toBeGreaterThan(0);
  });

  it("lets the player strike first", () => {
    const fight = simulate(race("Human"), enemy("Orc"));
    expect(fight.attacks[0].by).toBe("player");
  });

  /**
   * The original resolves one exchange per turn, so an enemy killed by the
   * player's blow never retaliates. That is what makes the Merchant winnable.
   */
  it("does not let a dead enemy swing back", () => {
    const fight = simulate(race("Drow"), enemy("Merchant"));
    const last = fight.attacks.at(-1)!;
    if (fight.winner === "player") {
      expect(last.by).toBe("player");
      expect(last.remaining).toBe(0);
    }
  });

  it("never leaves HP below zero", () => {
    for (const r of RACES) {
      for (const e of ENEMIES) {
        const fight = simulate(r, e, { trait: traitFor(r.name) });
        expect(fight.playerHP, `${r.name} vs ${e.name}`).toBeGreaterThanOrEqual(0);
        expect(fight.enemyHP, `${r.name} vs ${e.name}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("terminates for every matchup", () => {
    for (const r of RACES) {
      for (const e of ENEMIES) {
        const fight = simulate(r, e, { trait: traitFor(r.name) });
        expect(fight.turns, `${r.name} vs ${e.name}`).toBeLessThan(200);
      }
    }
  });

  it("regenerates the Troll each turn it survives", () => {
    const fight = simulate(race("Troll"), enemy("Orc"), { trait: "regen" });
    const healed = fight.attacks.filter((a) => a.by === "enemy" && a.healed);
    expect(healed.length).toBeGreaterThan(0);
    expect(healed[0].healed).toBe(5);
  });

  it("drains health to the Vampire on every landed hit", () => {
    const fight = simulate(race("Vampire"), enemy("Orc"), { trait: "drain" });
    const drained = fight.attacks.filter((a) => a.by === "player" && a.healed);
    expect(drained.length).toBe(
      fight.attacks.filter((a) => a.by === "player").length,
    );
  });

  it("starts the Vampire at 50 despite its uncapped maximum", () => {
    // The first blow it takes must come off 50, not off maxHP.
    const fight = simulate(race("Vampire"), enemy("Elf"), { trait: "drain" });
    const firstTaken = fight.attacks.find((a) => a.by === "enemy")!;
    const expected = 50 + 5 - damage(enemy("Elf").atk, race("Vampire").def);
    expect(firstTaken.remaining).toBe(expected);
  });

  it("makes the regenerating Troll outlast the plain Human", () => {
    const troll = simulate(race("Troll"), enemy("Orc"), { trait: "regen" });
    const human = simulate(race("Human"), enemy("Orc"));
    // Same enemy, and the Troll's lower HP is offset by regeneration.
    expect(troll.turns).toBeGreaterThanOrEqual(human.turns);
  });

  it("records a coherent HP trail", () => {
    const fight = simulate(race("Goblin"), enemy("Dwarf"));
    const enemyHits = fight.attacks.filter((a) => a.by === "player");
    for (let i = 1; i < enemyHits.length; i++) {
      // The enemy's HP only ever falls.
      expect(enemyHits[i].remaining).toBeLessThan(enemyHits[i - 1].remaining);
    }
  });
});

describe("traitFor", () => {
  it("assigns each race its rule", () => {
    expect(traitFor("Troll")).toBe("regen");
    expect(traitFor("Vampire")).toBe("drain");
    expect(traitFor("Human")).toBe("none");
    expect(traitFor("Goblin")).toBe("none");
  });
});
