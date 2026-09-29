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
import { gp2040 } from "./gp2040";
import { wavu } from "./wavu";
import { fundies } from "./fundies";

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
  wavu,
  fundies,
  gp2040,
  subspleasio,
  valoLineup,
  mangareader,
  whjStudentUpdate,
  springbootCrud,
  atm,
  bankWebsite,
];

/**
 * The landing page's "Run one now" row: a fixed, curated set rather than a
 * random draw. A random sample could land on three projects with nothing to
 * run, which left the page's central claim unproven for that visitor. Sudoku is
 * absent because the hero already runs it.
 *
 * `action` names what the visitor does; `input` says what it needs, so a phone
 * visitor can pick one that works without a keyboard.
 */
export interface RunNowItem {
  slug: string;
  action: string;
  input: string;
}

export const RUN_NOW: RunNowItem[] = [
  { slug: "cc3k", action: "Play the roguelike", input: "Keyboard or touch" },
  { slug: "league-ml", action: "Predict a game at 14 minutes", input: "Sliders" },
  { slug: "valheatmap", action: "Filter 667 real kills", input: "Tap or click" },
  { slug: "vrvision", action: "Run the app's shaders", input: "Webcam optional" },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** The Underpeel community's tooling, told as one story on the landing page. */
export const hoojProjects = projects.filter((p) => p.collection === "hooj");
