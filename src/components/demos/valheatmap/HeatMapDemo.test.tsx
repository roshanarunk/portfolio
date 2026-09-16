import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeatMapDemo } from "./HeatMapDemo";

const DATA_DIR = join(process.cwd(), "public/data/valheatmap");
const read = (name: string) => JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));

const index = read("index.json");
const bind = read("bind.json");
const ascent = read("ascent.json");

/** Serves the real preprocessed match files by URL. */
function routedFetch() {
  return vi.fn((url: string) => {
    const file = url.split("/").pop()!;
    const body = file === "index.json" ? index : file === "ascent.json" ? ascent : bind;
    return Promise.resolve({ ok: true, json: async () => body } as Response);
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", routedFetch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const plot = () => screen.getByRole("img", { name: /kills plotted/i });

/** Kill marks are <g role="graphics-symbol"> groups inside the plot. */
function markCount() {
  return within(plot()).queryAllByRole("graphics-symbol").length;
}

describe("HeatMapDemo", () => {
  it("loads a match and plots its kills", async () => {
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());
    expect(markCount()).toBe(bind.kills.length);
  });

  it("offers every map in the index", async () => {
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());

    for (const summary of index) {
      expect(screen.getByRole("button", { name: summary.map })).toBeInTheDocument();
    }
  });

  it("switches maps", async () => {
    const user = userEvent.setup();
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Ascent" }));

    await waitFor(() => expect(markCount()).toBe(ascent.kills.length));
  });

  it("narrows the plot when filtered to one player", async () => {
    const user = userEvent.setup();
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());
    const before = markCount();

    const player = bind.players[0];
    await user.selectOptions(screen.getByLabelText("Player"), String(player.id));

    await waitFor(() => {
      const after = markCount();
      expect(after).toBeLessThan(before);
      expect(after).toBe(
        bind.kills.filter(
          (k: { killer: number; victim: number }) =>
            k.killer === player.id || k.victim === player.id,
        ).length,
      );
    });
  });

  it("narrows the plot with a round range", async () => {
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());
    const before = markCount();

    const slider = screen.getByLabelText(/From round/) as HTMLInputElement;
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(slider, { target: { value: "5" } });

    await waitFor(() => expect(markCount()).toBeLessThan(before));
  });

  it("restores every kill when filters are cleared", async () => {
    const user = userEvent.setup();
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());

    await user.selectOptions(
      screen.getByLabelText("Player"),
      String(bind.players[0].id),
    );
    await waitFor(() => expect(markCount()).toBeLessThan(bind.kills.length));

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    await waitFor(() => expect(markCount()).toBe(bind.kills.length));
  });

  it("offers a table view of the same kills", async () => {
    const user = userEvent.setup();
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Table" }));

    const table = await screen.findByRole("table");
    // One row per kill, plus the header row.
    expect(within(table).getAllByRole("row")).toHaveLength(bind.kills.length + 1);
  });

  it("describes each kill for assistive technology", async () => {
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    await waitFor(() => expect(plot()).toBeInTheDocument());

    const marks = within(plot()).getAllByRole("graphics-symbol");
    expect(marks[0]).toHaveAccessibleName(/Round \d+: .+ killed .+/);
  });

  it("explains a failure rather than rendering an empty map", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response),
    );
    render(<HeatMapDemo resetToken={0} reducedMotion={false} />);
    expect(await screen.findByText(/Could not load match data/)).toBeVisible();
  });
});
