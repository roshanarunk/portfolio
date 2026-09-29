import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectIndex, deriveFilters } from "./ProjectIndex";
import { projects } from "@/content/projects";

const tiers = [
  { tier: 1 as const, label: "Selected work" },
  { tier: 2 as const, label: "Also built" },
  { tier: 3 as const, label: "Earlier work" },
];

function setup() {
  return render(<ProjectIndex projects={projects} tiers={tiers} />);
}

/** Card titles currently rendered, in order. */
function shownTitles(): string[] {
  return screen
    .getAllByRole("link")
    .map((a) => a.querySelector("h3")?.textContent ?? "")
    .filter(Boolean);
}

function usesAny(title: string, labels: string[]) {
  const project = projects.find((p) => p.title === title)!;
  return project.tech.some((t) => labels.includes(t.label));
}

describe("the projects filter", () => {
  it("shows every project when nothing is selected", () => {
    setup();
    expect(shownTitles()).toHaveLength(projects.length);
  });

  /**
   * On the landing page the filter narrowed a three-card sample, so most
   * matches were hidden behind "Showing 3 of 6". Here every match is shown.
   */
  it("shows every matching project, not a capped sample", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Python" }));
    const expected = projects.filter((p) => p.tech.some((t) => t.label === "Python"));
    expect(shownTitles()).toHaveLength(expected.length);
    for (const title of shownTitles()) expect(usesAny(title, ["Python"]), title).toBe(true);
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
    for (const title of titles) expect(usesAny(title, ["C++", "Python"]), title).toBe(true);
  });

  it("marks an active filter as pressed and toggles it back off", async () => {
    const user = userEvent.setup();
    setup();

    const react = screen.getByRole("button", { name: "React" });
    expect(react).toHaveAttribute("aria-pressed", "false");
    await user.click(react);
    expect(react).toHaveAttribute("aria-pressed", "true");
    await user.click(react);
    expect(react).toHaveAttribute("aria-pressed", "false");
    expect(shownTitles()).toHaveLength(projects.length);
  });

  it("says how many projects matched", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Java" }));
    expect(
      screen.getByText(new RegExp(`^\\d+ of ${projects.length} projects use Java\\.$`)),
    ).toBeInTheDocument();
  });

  it("clears back to every project", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Java" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(shownTitles()).toHaveLength(projects.length);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  /** A tier with no matches disappears rather than leaving an empty heading. */
  it("hides a tier heading when none of its projects match", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "C#" }));
    for (const { tier, label } of tiers) {
      const any = projects.some(
        (p) => p.tier === tier && p.tech.some((t) => t.label === "C#"),
      );
      expect(Boolean(screen.queryByRole("heading", { name: label })), label).toBe(any);
    }
  });

  /** Only what the filter brought in should animate; what stayed put stays still. */
  it("animates only the cards a filter change brings in", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    expect(container.querySelectorAll(".swap-in")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "C++" }));
    // Narrowing only removes cards, so nothing arrives.
    expect(container.querySelectorAll(".swap-in")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    const cpp = projects.filter((p) => p.tech.some((t) => t.label === "C++")).length;
    expect(container.querySelectorAll(".swap-in")).toHaveLength(projects.length - cpp);
  });

  /** Every offered filter must match something, or it is a dead control. */
  it("offers no filter that matches nothing", async () => {
    const user = userEvent.setup();
    setup();

    for (const { label } of deriveFilters(projects)) {
      await user.click(screen.getByRole("button", { name: label }));
      expect(shownTitles().length, label).toBeGreaterThan(0);
      await user.click(screen.getByRole("button", { name: label }));
    }
  });
});

describe("deriving the filters", () => {
  const filters = deriveFilters(projects);
  const labels = filters.map((f) => f.label);

  /** The list used to be hand-kept, and went stale when C# work landed. */
  it("offers every language or framework used by two or more projects", () => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const label of new Set(
        p.tech
          .filter((t) => t.category === "language" || t.category === "framework")
          .map((t) => t.label),
      )) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    const expected = [...counts].filter(([, n]) => n >= 2).map(([l]) => l);
    expect([...labels].sort()).toEqual(expected.sort());
  });

  it("does not offer a styling library as a stack filter", () => {
    expect(labels).not.toContain("Tailwind CSS");
  });

  it("orders filters by how many projects use them", () => {
    for (let i = 1; i < filters.length; i++) {
      expect(filters[i].count).toBeLessThanOrEqual(filters[i - 1].count);
    }
  });

  it("reports counts that match the projects", () => {
    for (const { label, count } of filters) {
      const n = projects.filter((p) => p.tech.some((t) => t.label === label)).length;
      expect(count, label).toBe(n);
    }
  });
});

describe("the card label", () => {
  /**
   * "Playable here" is set only where a visitor can actually play something;
   * an input tester or a firmware state machine is not a game.
   */
  it("only calls a project playable where it is set explicitly", () => {
    const playable = projects
      .filter((p) => p.demo.cardLabel === "Playable here")
      .map((p) => p.slug)
      .sort();
    expect(playable).toEqual(["cc3k", "sudoku", "wavu"]);
  });

  it("does not call Fundies playable", () => {
    const fundies = projects.find((p) => p.slug === "fundies")!;
    expect(fundies.demo.cardLabel).toBeUndefined();
  });
});
