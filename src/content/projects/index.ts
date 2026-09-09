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
  subspleasio,
  valoLineup,
  mangareader,
  whjStudentUpdate,
  springbootCrud,
  atm,
  bankWebsite,
];

export const featuredProjects = projects.filter((p) => p.featured);

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
