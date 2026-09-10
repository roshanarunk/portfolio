import type { Project } from "@/lib/types";

export const subspleasio: Project = {
  slug: "subspleasio",
  title: "Subspleasio",
  tagline: "A streaming addon that finds the good release, not just any release.",
  year: "2026",
  tier: 2,
  featured: false,
  collection: "personal",
  tech: [
    { label: "Node.js", category: "platform" },
    { label: "Express", category: "framework" },
    { label: "Stremio SDK", category: "library" },
    { label: "Real-Debrid API", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/Subspleasio",
  summary:
    "A Stremio addon that resolves an anime episode across three sources, checks a debrid service for what is already cached, and hands back a direct stream.",
  longDescription: [
    "Watching anime through Stremio meant picking between releases with no way to tell which was actually worth playing. Some are re-encodes, some have the wrong subtitle track, and the only signal is a filename. This resolves that automatically.",
    "It queries three sources for a given episode and merges them: SubsPlease for current-season releases, SeaDex for the community's record of which release of a given show is preferred, and nekoBT as a fallback for older titles. SeaDex is the source that makes it worth building — it encodes the answer to 'which of these fifteen files is the good one', which no filename ever tells you.",
    "Each candidate is then checked against Real-Debrid, which returns a direct HTTPS link for anything already cached. Streams that would need waiting are filtered out, so the list Stremio shows is only what plays immediately. It runs as a small Express server with a system-tray wrapper so it can sit in the background on a desktop.",
  ],
  highlights: [
    "Merges three sources, preferring the release SeaDex records as best",
    "Filters on Real-Debrid cache state, so every listed stream plays instantly",
    "Credentials travel in the URL path, so the server stores no user secrets",
    "Backward-compatible routes: the older single-token URL still works",
  ],
  challenges: [
    {
      problem:
        "An addon needs each user's Real-Debrid token, and storing other people's API tokens on a server I run is a liability I did not want.",
      solution:
        "The token is a path segment in the addon URL, so Stremio supplies it on every request and the server keeps nothing between calls. Adding a second source later meant adding a second segment, with the one-segment route left in place so existing installs kept working.",
    },
    {
      problem:
        "Any of the three sources can be slow or down, and a stream request that waits on all of them is worse than one that returns fewer results.",
      solution:
        "Sources are queried together and failures degrade to an empty list rather than an error, so one dead source costs a few options instead of the whole response.",
    },
  ],
  demo: {
    kind: "writeup",
    title: "Keeping credentials out of the server",
    instructions: "Why the token lives in the URL.",
    excerpts: [
      {
        file: "index.js",
        language: "javascript",
        code: `// Two-segment: /:rdToken/:nekobtKey/ — includes nekoBT results
app.get('/:rdToken/:nekobtKey/stream/:type/:id.json', async (req, res) => {
  const { rdToken, nekobtKey, type, id } = req.params;
  try {
    const result = await handleStream({ type, id, rdToken, nekobtKey });
    res.json(result);
  } catch (err) {
    res.json({ streams: [] });   // a dead source costs options, not the response
  }
});`,
        note: "Stremio replays whatever URL it was installed with, so the token arrives per request and is never persisted. The single-segment route below it keeps older installs working.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/Subspleasio/blob/main/index.js",
  },
};
