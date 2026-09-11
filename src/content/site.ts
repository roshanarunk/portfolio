/**
 * Single source of truth for identity and contact details.
 * TODO(roshan): confirm email, LinkedIn and resume before launch.
 */
export const site = {
  name: "Roshan Arun Kumar",
  shortName: "Roshan",
  role: "Software Engineer",
  tagline: "I build tools people actually use.",
  intro:
    "Software engineer working across full-stack web, machine learning and mobile. " +
    "Most of what I have built started as a problem someone I knew actually had.",
  // Canonical origin: feeds metadataBase, sitemap.xml and robots.txt.
  url: "https://roshanarun.com",
  email: "roshan.arun.k@gmail.com",
  github: "https://github.com/roshanarunk",
  githubUser: "roshanarunk",
  // TODO(roshan): add your LinkedIn URL.
  linkedin: "",
  // TODO(roshan): drop resume.pdf into public/ to enable this link.
  resume: "/resume.pdf",
} as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const;
