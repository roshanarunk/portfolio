import type { Project } from "@/lib/types";

export const mangareader: Project = {
  slug: "mangareader",
  title: "Manga Reader",
  tagline: "A native iOS reader for comic archives.",
  year: "2024",
  tier: 2,
  featured: false,
  collection: "personal",
  tech: [
    { label: "Swift", category: "language" },
    { label: "iOS", category: "platform" },
    { label: "UIKit", category: "framework" },
  ],
  repoUrl: "https://github.com/roshanarunk/mangareader",
  summary:
    "An iOS app for reading CBZ and CBR comic archives, including a Quick Look extension so archives preview correctly in Files.",
  longDescription: [
    "I wanted to read downloaded manga on my phone without the archive-shaped friction that iOS puts in the way. The app opens comic archives directly and pages through them with the reading behaviour the format expects, including right-to-left.",
    "The piece I am most pleased with is the thumbnail extension. Comic archives show as generic file icons in the Files app; a Quick Look extension backed by a shared archive-reading framework makes them render their cover instead. Splitting that decoding into a shared target so both the app and the extension could use it was the interesting design problem.",
  ],
  highlights: [
    "Shared archive-decoding framework used by both the app and its extension",
    "Quick Look thumbnail extension for covers in the Files app",
    "The largest codebase here, iterated with a maintained changelog",
  ],
  demo: {
    kind: "gallery",
    title: "Screens",
    instructions: "iOS only — no browser equivalent exists.",
    images: [
      {
        src: "/images/gallery/mangareader/library.png",
        alt: "The manga reader library view showing comic covers",
        caption: "Library view with covers decoded from the archives.",
        width: 1170,
        height: 2532,
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/mangareader",
  },
};
