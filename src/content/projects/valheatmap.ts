import type { Project } from "@/lib/types";

export const valheatmap: Project = {
  slug: "valheatmap",
  title: "Valorant Kill Map",
  tagline: "Where rounds are actually won, plotted from match data.",
  year: "2023",
  tier: 1,
  featured: true,
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
    "Filtering by player, team, side and round to isolate a single pattern",
    "Sample matches committed to the repo, so the tool runs without an API key",
  ],
  demo: {
    kind: "live",
    componentId: "valheatmap",
    title: "Explore a real match",
    instructions: "Pick a map and filter down to a player or a round.",
    badge: "Real match data",
    mobileFallback: "scaled",
    sourceUrl: "https://github.com/roshanarunk/ValHeatMap/blob/main/utils.py",
  },
};
