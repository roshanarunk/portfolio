import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilteredWork } from "./FilteredWork";
import { projects, featuredProjects } from "@/content/projects";

const order = featuredProjects.map((p) => p.slug);

function setup() {
  return render(<FilteredWork projects={projects} featuredOrder={order} />);
}

/** Card titles currently rendered, in order. */
function shownTitles(): string[] {
  return screen
    .getAllByRole("link")
    .map((a) => a.querySelector("h3")?.textContent ?? "")
    .filter(Boolean);
}

describe("the work filter", () => {
  it("shows the curated three when nothing is selected", () => {
    setup();
    const titles = shownTitles();

    expect(titles).toHaveLength(3);
    expect(titles[0]).toBe(featuredProjects[0].title);
  });

  it("filters to projects using the selected technology", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "C++" }));

    for (const title of shownTitles()) {
      const project = projects.find((p) => p.title === title)!;
      expect(project.tech.some((t) => t.label === "C++"), title).toBe(true);
    }
  });

  /**
   * OR, not AND: a recruiter scanning for a familiar stack wants anything that
   * matches, not the intersection — which for most pairs here is empty.
   */
  it("matches any selected technology rather than all of them", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "C++" }));
    await user.click(screen.getByRole("button", { name: "Python" }));

    const titles = shownTitles();
    expect(titles.length).toBeGreaterThan(0);

    for (const title of titles) {
      const project = projects.find((p) => p.title === title)!;
      const labels = project.tech.map((t) => t.label);
      expect(
        labels.includes("C++") || labels.includes("Python"),
        title,
      ).toBe(true);
    }
  });

  it("marks an active filter as pressed", async () => {
    const user = userEvent.setup();
    setup();

    const python = screen.getByRole("button", { name: "Python" });
    expect(python).toHaveAttribute("aria-pressed", "false");

    await user.click(python);
    expect(python).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles a filter back off", async () => {
    const user = userEvent.setup();
    setup();

    const react = screen.getByRole("button", { name: "React" });
    await user.click(react);
    await user.click(react);

    expect(react).toHaveAttribute("aria-pressed", "false");
    expect(shownTitles()[0]).toBe(featuredProjects[0].title);
  });

  it("never shows more than three cards", async () => {
    const user = userEvent.setup();
    setup();

    // Python alone matches six projects.
    await user.click(screen.getByRole("button", { name: "Python" }));
    expect(shownTitles().length).toBeLessThanOrEqual(3);
  });

  it("says how many matched when more exist than fit", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Python" }));
    expect(screen.getByText(/Showing 3 of \d+ matching projects/)).toBeInTheDocument();
  });

  it("clears back to the curated three", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Java" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(shownTitles()[0]).toBe(featuredProjects[0].title);
  });

  /** Every offered filter must match something, or it is a dead control. */
  it("offers no filter that matches nothing", async () => {
    const user = userEvent.setup();
    setup();

    const labels = ["Python", "React", "C++", "Java", "TypeScript", "Android"];
    for (const label of labels) {
      const matches = projects.filter((p) =>
        p.tech.some((t) => t.label === label),
      );
      expect(matches.length, label).toBeGreaterThan(0);
    }
    // And the control exists for each.
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "TypeScript" }));
    expect(shownTitles().length).toBeGreaterThan(0);
  });
});
