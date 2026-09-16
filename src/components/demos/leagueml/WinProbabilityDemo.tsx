"use client";

import { useEffect, useMemo, useState } from "react";
import { DemoSkeleton } from "../DemoSkeleton";
import { contributions, isModelPayload, predict, type ModelPayload } from "./inference";
import { cn } from "@/lib/utils";

/** Named positions, so a visitor can see a realistic game without dragging 14 sliders. */
const PRESETS: Record<string, Partial<Record<string, number>>> = {
  "Even game": {},
  Ahead: { Gold_diff: 4000, Kills: 14, Deaths: 7, Towers: 2, Dragons: 1 },
  Snowballed: {
    Gold_diff: 9000,
    Kills: 22,
    Deaths: 4,
    Towers: 4,
    Dragons: 2,
    Heralds: 1,
  },
  Behind: { Gold_diff: -5000, Kills: 5, Deaths: 15, Towers: 0, Dragons: 0 },
};

export function WinProbabilityDemo() {
  const [model, setModel] = useState<ModelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});

  // Fetched rather than imported, so the model stays out of the JS bundle.
  useEffect(() => {
    let cancelled = false;

    fetch("/data/leagueml/model.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        if (!isModelPayload(data)) throw new Error("Malformed model file");
        setModel(data);
        setValues(Object.fromEntries(data.features.map((f) => [f.key, f.default])));
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const vector = useMemo(
    () => model?.features.map((f) => values[f.key] ?? f.default) ?? [],
    [model, values],
  );

  const probability = useMemo(
    () => (model && vector.length ? predict(model, vector) : 0),
    [model, vector],
  );

  const drivers = useMemo(() => {
    if (!model || !vector.length) return [];
    return contributions(model, vector)
      .map((value, i) => ({ value, label: model.features[i].label }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);
  }, [model, vector]);

  if (error) {
    // Surfaced rather than thrown: the shell's boundary would hide the reason.
    return (
      <div className="p-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Could not load the model ({error}).
      </div>
    );
  }

  if (!model) return <DemoSkeleton label="Loading model…" />;

  const groups = [...new Set(model.features.map((f) => f.group))];
  const maxDriver = Math.max(...drivers.map((d) => Math.abs(d.value)), 0.001);

  function applyPreset(name: keyof typeof PRESETS) {
    if (!model) return;
    setValues(
      Object.fromEntries(
        model.features.map((f) => [f.key, PRESETS[name][f.key] ?? f.default]),
      ),
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Blue side win probability
          </p>
          <p
            data-testid="win-probability"
            className="font-mono text-4xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100"
            aria-live="polite"
          >
            {(probability * 100).toFixed(1)}%
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* A single bar reads faster than a number alone when dragging a slider. */}
      <div
        className="mb-8 h-2 overflow-hidden rounded-full bg-rose-200 dark:bg-rose-950"
        role="img"
        aria-label={`Win probability ${(probability * 100).toFixed(1)} percent`}
      >
        <div
          className="h-full bg-blue-500 transition-[width] duration-150 motion-reduce:transition-none"
          style={{ width: `${probability * 100}%` }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-6">
          {groups.map((group) => (
            <fieldset key={group}>
              <legend className="mb-3 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                {group}
              </legend>
              <div className="space-y-3">
                {model.features
                  .filter((feature) => feature.group === group)
                  .map((feature) => {
                    const value = values[feature.key] ?? feature.default;
                    return (
                      <div
                        key={feature.key}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-3"
                      >
                        <label
                          htmlFor={`f-${feature.key}`}
                          className="text-sm text-neutral-700 dark:text-neutral-300"
                        >
                          {feature.label}
                        </label>
                        {/* Number input beside the slider for keyboard and AT users. */}
                        <input
                          id={`f-${feature.key}-num`}
                          type="number"
                          value={value}
                          min={feature.min}
                          max={feature.max}
                          step={feature.step}
                          aria-label={`${feature.label} value`}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [feature.key]: Number(event.target.value),
                            }))
                          }
                          className="w-20 rounded border border-neutral-300 px-1.5 py-0.5 text-right font-mono text-xs tabular-nums dark:border-neutral-700 dark:bg-neutral-950"
                        />
                        <input
                          id={`f-${feature.key}`}
                          type="range"
                          value={value}
                          min={feature.min}
                          max={feature.max}
                          step={feature.step}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [feature.key]: Number(event.target.value),
                            }))
                          }
                          className="col-span-2 w-full accent-blue-500"
                        />
                      </div>
                    );
                  })}
              </div>
            </fieldset>
          ))}
        </div>

        <aside className="space-y-4">
          <div>
            <h4 className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              What is driving this
            </h4>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Each feature&apos;s push on the log-odds.
            </p>
            <ul className="mt-3 space-y-2">
              {drivers.map((driver) => (
                <li key={driver.label} className="text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {driver.label}
                    </span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {driver.value >= 0 ? "+" : ""}
                      {driver.value.toFixed(2)}
                    </span>
                  </div>
                  {/* Diverging bar: right of centre helps blue, left hurts. */}
                  <div className="mt-1 flex h-1.5 items-center">
                    <div className="flex h-full w-1/2 justify-end">
                      {driver.value < 0 && (
                        <div
                          className="h-full rounded-l bg-rose-400"
                          style={{
                            width: `${(Math.abs(driver.value) / maxDriver) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="h-full w-px bg-neutral-300 dark:bg-neutral-700" />
                    <div className="flex h-full w-1/2">
                      {driver.value > 0 && (
                        <div
                          className="h-full rounded-r bg-blue-400"
                          style={{
                            width: `${(driver.value / maxDriver) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl
            className={cn(
              "grid grid-cols-2 gap-2 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800",
            )}
          >
            <div>
              <dt className="text-neutral-500">Accuracy</dt>
              <dd className="font-mono text-neutral-900 tabular-nums dark:text-neutral-100">
                {(model.metrics.accuracy * 100).toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">ROC-AUC</dt>
              <dd className="font-mono text-neutral-900 tabular-nums dark:text-neutral-100">
                {model.metrics.auc.toFixed(3)}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Logistic regression over {model.metrics.nGames.toLocaleString()} Korean
            ranked games, held out by game so no match appears in both training and
            test. It describes what tends to follow a given position — not what causes
            it.
          </p>
        </aside>
      </div>
    </div>
  );
}
