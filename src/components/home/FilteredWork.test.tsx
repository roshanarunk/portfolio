import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilteredWork } from "./FilteredWork";
import { projects } from "@/content/projects";

function setup() {
  return render(<FilteredWork projects={projects} />);
}

/** Card titles currently rendered, in order. */
function shownTitles(): string[] {
  return screen
    .getAllByRole("link")
    .map((a) => a.querySelector("h3")?.textContent ?? "")
    .filter(Boolean);
}

describe("the work filter", () => {
  it("shows three projects when nothing is selected", () => {
    setup();
    expect(shownTitles()).toHaveLength(3);
  });

  /** A return visitor should meet different work, not the same three cards. */
  it("draws a random sample rather than a fixed one", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const { unmount } = setup();
      seen.add(shownTitles().join("|"));
      unmount();
    }
    // With 16 projects, twelve draws landing on one ordering would be absurd.
    expect(seen.size).toBeGreaterThan(1);
  });

  it("filters to projects using the selected technology", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "C++" }));

    for (const title of shownTitles()) {
      const project = projects.find((p) => p.title === title)!;
      expect(
        project.tech.some((t) => t.label === "C++"),
        title,
      ).toBe(true);
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
      expect(labels.includes("C++") || labels.includes("Python"), title).toBe(true);
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
    expect(shownTitles()).toHaveLength(3);
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

    expect(shownTitles()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  /** Every offered filter must match something, or it is a dead control. */
  it("offers no filter that matches nothing", async () => {
    const user = userEvent.setup();
    setup();

    const labels = ["Python", "React", "C++", "Java", "TypeScript", "Android"];
    for (const label of labels) {
      const matches = projects.filter((p) => p.tech.some((t) => t.label === label));
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

describe("the swap animation", () => {
  /**
   * An element React has already unmounted cannot animate, so the outgoing card
   * is held in state for the length of the exit animation and stacked under the
   * incoming one.
   */
  it("keeps the outgoing card mounted so it can animate out", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    const before = shownTitles();
    await user.click(screen.getByRole("button", { name: "C++" }));

    const leaving = container.querySelectorAll(".swap-out");
    const arriving = container.querySelectorAll(".swap-in");

    // Something arrived, and at least one slot changed occupant.
    expect(arriving.length).toBeGreaterThan(0);
    if (shownTitles().join("|") !== before.join("|")) {
      expect(leaving.length).toBeGreaterThan(0);
    }
  });

  it("hides the outgoing card from assistive tech", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    await user.click(screen.getByRole("button", { name: "Python" }));
    for (const el of container.querySelectorAll(".swap-out")) {
      expect(el).toHaveAttribute("aria-hidden", "true");
    }
  });
});
