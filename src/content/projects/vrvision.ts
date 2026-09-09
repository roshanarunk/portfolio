import type { Project } from "@/lib/types";

export const vrvision: Project = {
  slug: "vrvision",
  title: "VRVision",
  tagline: "Augmented reality as an aid for low vision.",
  year: "2021–2023",
  tier: 1,
  featured: true,
  role: "Solo developer",
  collection: "coursework",
  tech: [
    { label: "Java", category: "language" },
    { label: "Android", category: "platform" },
    { label: "Google Cardboard", category: "platform" },
    { label: "OpenGL", category: "library" },
  ],
  repoUrl: "https://github.com/roshanarunk/VRVision",
  summary:
    "A Google Cardboard app that processes the phone camera feed in real time to make the world more legible for people with vision impairments.",
  longDescription: [
    "Built for my IB Diploma computer science coursework, where the brief was to find a real problem and solve it in code for an actual client rather than an imagined one.",
    "The app renders a stereoscopic camera feed through Google Cardboard and applies shader-based processing to it — adjusting contrast and colour so that detail someone would otherwise miss becomes visible. The rendering runs through OpenGL shaders because per-frame processing had to keep up with head movement to avoid motion sickness.",
    "The part I would carry into any project was consulting someone who actually lives with a vision impairment. It changed the design: what I assumed would help was not what was asked for.",
  ],
  highlights: [
    "Real-time stereoscopic camera processing through OpenGL shaders",
    "Designed around consultation with someone affected, not assumptions",
    "Shipped as an installable APK with a recorded walkthrough",
  ],
  demo: {
    kind: "video",
    title: "Walkthrough",
    instructions: "A recorded demo — the app needs a phone and a headset.",
    provider: "youtube",
    src: "--3jZ8fPymc",
    posterSrc: "/images/posters/vrvision.png",
    posterAlt: "VRVision running on a phone in a Cardboard headset",
    sourceUrl: "https://github.com/roshanarunk/VRVision",
    downloads: [
      {
        label: "Download the APK",
        href: "https://github.com/roshanarunk/VRVision/raw/main/Android/app/app-release.apk",
        note: "Android, sideload",
      },
    ],
  },
};
