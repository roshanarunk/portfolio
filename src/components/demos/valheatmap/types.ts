export interface MatchPlayer {
  id: number;
  name: string;
  team: string;
  agent: string;
}

export interface Kill {
  round: number;
  /** Milliseconds since the round started. */
  t: number;
  killer: number;
  victim: number;
  /** Killer position in world coordinates. */
  kx: number;
  ky: number;
  /** Victim position in world coordinates. */
  vx: number;
  vy: number;
}

export interface Match {
  map: string;
  mapId: string;
  rounds: number;
  players: MatchPlayer[];
  kills: Kill[];
}

export interface MatchSummary {
  slug: string;
  map: string;
  rounds: number;
  kills: number;
}

export interface Filters {
  /**
   * Inclusive round range. Riot numbers rounds from 0, so this starts at 0 —
   * defaulting to 1 silently hides every kill from the first round.
   */
  roundFrom: number;
  roundTo: number;
  /** Player id, or null for everyone. */
  player: number | null;
  /** Team id, or null for both. */
  team: string | null;
}
