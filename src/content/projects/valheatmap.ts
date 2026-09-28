import type { Project } from "@/lib/types";

export const valheatmap: Project = {
  slug: "valheatmap",
  title: "ValHeatMap",
  tagline: "Spatial Valorant analytics over 245,000 matches and 36 million kills.",
  year: "2023–2026",
  tier: 1,
  featured: false,
  collection: "hooj",
  tech: [
    { label: "Python", category: "language" },
    { label: "FastAPI", category: "framework" },
    { label: "React", category: "framework" },
    { label: "TypeScript", category: "language" },
    { label: "SQLite", category: "tool" },
    { label: "Riot API", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/ValHeatMap",
  liveUrl: "https://valostats.roshanarun.com/",
  summary:
    "Started as a Flask tool that plotted one match's kills for a coaching team; now a hosted analytics site over roughly 245,000 matches and 36 million kills, showing the stats trackers don't — where a player dies untraded, and which plant spot actually wins the round.",
  longDescription: [
    "Coaching conversations kept stalling on memory: nobody could agree on where a round had been lost. The first version turned a single match into a picture — a match ID in, every kill plotted onto the minimap out, using per-map coordinate transforms because Valorant reports world positions with a different origin and scale for every map.",
    "It has since grown into a hosted analytics site. A crawler has collected roughly 245,000 matches and 36 million kills into SQLite, served by a FastAPI backend to a React and TypeScript frontend. The point is the stats tracker sites don't show: sites like tracker.gg give a player's K/D, not where on Ascent they keep dying untraded, or which plant position actually wins the round.",
    "The analysis is built to stay honest at that scale. Heatmap density accumulates into a float grid rather than canvas pixels, because canvas alpha clamps at 1.0 and twenty thousand points would saturate every busy area into a white blob before it could be normalised. Plant win rates are computed per clustered spot, and any spot below the sample threshold is drawn dashed and greyed rather than presented as fact.",
    "The demo below is the original tool's core, running offline on six recorded matches, so it loads instantly and never depends on the server. The full site is linked above.",
  ],
  highlights: [
    "~245,000 matches and 36 million kills, crawled and served live",
    "Trade detection with adjustable time and distance windows",
    "Plant-spot win rates, with thin samples greyed out rather than shown as fact",
    "Utility damage resolved to real ability names from Riot's slot IDs",
    "Density accumulated in a float grid, so hotspots survive normalisation",
  ],
  challenges: [
    {
      problem:
        "The live site began returning 503s, worst on the personal-stats page. Three separate causes produced the same symptom, which made the first fix look like it had not worked.",
      solution:
        "Traced each one. A facet cache rebuild scanned millions of kill rows with no supporting index — measured at 139 seconds — and starved the API on a shared vCPU; an index and an owned query thread pool fixed that and a request-handler blocking bug. The third was a genuine hardware ceiling, disk I/O contention between the crawler and the API, so the crawler now backs off on measured query latency and throttles during quiet hours. The write-up says plainly which parts were fixed and which were only mitigated.",
    },
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
