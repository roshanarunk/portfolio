/**
 * Single source of truth for identity and contact details.
 * TODO(roshan): drop resume.pdf into public/ to enable the resume link.
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
  linkedin: "https://www.linkedin.com/in/roshan-arun-kumar/",
  // TODO(roshan): drop resume.pdf into public/ to enable this link.
  resume: "/resume.pdf",
} as const;

export interface Role {
  company: string;
  title: string;
  /** Shown right-aligned, as a term rather than exact dates. */
  period: string;
  /** Logo in public/images/logos. Omit to fall back to a monogram. */
  logo?: string;
  /** Sort key only; never rendered. */
  start: string;
}

/**
 * Employment, newest first. Logos were fetched from each company's own
 * favicon; Home Depot and Loblaw Digital were only available at 32px, so they
 * render softer than the rest.
 */
export const experience: Role[] = [
  {
    company: "AltaML",
    title: "Associate Software Developer",
    period: "Fall 2024",
    logo: "/images/logos/altaml.png",
    start: "2024-09",
  },
  {
    company: "Ford Pro",
    title: "Software Engineer",
    period: "Summer 2023",
    logo: "/images/logos/ford.jpg",
    start: "2023-05",
  },
  {
    company: "Loblaw Digital",
    title: "Software Developer",
    period: "Fall 2022",
    logo: "/images/logos/loblaw-digital.png",
    start: "2022-09",
  },
  {
    company: "Home Depot Canada",
    title: "Software Developer",
    period: "Winter 2022",
    logo: "/images/logos/home-depot.png",
    start: "2022-01",
  },
  {
    company: "AdvanceAI",
    title: "Software Engineering Intern",
    period: "Summer 2018",
    logo: "/images/logos/advanceai.png",
    start: "2018-06",
  },
];

export const nav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const;
