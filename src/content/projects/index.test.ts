import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projects, getProject, featuredProjects } from "./index";

const PUBLIC_DIR = join(process.cwd(), "public");

/** Resolves a site-absolute asset path to a file on disk. */
function assetExists(src: string) {
  if (src.startsWith("http")) return true; // external, not our concern here
  return existsSync(join(PUBLIC_DIR, src.replace(/^\//, "")));
}

/** Every local asset path a project references. */
function assetPaths(): { project: string; src: string }[] {
  const paths: { project: string; src: string }[] = [];
  for (const project of projects) {
    const { demo } = project;
    if (demo.kind === "gallery") {
      for (const image of demo.images)
        paths.push({ project: project.slug, src: image.src });
    }
    if (demo.kind === "iframe" || demo.kind === "video") {
      paths.push({ project: project.slug, src: demo.posterSrc });
    }
    // Carousel artwork: a missing file would ship as a broken image.
    if (project.cardImage) {
      paths.push({ project: project.slug, src: project.cardImage.src });
    }
  }
  return paths;
}

describe("project content", () => {
  it("has unique slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe slugs", () => {
    for (const project of projects) {
      expect(project.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("can look up every project by slug", () => {
    for (const project of projects) {
      expect(getProject(project.slug)).toBe(project);
    }
  });

  it("gives every project the content a page needs", () => {
    for (const project of projects) {
      expect(project.title, project.slug).toBeTruthy();
      expect(project.tagline, project.slug).toBeTruthy();
      expect(project.summary, project.slug).toBeTruthy();
      expect(project.longDescription.length, project.slug).toBeGreaterThan(0);
      expect(project.tech.length, project.slug).toBeGreaterThan(0);
      expect(project.demo.title, project.slug).toBeTruthy();
    }
  });

  it("points every repo link at Roshan's GitHub", () => {
    for (const project of projects) {
      if (!project.repoUrl) continue;
      expect(project.repoUrl, project.slug).toMatch(
        /^https:\/\/github\.com\/roshanarunk\//,
      );
    }
  });

  /**
   * A project with no repository link is private, and a visitor should be told
   * why rather than left wondering where the code is.
   */
  it("explains why a project has no public repository", () => {
    for (const project of projects) {
      if (project.repoUrl) continue;
      expect(project.disclosure, project.slug).toBeTruthy();
    }
  });

  it("gives every featured project card artwork", () => {
    for (const project of featuredProjects) {
      expect(project.cardImage, project.slug).toBeDefined();
      expect(project.cardImage!.width, project.slug).toBeGreaterThan(0);
      expect(project.cardImage!.height, project.slug).toBeGreaterThan(0);
      expect(project.cardImage!.alt, project.slug).toBeTruthy();
    }
  });

  it("features a handful of projects, not all of them", () => {
    expect(featuredProjects.length).toBeGreaterThan(0);
    expect(featuredProjects.length).toBeLessThan(projects.length);
  });

  it("discloses work that is not original or not live", () => {
    // Anything a recruiter could discover from the repo should be stated here.
    expect(getProject("bank-website")?.disclosure).toBeTruthy();
    expect(getProject("springboot-crud")?.disclosure).toBeTruthy();
  });
});

describe("project assets", () => {
  const paths = assetPaths();

  it("references at least one local asset", () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  /**
   * Static export silently ships a broken image rather than failing the build,
   * so a missing poster or screenshot has to be caught here.
   */
  it.each(paths)("$project has its asset $src on disk", ({ src }) => {
    expect(assetExists(src)).toBe(true);
  });
});

describe("live demos", () => {
  /**
   * Mirrors the keys of `demoRegistry`. Duplicated deliberately: importing the
   * registry here would pull in next/dynamic and the demo chunks themselves,
   * turning a content test into a React one. The LiveDemoId union keeps the two
   * honest — a new demo fails to compile until it is added in both places.
   */
  const registeredIds = new Set([
    "sudoku",
    "valheatmap",
    "league-ml",
    "vrvision",
    "cc3k",
    "wattravl",
    "atm",
    "whj-student-update",
    "sf6assist",
  ]);

  it("points every live demo at a registered component", () => {
    for (const project of projects) {
      if (project.demo.kind !== "live") continue;
      expect(registeredIds.has(project.demo.componentId), project.slug).toBe(true);
    }
  });

  it("does not register a demo that no project uses", () => {
    const used = new Set(
      projects
        .filter((p) => p.demo.kind === "live")
        .map((p) => (p.demo as { componentId: string }).componentId),
    );
    for (const id of registeredIds) {
      expect(used.has(id), `${id} is registered but unused`).toBe(true);
    }
  });
});
