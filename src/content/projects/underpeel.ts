import type { Project } from "@/lib/types";

export const underpeel: Project = {
  slug: "underpeel",
  title: "Underpeel",
  tagline: "A tournament site for a Valorant league, still live today.",
  year: "2023",
  tier: 1,
  featured: true,
  role: "Designer and developer",
  collection: "hooj",
  tech: [
    { label: "React", category: "framework" },
    { label: "Vite", category: "tool" },
    { label: "Tailwind CSS", category: "framework" },
    { label: "Firebase", category: "platform" },
  ],
  repoUrl: "https://github.com/roshanarunk/underpeelsite",
  liveUrl: "https://roshanarunk.github.io/underpeelsite/",
  summary:
    "The public site for Underpeel, a Valorant league I helped run: team rosters, player ranks and season structure, built and iterated over 18 commits.",
  longDescription: [
    "Underpeel needed somewhere to point players that was not a Discord message. The site presents each team, its roster and every player's rank, with the art and rank iconography a Valorant audience expects to see.",
    "It went through two design passes. The first shipped and is still live; a second version moved to Vite, Tailwind and daisyUI with a Firebase backend so seasons could be managed without a redeploy. Version three exists as a Figma file — the design work was done before the build, which is the part of the process I would keep.",
    "This is the project that taught me the difference between finishing something and shipping it. It had real users on a deadline, which meant choosing what not to build.",
  ],
  highlights: [
    "Live and in use — the most iterated project I have shipped",
    "Rank and roster data structured so a season could be updated without code changes",
    "Design-first workflow: Figma mockups drove the second and third revisions",
  ],
  demo: {
    kind: "iframe",
    title: "The live site",
    instructions: "Loads the deployed site in a sandboxed frame.",
    src: "https://roshanarunk.github.io/underpeelsite/",
    aspectRatio: "16/10",
    posterSrc: "/images/posters/underpeel.png",
    posterAlt: "The Underpeel league site showing team rosters",
    sourceUrl: "https://github.com/roshanarunk/underpeelsite",
  },
};
