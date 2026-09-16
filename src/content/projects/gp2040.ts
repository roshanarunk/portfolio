import type { Project } from "@/lib/types";

export const gp2040: Project = {
  slug: "gp2040",
  title: "GP2040-CE Hall Effect Triggers",
  tagline: "Rapid trigger and guided calibration for analogue switches, in firmware.",
  year: "2026",
  tier: 1,
  featured: false,
  collection: "personal",
  tech: [
    { label: "C++", category: "language" },
    { label: "TypeScript", category: "language" },
    { label: "React", category: "framework" },
    { label: "Raspberry Pi Pico", category: "platform" },
    { label: "Protobuf", category: "library" },
  ],
  repoUrl: "https://github.com/roshanarunk/GP2040-CE/tree/feature/he-trigger-overhaul",
  summary:
    "A hall effect trigger overhaul for the GP2040-CE gamepad firmware: rapid trigger v2, a guided calibration wizard, per-profile actuation, and a live switch monitor — about 4,000 lines across the C++ firmware and its React config UI.",
  longDescription: [
    "GP2040-CE is open-source gamepad firmware for RP2040 boards. A hall effect switch reports analogue travel rather than a simple pressed or not-pressed, so the firmware has to decide what counts as a keypress — and that decision is the whole feel of the controller.",
    "This branch reworks how that decision is made. Rapid trigger measures a press from wherever the finger last reversed rather than from a fixed depth, so a partial release followed by a partial press re-fires without returning to rest. That is the behaviour competitive players want, and getting it right means handling the cases where naive implementations break.",
    "Around the state machine sits the configuration work it needs to be usable: a guided calibration wizard that sweeps each switch through its travel, per-profile actuation and sensitivity overrides, a live monitor showing what every switch reads in real time, and profiles that can be copied between slots or exported as codes. The UI is React inside the firmware's existing web config.",
    "It is a fork rather than a merged contribution, on the `feature/he-trigger-overhaul` branch: nineteen commits, eighteen files, roughly 4,000 lines added across the firmware and the config UI.",
  ],
  highlights: [
    "Rapid trigger v2: presses measured from the last reversal, not a fixed depth",
    "Guided calibration wizard that sweeps each switch through its travel",
    "Per-profile actuation and sensitivity, overridable per channel",
    "Live switch monitor, and profiles copyable between slots or as codes",
    "~4,000 lines across C++ firmware and the React web config",
  ],
  challenges: [
    {
      problem:
        "A finger resting near the actuation point makes sensor noise cross the threshold repeatedly. Each crossing disarmed and rearmed the rapid trigger zone, which reads to the player as the button flickering on and off.",
      solution:
        "The disarm point sits one noise width below the actuation point rather than exactly on it. That gap means noise around the threshold cannot straddle the boundary, so a hovering finger holds its state instead of chattering.",
    },
    {
      problem:
        "A slow, noisy press contains many tiny reversals. Resetting the opposite extremum on each one kept pushing the trough up, so the press never accumulated enough travel to fire — the key simply would not actuate when pressed gently.",
      solution:
        "The opposite extremum is clamped to at most one sensitivity away rather than reset outright. Micro-reversals become free, while a genuine reversal still re-datums the next movement. Both behaviours are covered by the tests behind the demo above.",
    },
  ],
  demo: {
    kind: "live",
    componentId: "gp2040",
    title: "The rapid trigger state machine",
    instructions:
      "Move the switch by hand, or play a trace. Toggle rapid trigger to compare against plain actuation.",
    badge: "Ported from the firmware",
    sourceUrl:
      "https://github.com/roshanarunk/GP2040-CE/blob/feature/he-trigger-overhaul/src/addons/he_trigger.cpp",
  },
};
