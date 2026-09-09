"""
Fits the logistic regression from league-ML and exports it for the browser.

Run once, by hand — this is not part of `next build`:

    pip install pandas scikit-learn openpyxl
    python scripts/export_league_model.py path/to/KR-History.xlsx

Writes public/data/leagueml/model.json, holding the standardiser statistics and
fitted coefficients. Inference for logistic regression is just a dot product and
a sigmoid, so the demo runs client-side with no backend.

Two details that matter for the numbers being honest:

1. The dataset has one row per team, so each game appears twice with mirrored
   features and opposite labels. Splitting rows at random would put both halves
   of the same game either side of the split and leak the answer, inflating the
   score. The split here is by game.

2. Feature order must stay identical across `features`, `scaler` and `coef`,
   because the browser rebuilds the vector positionally. Asserted below.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler

TARGET = "Win"

# Presentation metadata for the sliders. Ranges are clamped to sensible values
# rather than the raw min/max, which contain outliers from surrendered games.
FEATURE_META: dict[str, dict] = {
    "Gold_diff":      {"label": "Gold lead",        "group": "Economy",    "min": -10000, "max": 10000, "step": 100, "unit": "g"},
    "Gold":           {"label": "Total gold",       "group": "Economy",    "min": 15000,  "max": 40000, "step": 100, "unit": "g"},
    "Level":          {"label": "Average level",    "group": "Economy",    "min": 6,      "max": 12,    "step": 0.1},
    "Minions":        {"label": "Minions killed",   "group": "Economy",    "min": 150,    "max": 500,   "step": 1},
    "Jungle_minions": {"label": "Jungle farm",      "group": "Economy",    "min": 20,     "max": 150,   "step": 1},
    "Kills":          {"label": "Kills",            "group": "Combat",     "min": 0,      "max": 30,    "step": 1},
    "Deaths":         {"label": "Deaths",           "group": "Combat",     "min": 0,      "max": 30,    "step": 1},
    "Assists":        {"label": "Assists",          "group": "Combat",     "min": 0,      "max": 50,    "step": 1},
    "Towers":         {"label": "Towers",           "group": "Objectives", "min": 0,      "max": 6,     "step": 1},
    "Plates":         {"label": "Turret plates",    "group": "Objectives", "min": 0,      "max": 15,    "step": 1},
    "Dragons":        {"label": "Dragons",          "group": "Objectives", "min": 0,      "max": 4,     "step": 1},
    "Heralds":        {"label": "Heralds",          "group": "Objectives", "min": 0,      "max": 2,     "step": 1},
    "Sight_wards":    {"label": "Sight wards",      "group": "Vision",     "min": 0,      "max": 40,    "step": 1},
    "Control_wards":  {"label": "Control wards",    "group": "Vision",     "min": 0,      "max": 25,    "step": 1},
}


def load(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path)
    missing = (set(FEATURE_META) | {TARGET}) - set(df.columns)
    if missing:
        raise SystemExit(f"Dataset is missing columns: {sorted(missing)}")
    return df


def game_ids(df: pd.DataFrame) -> np.ndarray:
    """
    Rows arrive as consecutive team pairs from the same game. Verify that
    assumption via the mirrored gold difference before relying on it, so a
    reordered export cannot silently produce a leaky split.
    """
    gold_diff = df["Gold_diff"].to_numpy()
    if len(gold_diff) % 2 != 0:
        raise SystemExit("Expected an even number of rows (two teams per game).")

    pairs_mirror = np.all(gold_diff[0::2] == -gold_diff[1::2])
    if not pairs_mirror:
        raise SystemExit(
            "Rows are not consecutive team pairs — the group split would be wrong."
        )

    return np.repeat(np.arange(len(df) // 2), 2)


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "KR-History.xlsx")
    if not source.exists():
        raise SystemExit(f"Cannot find {source}. Pass the path to KR-History.xlsx.")

    df = load(source)
    features = list(FEATURE_META)

    X = df[features].to_numpy(dtype=float)
    y = df[TARGET].to_numpy(dtype=int)
    groups = game_ids(df)

    # Group split keeps both teams from a game on the same side of the split.
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups))

    scaler = StandardScaler().fit(X[train_idx])
    model = LogisticRegression(max_iter=1000).fit(
        scaler.transform(X[train_idx]), y[train_idx]
    )

    probabilities = model.predict_proba(scaler.transform(X[test_idx]))[:, 1]
    accuracy = accuracy_score(y[test_idx], probabilities >= 0.5)
    auc = roc_auc_score(y[test_idx], probabilities)

    # Ship a few real vectors with their sklearn probabilities, so the
    # TypeScript port can be checked against Python rather than trusted.
    sample_idx = test_idx[:3]
    test_vectors = [
        {
            "x": [round(float(v), 4) for v in X[i]],
            "expectedP": round(float(p), 10),
        }
        for i, p in zip(sample_idx, model.predict_proba(scaler.transform(X[sample_idx]))[:, 1])
    ]

    payload = {
        "version": 1,
        "features": [
            {
                "key": key,
                **FEATURE_META[key],
                "default": round(float(np.median(X[:, i])), 2),
            }
            for i, key in enumerate(features)
        ],
        "scaler": {
            "mean": [round(float(v), 8) for v in scaler.mean_],
            "scale": [round(float(v), 8) for v in scaler.scale_],
        },
        "coef": [round(float(v), 8) for v in model.coef_[0]],
        "intercept": round(float(model.intercept_[0]), 8),
        "metrics": {
            "accuracy": round(float(accuracy), 4),
            "auc": round(float(auc), 4),
            "nSamples": int(len(df)),
            "nGames": int(len(df) // 2),
            "nTest": int(len(test_idx)),
            "trainedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        },
        "testVectors": test_vectors,
    }

    # The browser rebuilds the feature vector positionally, so these must align.
    assert len(payload["features"]) == len(payload["coef"]) == len(features)
    assert len(payload["scaler"]["mean"]) == len(features)
    assert len(payload["scaler"]["scale"]) == len(features)
    assert [f["key"] for f in payload["features"]] == features

    out = Path(__file__).resolve().parent.parent / "public/data/leagueml/model.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {out.relative_to(Path.cwd()) if out.is_relative_to(Path.cwd()) else out}")
    print(f"  games      {len(df) // 2} ({len(df)} team-rows)")
    print(f"  accuracy   {accuracy:.3f}")
    print(f"  ROC-AUC    {auc:.3f}")
    print()
    print("  Largest standardised effects:")
    order = np.argsort(-np.abs(model.coef_[0]))
    for i in order[:6]:
        print(f"    {FEATURE_META[features[i]]['label']:<18} {model.coef_[0][i]:+.3f}")


if __name__ == "__main__":
    main()
