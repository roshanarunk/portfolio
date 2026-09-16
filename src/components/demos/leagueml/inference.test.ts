import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contributions,
  isModelPayload,
  predict,
  sigmoid,
  type ModelPayload,
} from "./inference";

const model = JSON.parse(
  readFileSync(join(process.cwd(), "public/data/leagueml/model.json"), "utf8"),
) as ModelPayload;

describe("model payload", () => {
  it("passes its own shape check", () => {
    expect(isModelPayload(model)).toBe(true);
  });

  it("rejects a malformed payload", () => {
    expect(isModelPayload({ features: [], coef: [1] })).toBe(false);
    expect(isModelPayload(null)).toBe(false);
  });

  /**
   * The browser rebuilds the feature vector positionally, so a mismatch here
   * would silently score the wrong coefficient against the wrong slider.
   */
  it("keeps features, coefficients and scaler stats aligned", () => {
    const n = model.features.length;
    expect(model.coef).toHaveLength(n);
    expect(model.scaler.mean).toHaveLength(n);
    expect(model.scaler.scale).toHaveLength(n);
  });

  it("gives every feature the metadata a slider needs", () => {
    for (const feature of model.features) {
      expect(feature.key, feature.key).toBeTruthy();
      expect(feature.label, feature.key).toBeTruthy();
      expect(feature.max, feature.key).toBeGreaterThan(feature.min);
      expect(feature.step, feature.key).toBeGreaterThan(0);
      expect(feature.default, feature.key).toBeGreaterThanOrEqual(feature.min);
      expect(feature.default, feature.key).toBeLessThanOrEqual(feature.max);
    }
  });

  it("never divides by a zero scale", () => {
    for (const scale of model.scaler.scale) expect(scale).not.toBe(0);
  });
});

describe("sigmoid", () => {
  it("maps zero to a half", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 12);
  });

  it("stays within (0, 1) at extreme inputs", () => {
    for (const z of [-1000, -50, 50, 1000]) {
      const p = sigmoid(z);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
      expect(Number.isFinite(p)).toBe(true);
    }
  });

  it("is symmetric about zero", () => {
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1, 12);
  });
});

describe("predict", () => {
  /**
   * The point of this file: the exported vectors carry the probabilities
   * scikit-learn produced for them, so the TypeScript port is checked against
   * Python rather than merely against itself.
   */
  it.each(model.testVectors.map((v, i) => [i, v] as const))(
    "reproduces scikit-learn's probability for test vector %i",
    (_index, vector) => {
      // Coefficients are exported rounded to 8 decimals, which bounds how
      // closely the two can agree; observed error is around 2e-9.
      expect(predict(model, vector.x)).toBeCloseTo(vector.expectedP, 7);
    },
  );

  it("rejects a wrongly-sized feature vector", () => {
    expect(() => predict(model, [1, 2, 3])).toThrow(/Expected \d+ features/);
  });

  it("returns a probability for the default position", () => {
    const p = predict(
      model,
      model.features.map((f) => f.default),
    );
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it("rates a large gold lead above a large deficit", () => {
    const base = model.features.map((f) => f.default);
    const goldIndex = model.features.findIndex((f) => f.key === "Gold_diff");
    expect(goldIndex).toBeGreaterThanOrEqual(0);

    const ahead = [...base];
    ahead[goldIndex] = 8000;
    const behind = [...base];
    behind[goldIndex] = -8000;

    expect(predict(model, ahead)).toBeGreaterThan(predict(model, behind));
  });
});

describe("contributions", () => {
  it("sums with the intercept to the predicted log-odds", () => {
    const x = model.features.map((f) => f.default);
    const total = contributions(model, x).reduce((a, b) => a + b, model.intercept);
    expect(sigmoid(total)).toBeCloseTo(predict(model, x), 12);
  });

  it("is zero for a feature sitting exactly at its training mean", () => {
    const x = [...model.scaler.mean];
    for (const contribution of contributions(model, x)) {
      expect(contribution).toBeCloseTo(0, 10);
    }
  });

  it("makes gold lead the dominant driver, as the training run reported", () => {
    const x = model.features.map((f) => f.default);
    const goldIndex = model.features.findIndex((f) => f.key === "Gold_diff");
    const magnitudes = model.coef.map(Math.abs);
    expect(magnitudes[goldIndex]).toBe(Math.max(...magnitudes));
    expect(contributions(model, x)).toHaveLength(model.coef.length);
  });
});
