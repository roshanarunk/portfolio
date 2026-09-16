import type { Project } from "@/lib/types";
import { sudoku } from "./sudoku";
import { underpeel } from "./underpeel";
import { leagueMl } from "./league-ml";
import { valheatmap } from "./valheatmap";
import { vrvision } from "./vrvision";
import { valoLineup } from "./valo-lineup";
import { mangareader } from "./mangareader";
import { whjStudentUpdate } from "./whj-student-update";
import { springbootCrud } from "./springboot-crud";
import { atm } from "./atm";
import { bankWebsite } from "./bank-website";
import { wattravl } from "./wattravl";
import { cc3k } from "./cc3k";
import { subspleasio } from "./subspleasio";
import { sf6assist } from "./sf6assist";

/**
 * Ordered by tier, then by how much each project shows. This is the order the
 * projects page renders, so it is also the order a visitor reads them in.
 */
export const projects: Project[] = [
  sudoku,
  underpeel,
  leagueMl,
  valheatmap,
  vrvision,
  wattravl,
  cc3k,
  sf6assist,
  subspleasio,
  valoLineup,
  mangareader,
  whjStudentUpdate,
  springbootCrud,
  atm,
  bankWebsite,
];

/**
 * Three, not six. Six equally-weighted cards is the classic paralysis count and
 * gives a visitor no first choice; the rest live on /projects. Order is
 * deliberate: the lead card is the one that proves the site's claim fastest.
 */
/**
 * Three, not six: six equally-weighted cards gives a visitor no first choice.
 * The `featured` flag decides membership; this order decides which leads, and
 * the lead is whichever project proves the site's claim fastest.
 */
const FEATURED_ORDER = ["cc3k", "league-ml", "underpeel"];

export const featuredProjects = projects
  .filter((p) => p.featured)
  .sort((a, b) => FEATURED_ORDER.indexOf(a.slug) - FEATURED_ORDER.indexOf(b.slug));

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Projects belonging to the HOOJ coaching org, told as one story. */
export const hoojProjects = projects.filter((p) => p.collection === "hooj");

/** Every distinct tech label, for the projects page filter. */
export function allTechLabels(): string[] {
  const labels = new Set<string>();
  for (const project of projects) {
    for (const tech of project.tech) labels.add(tech.label);
  }
  return [...labels].sort();
}
