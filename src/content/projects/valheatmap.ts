import type { Project } from "@/lib/types";

export const valheatmap: Project = {
  slug: "valheatmap",
  title: "Valorant Kill Map",
  tagline: "Where rounds are actually won, plotted from match data.",
  year: "2023",
  tier: 1,
  featured: false,
  collection: "hooj",
  tech: [
    { label: "Python", category: "language" },
    { label: "Flask", category: "framework" },
    { label: "matplotlib", category: "library" },
    { label: "Riot API", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/ValHeatMap",
  summary:
    "A Flask service that pulls a Valorant match and plots every kill onto the map — killer, victim and the line between them — so a team can see its own patterns.",
  longDescription: [
    "Coaching conversations kept stalling on memory: nobody could agree on where a round had been lost. This turns a match into a picture. It takes a match ID, pulls the full kill feed, and maps each engagement onto the minimap using per-map coordinate transforms.",
    "The unglamorous part was the coordinate work. Valorant reports positions in world space with a different origin and orientation per map, so each needs its own multiplier and offset to line up with the minimap image — Split, for instance, is scaled to a fifth of the others.",
    "Filters were what made it useful in practice: narrow to one player, one side, or a round range and the pattern of a team's defaults becomes obvious in a way a VOD review never quite delivers.",
  ],
  highlights: [
    "Per-map coordinate transforms mapping world space onto minimap images",
    "Filtering by player, team and round to isolate a single pattern",
    "Sample matches committed to the repo, so the tool runs without an API key",
    "667 real kills across six matches, plotted client-side with no backend",
  ],
  challenges: [
    {
      problem:
        "The raw match files are about 3.7MB, almost all of it damage, economy and ability records the map never draws. Shipping them as-is would make the demo slower to load than the analysis is worth.",
      solution:
        "A build step reduces each match to its kill feed and roster: 3.7MB becomes 58KB. It also handles both Riot API schema versions, since the older sample matches identify players by `subject` where newer ones use `puuid`.",
    },
    {
      problem:
        "Rebuilding the filters in the browser, I defaulted the round range to start at 1 and quietly lost every pistol-round kill.",
      solution:
        "Riot numbers rounds from 0. A test asserting the unfiltered plot shows every kill in the file caught it — the kind of off-by-one that looks like plausible data rather than a bug.",
    },
  ],
  demo: {
    kind: "live",
    componentId: "valheatmap",
    title: "Explore a real match",
    instructions: "Pick a map, then filter to a player or a range of rounds.",
    badge: "Real match data",
    mobileFallback: "scaled",
    sourceUrl: "https://github.com/roshanarunk/ValHeatMap/blob/main/utils.py",
  },
};
