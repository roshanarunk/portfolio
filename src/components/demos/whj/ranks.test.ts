import { describe, it, expect } from "vitest";
import {
  actIndexFor,
  isHigherRank,
  parseRiotId,
  verdictFor,
  type Student,
} from "./ranks";

describe("isHigherRank, as ported from hooj.py", () => {
  it("compares tiers", () => {
    expect(isHigherRank("Silver 2", "Gold 1")).toBe(true);
    expect(isHigherRank("Gold 1", "Silver 2")).toBe(false);
  });

  it("compares divisions inside a tier", () => {
    expect(isHigherRank("Gold 1", "Gold 3")).toBe(true);
    expect(isHigherRank("Gold 3", "Gold 1")).toBe(false);
  });

  it("treats an identical rank as not higher", () => {
    expect(isHigherRank("Platinum 2", "Platinum 2")).toBe(false);
  });

  /** Both are special-cased before parsing, exactly as the original does. */
  it("lets Radiant beat anything and Unrated lose to anything", () => {
    expect(isHigherRank("Immortal 3", "Radiant")).toBe(true);
    expect(isHigherRank("Iron 1", "Unrated")).toBe(false);
  });

  it("handles the full tier ladder in order", () => {
    const ladder = [
      "Iron 1",
      "Bronze 1",
      "Silver 1",
      "Gold 1",
      "Platinum 1",
      "Diamond 1",
      "Ascendant 1",
      "Immortal 1",
    ];
    for (let i = 1; i < ladder.length; i++) {
      expect(isHigherRank(ladder[i - 1], ladder[i]), ladder[i]).toBe(true);
    }
  });
});

describe("act boundaries", () => {
  it("places a date in the act it falls in", () => {
    expect(actIndexFor(new Date("2022-09-01"))).toBe(0);
    expect(actIndexFor(new Date("2022-11-01"))).toBe(1);
    expect(actIndexFor(new Date("2023-02-01"))).toBe(2);
    expect(actIndexFor(new Date("2023-04-01"))).toBe(3);
    expect(actIndexFor(new Date("2023-08-01"))).toBe(4);
  });
});

describe("parseRiotId", () => {
  it("pulls name and tag out of a tracker URL", () => {
    const parsed = parseRiotId(
      "https://tracker.gg/valorant/profile/riot/Roshan%23NA1/overview",
    );
    expect(parsed).toEqual({ name: "Roshan", tag: "NA1" });
  });

  it("decodes an encoded name", () => {
    const parsed = parseRiotId(
      "https://tracker.gg/valorant/profile/riot/some%20player%23EUW/overview",
    );
    expect(parsed?.name).toBe("some player");
  });

  it("returns null for a URL it cannot read", () => {
    expect(parseRiotId("https://tracker.gg/valorant")).toBeNull();
  });
});

describe("the report's verdict", () => {
  const base: Student = {
    name: "Student",
    startRank: "Silver 1",
    currentRank: "Gold 2",
    lastSeen: new Date("2023-08-01"),
  };
  const today = new Date("2023-08-15");

  it("reports improvement", () => {
    expect(verdictFor(base, today)).toBe("improved");
  });

  it("reports a drop", () => {
    expect(
      verdictFor({ ...base, startRank: "Gold 2", currentRank: "Silver 1" }, today),
    ).toBe("dropped");
  });

  it("reports no change", () => {
    expect(
      verdictFor({ ...base, startRank: "Gold 2", currentRank: "Gold 2" }, today),
    ).toBe("same");
  });

  /**
   * The distinction that made the original write two files: a reading from an
   * earlier act cannot support a conclusion, so it is separated rather than
   * silently compared.
   */
  it("reports a reading from an earlier act as stale, not as a comparison", () => {
    expect(verdictFor({ ...base, lastSeen: new Date("2023-02-01") }, today)).toBe(
      "stale",
    );
  });
});
