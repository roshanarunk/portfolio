import type { Project } from "@/lib/types";

export const bankWebsite: Project = {
  slug: "bank-website",
  title: "HooBank Landing Page",
  tagline: "A styling exercise in modern Tailwind layout.",
  year: "2023",
  tier: 3,
  featured: false,
  collection: "personal",
  tech: [
    { label: "React", category: "framework" },
    { label: "Vite", category: "tool" },
    { label: "Tailwind CSS", category: "framework" },
  ],
  repoUrl: "https://github.com/roshanarunk/BankWebsite",
  summary:
    "A polished fintech marketing page built by following the JavaScript Mastery HooBank tutorial, as deliberate practice with Tailwind and responsive layout.",
  longDescription: [
    "This one is a tutorial build, not original product design, and it is on the site labelled as such — a recruiter who opens the repo would spot it immediately, and pretending otherwise would be worse than including it.",
    "What I took from it was Tailwind's composition model and how a design system holds together across a dozen sections: consistent spacing, gradient treatment and typographic scale. That is the vocabulary this portfolio is built with.",
  ],
  disclosure:
    "Built by following the JavaScript Mastery HooBank tutorial. Included as a styling exercise, not as original design work.",
  demo: {
    kind: "writeup",
    title: "What I took from it",
    excerpts: [
      {
        file: "src/style.js",
        language: "javascript",
        code: `const styles = {
  boxWidth: "xl:max-w-[1280px] w-full",
  heading2: "font-poppins font-semibold text-[48px] leading-[66.8px]",
  paragraph: "font-poppins font-normal text-dimWhite text-[18px]",
};`,
        note: "Centralising the type and spacing scale keeps a dozen sections visually consistent — the habit that carried into this site.",
      },
    ],
    sourceUrl: "https://github.com/roshanarunk/BankWebsite",
  },
};
