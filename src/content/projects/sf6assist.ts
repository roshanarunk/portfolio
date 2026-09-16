import type { Project } from "@/lib/types";

export const sf6assist: Project = {
  slug: "sf6assist",
  title: "SF6Assist",
  tagline: "A frame-accurate combo trainer that admits what it cannot verify.",
  year: "2026",
  tier: 1,
  featured: false,
  collection: "personal",
  tech: [
    { label: "Node.js", category: "platform" },
    { label: "ES modules", category: "language" },
    { label: "Cloudflare Workers", category: "platform" },
    { label: "Python", category: "language" },
    { label: "C++", category: "language" },
  ],
  repoUrl: "https://github.com/roshanarunk/SF6Assist",
  summary:
    "Build a Street Fighter 6 combo from a character's real movelist, have every transition checked against the game's actual cancel rules, then drill the timing while it grades each input against the frame data.",
  longDescription: [
    "Street Fighter 6 combos live or die on single frames, and the usual way to learn one is to guess at a video and repeat it until it works. This checks the combo before you practise it: you assemble a sequence from a character's real movelist, and each transition is validated against the frame data rather than against someone's memory.",
    "The frame data is the foundation. A build step fetches and normalises the numbers for all 32 characters into roughly 5 MB of JSON, so validation runs against the real startup, active and recovery values instead of approximations.",
    "Once a combo checks out, the trainer drills it. Audio cues mark when each input is due, and every attempt is graded PERFECT, EARLY or LATE with the frame delta, so what you correct is a specific number rather than a vague feeling. A frame meter draws one bar per frame in the game's own training-mode language — green startup, red active, blue recovery — with a playhead tracking the run.",
    "The browser app is 37 ES modules with no build step and no dependencies, served on bare Node and deployed to Cloudflare Workers. Two earlier native prototypes are still in the repository: a Python version built on tkinter and pygame, and a Windows C++ one using XInput with an optional DirectX 11 overlay.",
  ],
  highlights: [
    "Real frame data for all 32 characters, normalised into ~5 MB of JSON",
    "Every transition badged legal, illegal, or unverifiable — never guessed",
    "Inputs graded PERFECT / EARLY / LATE with the frame delta",
    "Frame meter in SF6 training-mode colours, with a playhead",
    "37 ES modules, no build step, no dependencies",
  ],
  challenges: [
    {
      problem:
        "Frame data does not describe every situation. Juggle state, counterhit, spacing and Drive Rush all change whether a link works, and none of them are in the dataset. A validator that answers legal or illegal for those cases is lying.",
      solution:
        "A third verdict. When a required field is missing the result is `unverifiable` with the reason attached, never `illegal` — absence of data is not evidence of illegality. The badge tells you the tool cannot answer, which is more useful than a confident wrong answer.",
    },
    {
      problem:
        "Timing grades were accurate to about one or two frames, and the obvious fix was a calibration setting to let users dial out their own latency.",
      solution:
        "It would not have helped, so it was not built. The error is phase noise between two unsynchronised 60 Hz samplers — the game's frame clock and the input poll — not a constant offset. A fixed adjustment cannot correct a varying one, and the README explains why rather than shipping a setting that appears to work.",
    },
  ],
  demo: {
    kind: "writeup",
    title: "Never claiming more certainty than the data supports",
    instructions: "How an unverifiable transition is reported.",
    excerpts: [
      {
        file: "core/cancel.mjs",
        language: "javascript",
        code: `/*
 * The guiding rule: never claim more certainty than the data supports.
 * Absence of data is not evidence of illegality, so a missing field yields
 * \`unverifiable\`, never \`illegal\`.
 */

if (adv === null || startupB === null) {
  return {
    kind: "unverifiable",
    reason:
      adv === null
        ? \`Cannot read frame advantage for \${a.name}.\`
        : \`Cannot read startup for \${b.name}.\`,
    timing: linkWindow(a, b),
    confidence: "low",
    caveats,
  };
}

// Frame advantage +N means B may start on the frame after A's recovery,
// giving an N+1 frame window. Keep this convention consistent everywhere.
if (adv >= 0 && startupB <= adv + 1) {`,
        note: "The validator has three verdicts rather than two. A missing field means the dataset cannot express the situation — juggle state, counterhit, spacing — so it says so and attaches the reason, instead of resolving the gap into a confident answer.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/SF6Assist/blob/main/core/cancel.mjs",
  },
};
