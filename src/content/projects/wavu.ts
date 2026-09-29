import type { Project } from "@/lib/types";

export const wavu: Project = {
  slug: "wavu",
  title: "Wavu",
  tagline: "A 3D Tekken-style fighter with rollback netcode, playable in the browser.",
  year: "2026",
  tier: 1,
  collection: "personal",
  tech: [
    { label: "C#", category: "language" },
    { label: "Unity", category: "framework" },
    { label: "WebGL", category: "platform" },
    { label: "WebRTC", category: "platform" },
    { label: "Cloudflare Workers", category: "platform" },
  ],
  liveUrl: "https://wavu.roshanarun.com/",
  disclosure:
    "The repository is private. The game itself is public and playable below.",
  summary:
    "A 3D fighter built around the Mishima Wind God Step, with a fully deterministic fixed-point simulation, GGPO-style rollback netcode, and a browser build whose online play runs peer to peer over WebRTC.",
  longDescription: [
    "Wavu is a Tekken-style 3D fighter built around one of the genre's hardest techniques, the Mishima Wind God Step. Unity renders it, but Unity does not run the fight: the match is a separate simulation package with no engine dependency, and the game only draws what that simulation says.",
    "That split exists because of rollback netcode. When a remote input arrives late, the game rewinds to the frame it applies to and re-simulates forward, possibly several times a second. That only works if the simulation is perfectly deterministic, so every number in it is Q47.16 fixed point — the only non-trivial function is an integer square root — and a full match state can be cloned, restored and checksummed.",
    "Rendering follows the same rule. Unity's Animator never runs on its own clock; every frame, a fighter's pose is sampled as \"clip X at frame N\" from the simulation state. A rollback therefore always shows the correct pose, and the animations are authored so that a correction a few frames late reads as a slightly quicker start rather than a teleport.",
    "The browser build plays the same as the desktop one, including online. Browsers cannot open UDP sockets, so a Cloudflare Worker pairs players by lobby code — each lobby is a Durable Object — and passes the WebRTC handshake between them. Game packets then travel directly between the two browsers over an unordered, unreliable data channel, falling back to a relay only when a direct path is impossible.",
  ],
  highlights: [
    "Deterministic Q47.16 fixed-point simulation with no engine dependency",
    "GGPO-style rollback: input prediction, resimulation, desync checksums",
    "Netcode tested over a simulated network with jitter and 15% packet loss",
    "Browser online play over WebRTC, paired by a Durable Object lobby server",
    "Desktop and browser players can play each other through the same lobbies",
  ],
  challenges: [
    {
      problem:
        "Rollback means a frame may be simulated, thrown away and re-simulated with corrected inputs. Any floating-point maths, engine physics or animation clock would let two machines drift apart and desync.",
      solution:
        "The simulation is its own package with no UnityEngine dependency, all in Q47.16 fixed point, and `Battle.Tick` is the only way state advances. The only thing sent over the network is six bits of controller state per frame, and exchanged checksums catch a desync the moment it happens.",
    },
    {
      problem:
        "After a rollback, a fighter's pose can jump straight to frame N of what it is really doing, which reads as a teleport.",
      solution:
        "Poses are sampled from simulation state rather than played by the Animator, and moves are authored to stay close to their starting pose for the first two or three frames. A correction that lands inside that window looks like a slightly quicker start.",
    },
  ],
  demo: {
    kind: "iframe",
    cardLabel: "Playable here",
    src: "https://wavu.roshanarun.com/",
    aspectRatio: "16/9",
    posterSrc: "/images/posters/wavu.png",
    posterAlt:
      "The Wavu title screen: two stick-figure fighters facing each other either side of a menu with Practice, Versus CPU, Versus Player, Online and Controls.",
    title: "The game itself",
    instructions:
      "The real WebGL build. Keyboard: WASD to move, U and I to attack. Gamepads work too.",
    badge: "Playable",
  },
};
