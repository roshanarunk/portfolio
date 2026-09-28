import type { Project } from "@/lib/types";

export const fundies: Project = {
  slug: "fundies",
  title: "Fundies",
  tagline:
    "A Footsies-like 2D fighter with rollback netcode and a 356-test simulation.",
  year: "2026",
  tier: 1,
  featured: false,
  collection: "personal",
  tech: [
    { label: "C#", category: "language" },
    { label: "Godot", category: "framework" },
    { label: ".NET", category: "platform" },
    { label: "Cloudflare Workers", category: "platform" },
  ],
  disclosure:
    "The repository is private, and the game ships as desktop and mobile builds rather than for the web. The input engine below is its real code, ported.",
  summary:
    "A 2D fighting game about spacing, hit confirms and whiff punishes, with rollback netplay, an engine-free deterministic simulation, and a Capcom-style motion-input engine you can try below.",
  longDescription: [
    "Fundies is a Footsies-like 2D fighter: spacing, hit confirms, whiff punishes and committed special moves, with fireballs and jumping added. Each fighter has 100 HP, there is no guard break, and a fireball parry restores a little health.",
    "The architecture follows from one fact: rollback netcode means the simulation gets re-run. So `Simulation.Step` is a pure function over a flat `GameState` struct with no references or collections — no wall-clock time, no floats, no engine calls, no unseeded randomness. Snapshotting a frame is a plain assignment, which is what makes saving state every single frame affordable. Godot only renders and polls input; it does not simulate.",
    "The same discipline reaches the art. A pose is a pure function of the fighter's state and state frame, so rewinding the frame rewinds the drawing for free. Poses are chunky and held so a two-to-five frame correction usually lands inside one, and cosmetic effects are fire-and-forget events that are suppressed during resimulation.",
    "The motion engine follows a published SF6 input reference: eleven-frame quarter-circle segments, a lenient seven-frame DP, exhaustive matching through intervening inputs, and a five-frame action buffer. Online play is peer to peer, with room codes and IP discovery handled by a small Cloudflare Worker.",
  ],
  highlights: [
    "Pure `Simulation.Step` over a flat struct: snapshotting a frame is an assignment",
    "356 tests: determinism, gameplay, rollback and two-peer desync",
    "Capcom-style motion input, checked against its own test vectors",
    "Poses derived from state, so rollback corrects the drawing for free",
    "Room-code matchmaking on a Cloudflare Worker for peer-to-peer netplay",
  ],
  challenges: [
    {
      problem:
        "Godot's skeleton, AnimationPlayer, physics, timers and tweens all advance on the engine's own clock and cannot be rewound, so none of them can be allowed to affect a rollback game.",
      solution:
        "The engine does not simulate. The fight is plain C# over fixed-point numbers, and every pose is computed from the snapshot each frame — the same boundary Footsies itself uses, with Unity in its case rather than Godot.",
    },
    {
      problem:
        "A strict motion reader rejects inputs players consider clean, and a loose one fires specials by accident — especially a DP out of a walking fireball.",
      solution:
        "Direction history is stored as runs and matched exhaustively within per-segment windows, so intervening inputs are tolerated and an older valid diagonal is still found. Returning through back and down to forward is read as an intentional fireball, so a walking fireball does not come out as a DP.",
    },
  ],
  demo: {
    kind: "live",
    componentId: "fundies",
    title: "The motion-input engine",
    instructions:
      "Click the panel, then use the arrows or WASD and press J. Or play a scripted input.",
    badge: "Ported from the game",
  },
};
