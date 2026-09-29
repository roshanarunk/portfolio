import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { experience, site } from "./site";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("experience", () => {
  it("lists roles newest first", () => {
    const starts = experience.map((r) => r.start);
    expect([...starts].sort().reverse()).toEqual(starts);
  });

  it("gives every role a company, title and period", () => {
    for (const role of experience) {
      expect(role.company, role.company).toBeTruthy();
      expect(role.title, role.company).toBeTruthy();
      expect(role.period, role.company).toBeTruthy();
      expect(role.start, role.company).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  /**
   * A missing logo file would ship as a broken image: static export does not
   * fail the build for one, so it has to be caught here.
   */
  it("has every referenced logo on disk", () => {
    for (const role of experience) {
      if (!role.logo) continue;
      const path = join(PUBLIC_DIR, role.logo.replace(/^\//, ""));
      expect(existsSync(path), `${role.company}: ${role.logo}`).toBe(true);
    }
  });

  it("keeps each company listed once", () => {
    const names = experience.map((r) => r.company);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("contact details", () => {
  it("has a real LinkedIn URL, not an empty placeholder", () => {
    expect(site.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\/in\/.+/);
  });

  /** Reaching the resume is the site's second job; a dead link fails it. */
  it("links a resume that exists on disk", () => {
    expect(existsSync(join(PUBLIC_DIR, site.resume.replace(/^\//, "")))).toBe(true);
  });

  it("has a GitHub profile and an email", () => {
    expect(site.github).toMatch(/^https:\/\/github\.com\/.+/);
    expect(site.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
});
