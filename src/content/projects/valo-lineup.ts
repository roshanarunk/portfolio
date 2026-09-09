import type { Project } from "@/lib/types";

export const valoLineup: Project = {
  slug: "valo-lineup",
  title: "Lineup Tool",
  tagline: "A desktop overlay that reads the game and aims for you.",
  year: "2024",
  tier: 2,
  featured: false,
  collection: "hooj",
  tech: [
    { label: "Python", category: "language" },
    { label: "OpenCV", category: "library" },
    { label: "tkinter", category: "library" },
    { label: "Win32 API", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/ValoLineUpTool",
  summary:
    "An always-on-top overlay that detects the spike on the Valorant minimap, computes distance and angle from the player, and draws where to aim a utility throw.",
  longDescription: [
    "Valorant lineups are memorised: stand here, aim at that, throw. Learning them is tedious and they are easy to get subtly wrong. This computes one instead.",
    "The overlay screenshots the minimap region, finds the spike by colour, and works out the distance and bearing from the player's position. From there a per-agent, per-map multiplier converts that into a crosshair placement, drawn as a transparent always-on-top marker that follows the mouse.",
    "It is unapologetically Windows-only: global input hooks, live screen capture and Win32 calls for the click-through overlay window. That is also why it cannot be a web demo — the video is the honest way to show it.",
  ],
  highlights: [
    "Colour-based minimap detection with distance and bearing computation",
    "Per-agent and per-map calibration for Brimstone, Viper and KAY/O",
    "Click-through transparent overlay via Win32 interop",
  ],
  demo: {
    kind: "gallery",
    title: "In game",
    instructions: "The overlay running over live gameplay.",
    images: [
      {
        src: "/images/gallery/valo-lineup/overlay.png",
        alt: "The lineup overlay drawing an aim marker over the Valorant minimap",
        caption: "The marker updates live as the mouse moves.",
        width: 1280,
        height: 720,
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/ValoLineUpTool",
  },
};
