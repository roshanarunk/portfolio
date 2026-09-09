import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WinProbabilityDemo } from "./WinProbabilityDemo";

const modelJson = readFileSync(
  join(process.cwd(), "public/data/leagueml/model.json"),
  "utf8",
);

/** Serves the real exported model, so the test exercises the shipped numbers. */
function mockFetch(response: Partial<Response> & { ok: boolean }) {
  return vi.fn().mockResolvedValue(response as Response);
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    mockFetch({ ok: true, json: async () => JSON.parse(modelJson) }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The headline percentage, read from the live region rather than by text
 * pattern — the accuracy metric renders in the same "99.9%" shape.
 */
async function readProbability() {
  const node = await screen.findByTestId("win-probability");
  return Number(node.textContent!.replace("%", ""));
}

/**
 * Sets the gold slider directly. userEvent.type would enter "-8000" one
 * character at a time, and a lone "-" is not a valid number, so the sign is
 * dropped and the value comes out positive.
 */
async function setGold(value: number) {
  const slider = screen.getByLabelText("Gold lead") as HTMLInputElement;
  fireEvent.change(slider, { target: { value: String(value) } });
}

describe("WinProbabilityDemo", () => {
  it("loads the model and shows a probability", async () => {
    render(<WinProbabilityDemo />);
    const probability = await readProbability();
    expect(probability).toBeGreaterThan(0);
    expect(probability).toBeLessThan(100);
  });

  it("renders a labelled control for every feature", async () => {
    render(<WinProbabilityDemo />);
    await readProbability();

    const model = JSON.parse(modelJson);
    for (const feature of model.features) {
      expect(screen.getByLabelText(feature.label)).toBeInTheDocument();
    }
  });

  it("raises the probability when the gold lead grows", async () => {
    render(<WinProbabilityDemo />);
    const before = await readProbability();

    await setGold(8000);

    await waitFor(async () => {
      expect(await readProbability()).toBeGreaterThan(before);
    });
  });

  it("lowers the probability when behind in gold", async () => {
    render(<WinProbabilityDemo />);
    const before = await readProbability();

    await setGold(-8000);

    await waitFor(async () => {
      expect(await readProbability()).toBeLessThan(before);
    });
  });

  it("applies a preset", async () => {
    const user = userEvent.setup();
    render(<WinProbabilityDemo />);
    const before = await readProbability();

    await user.click(screen.getByRole("button", { name: "Snowballed" }));

    await waitFor(async () => {
      expect(await readProbability()).toBeGreaterThan(before);
    });
  });

  it("reports the model's held-out metrics", async () => {
    render(<WinProbabilityDemo />);
    await readProbability();

    const model = JSON.parse(modelJson);
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(
      screen.getByText(`${(model.metrics.accuracy * 100).toFixed(1)}%`),
    ).toBeInTheDocument();
    expect(screen.getByText(model.metrics.auc.toFixed(3))).toBeInTheDocument();
  });

  it("explains the failure instead of rendering a broken widget", async () => {
    vi.stubGlobal("fetch", mockFetch({ ok: false, status: 404 }));
    render(<WinProbabilityDemo />);
    expect(await screen.findByText(/Could not load the model/)).toBeVisible();
  });

  it("rejects a malformed model file", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ ok: true, json: async () => ({ features: [], coef: [1] }) }),
    );
    render(<WinProbabilityDemo />);
    expect(await screen.findByText(/Malformed model file/)).toBeVisible();
  });
});
