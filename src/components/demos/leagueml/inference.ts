/**
 * Client-side inference for the league-ML logistic regression.
 *
 * Scoring a logistic regression is standardise, dot, sigmoid — so the fitted
 * coefficients exported by scripts/export_league_model.py are all the browser
 * needs. No API, no model runtime.
 */

export interface FeatureSpec {
  key: string;
  label: string;
  group: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  default: number;
}

export interface ModelPayload {
  version: number;
  features: FeatureSpec[];
  scaler: { mean: number[]; scale: number[] };
  coef: number[];
  intercept: number;
  metrics: {
    accuracy: number;
    auc: number;
    nSamples: number;
    nGames: number;
    nTest: number;
    trainedAt: string;
  };
  testVectors: { x: number[]; expectedP: number }[];
}

/** Logistic function, guarded against overflow at the tails. */
export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

/** Per-feature contribution to the log-odds: coef * standardised value. */
export function contributions(model: ModelPayload, x: number[]): number[] {
  return model.coef.map((coefficient, i) => {
    const z = (x[i] - model.scaler.mean[i]) / model.scaler.scale[i];
    return coefficient * z;
  });
}

/** Win probability for a feature vector, ordered as in `model.features`. */
export function predict(model: ModelPayload, x: number[]): number {
  if (x.length !== model.coef.length) {
    throw new Error(`Expected ${model.coef.length} features, received ${x.length}`);
  }
  const logOdds = contributions(model, x).reduce(
    (sum, value) => sum + value,
    model.intercept,
  );
  return sigmoid(logOdds);
}

/** Validates a fetched payload before the UI trusts its shape. */
export function isModelPayload(value: unknown): value is ModelPayload {
  if (typeof value !== "object" || value === null) return false;
  const model = value as Partial<ModelPayload>;
  return (
    Array.isArray(model.features) &&
    Array.isArray(model.coef) &&
    typeof model.intercept === "number" &&
    !!model.scaler &&
    Array.isArray(model.scaler.mean) &&
    Array.isArray(model.scaler.scale) &&
    model.features.length === model.coef.length &&
    model.coef.length === model.scaler.mean.length &&
    model.coef.length === model.scaler.scale.length
  );
}
