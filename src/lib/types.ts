/**
 * Core content model for the portfolio.
 *
 * Project data lives in typed TS files (src/content/projects/*) rather than MDX:
 * the metadata is highly structured, and live demos point at React components,
 * which is an import rather than markup. A typed schema fails the build on a
 * malformed entry instead of rendering something broken at runtime.
 */

export type Tier = 1 | 2 | 3;

export type TechCategory = "language" | "framework" | "library" | "tool" | "platform";

export interface TechTag {
  label: string;
  category: TechCategory;
}

/** Groups scattered repos into a single narrative on the landing page. */
export type Collection = "hooj" | "coursework" | "personal";

/**
 * Identifiers for interactive demos. Each must have a matching entry in
 * `demoRegistry` (src/components/demos/registry.ts) — enforced by a unit test.
 */
export type LiveDemoId =
  | "sudoku"
  | "valheatmap"
  | "league-ml"
  | "vrvision"
  | "cc3k"
  | "wattravl"
  | "atm"
  | "whj-student-update"
  | "gp2040";

/**
 * How a project is demonstrated. Not every project can run in a browser, so the
 * site supports a spectrum: a ported algorithm running live, an embedded site, a
 * video walkthrough, a screenshot gallery, or a pure writeup.
 */
export type DemoKind = "live" | "iframe" | "video" | "gallery" | "writeup";

interface DemoBase {
  kind: DemoKind;
  /** Heading shown in the DemoShell chrome. */
  title: string;
  /** One line telling the visitor what to try. */
  instructions?: string;
  /** Deep link to the exact source file being demonstrated. */
  sourceUrl?: string;
  /** Short claim shown as a badge, e.g. "Runs entirely in your browser". */
  badge?: string;
}

export interface LiveDemo extends DemoBase {
  kind: "live";
  componentId: LiveDemoId;
  /** How to degrade below the mobile breakpoint. Default: render as-is. */
  mobileFallback?: "scaled" | "static-image" | "blocked";
}

export interface IframeDemo extends DemoBase {
  kind: "iframe";
  src: string;
  aspectRatio: `${number}/${number}`;
  /** Click-to-load poster; the iframe stays out of the DOM until clicked. */
  posterSrc: string;
  posterAlt: string;
  sandbox?: string;
}

export interface VideoDemo extends DemoBase {
  kind: "video";
  provider: "youtube" | "mp4";
  /** YouTube video id, or a path under /videos for mp4. */
  src: string;
  posterSrc: string;
  posterAlt: string;
  downloads?: { label: string; href: string; note?: string }[];
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

export interface GalleryDemo extends DemoBase {
  kind: "gallery";
  images: GalleryImage[];
}

export interface CodeExcerpt {
  file: string;
  language: string;
  code: string;
  note: string;
}

export interface WriteupDemo extends DemoBase {
  kind: "writeup";
  excerpts?: CodeExcerpt[];
}

export type Demo = LiveDemo | IframeDemo | VideoDemo | GalleryDemo | WriteupDemo;

export interface Challenge {
  problem: string;
  solution: string;
}

export interface Project {
  slug: string;
  title: string;
  /** One line, used on cards. */
  tagline: string;
  year: string;
  tier: Tier;
  /** Featured projects appear on the landing page. */
  featured: boolean;
  role?: string;
  collection: Collection;
  tech: TechTag[];
  repoUrl?: string;
  liveUrl?: string;
  /** 1-2 sentences for the project page hero. */
  summary: string;
  longDescription: string[];
  highlights?: string[];
  challenges?: Challenge[];
  demo: Demo;
  /**
   * Card artwork for the landing-page carousel. Optional: a project without one
   * still renders, with the title block standing in for the image.
   *
   * Static export disables the Next image optimiser, so these are plain <img>
   * tags — give every entry real pixel dimensions or the card shifts as it
   * loads.
   */
  cardImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    /** Marks generated stand-ins so a real screenshot can replace them. */
    placeholder?: boolean;
  };
  /**
   * Set when the work is not original or not production-grade, so the site can
   * say so plainly rather than letting a recruiter discover it from the repo.
   */
  disclosure?: string;
}
