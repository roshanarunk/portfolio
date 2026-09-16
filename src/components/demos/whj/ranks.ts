/**
 * A direct port of the rank-comparison logic from `hooj.py`.
 *
 * The script's job is to read a roster of students from Google Sheets, look up
 * each one's current Valorant rank, and report who improved. The Sheets and
 * rank APIs need credentials and cannot come to the browser — but the part that
 * decides "did this student go up?" is pure and ports exactly.
 */

export const TIERS = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Ascendant",
  "Immortal",
] as const;

export const DIVISIONS = [1, 2, 3] as const;

/**
 * A faithful port of `is_higher_rank(rank1, rank2)`, which answers "is rank2
 * higher than rank1?" — note the argument order, which reads backwards.
 *
 * Radiant and Unrated are special-cased before any parsing, exactly as in the
 * original: Radiant beats everything, Unrated loses to everything.
 */
export function isHigherRank(rank1: string, rank2: string): boolean {
  if (rank2 === "Radiant") return true;
  if (rank2 === "Unrated") return false;

  const [tier1, div1] = rank1.split(" ");
  const [tier2, div2] = rank2.split(" ");

  const i1 = TIERS.indexOf(tier1 as (typeof TIERS)[number]);
  const i2 = TIERS.indexOf(tier2 as (typeof TIERS)[number]);

  if (i2 > i1) return true;
  if (i2 < i1) return false;

  if (Number(div2) > Number(div1)) return true;
  if (Number(div2) < Number(div1)) return false;

  // Equal tier and division: not higher.
  return false;
}

/** The act boundaries the script compares against, from `latestEA`. */
export const ACTS = ["e5a2", "e5a3", "e6a1", "e6a2", "e6a3"] as const;

const ACT_STARTS = [
  new Date("2022-10-17"),
  new Date("2023-01-09"),
  new Date("2023-03-06"),
  new Date("2023-06-10"),
];

/**
 * A port of `latestEA(dates)`: which act a date falls in, as an index into
 * ACTS. Rank only means something within an act, so a reading from a previous
 * act is stale and the report has to say so.
 */
export function actIndexFor(date: Date): number {
  for (let i = 0; i < ACT_STARTS.length; i++) {
    if (date < ACT_STARTS[i]) return i;
  }
  return ACT_STARTS.length;
}

/** A port of `getID(url)`: pulls name and tag out of a tracker URL. */
export function parseRiotId(url: string): { name: string; tag: string } | null {
  const nameMatch = url.match(/riot\/(.*?)(?=%23)/);
  const tagMatch = url.match(/%23(.*?)\//);
  if (!nameMatch || !tagMatch) return null;
  return {
    name: decodeURIComponent(nameMatch[1]),
    tag: tagMatch[1],
  };
}

export interface Student {
  name: string;
  startRank: string;
  currentRank: string;
  lastSeen: Date;
}

export type Verdict = "improved" | "same" | "dropped" | "stale";

/**
 * The report's actual decision. A reading from an earlier act is reported as
 * stale rather than compared — which is the distinction that made the original
 * write two files instead of one: students with usable data, and students whose
 * data cannot support a conclusion.
 */
export function verdictFor(student: Student, today: Date): Verdict {
  if (actIndexFor(student.lastSeen) < actIndexFor(today)) return "stale";
  if (isHigherRank(student.startRank, student.currentRank)) return "improved";
  if (isHigherRank(student.currentRank, student.startRank)) return "dropped";
  return "same";
}
