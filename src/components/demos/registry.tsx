"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LiveDemoId } from "@/lib/types";
import { DemoSkeleton } from "./DemoSkeleton";

export interface DemoComponentProps {
  /** Changes when the shell's reset button is pressed. */
  resetToken: number;
  /** True when the visitor prefers reduced motion. */
  reducedMotion: boolean;
}

/**
 * The only module that names demo bundles.
 *
 * Every entry is `ssr: false` so its chunk is fetched when the project page
 * mounts, never as part of the initial payload. Content files (src/content/
 * projects/*) must reference demos by id only and never import this module,
 * or the landing page would pull in every demo.
 */
export const demoRegistry: Record<
  LiveDemoId,
  ComponentType<DemoComponentProps>
> = {
  sudoku: dynamic(
    () => import("./sudoku/SudokuDemo").then((m) => m.SudokuDemo),
    { ssr: false, loading: () => <DemoSkeleton label="Loading solver…" /> },
  ),
  valheatmap: dynamic(
    () => import("./valheatmap/HeatMapDemo").then((m) => m.HeatMapDemo),
    { ssr: false, loading: () => <DemoSkeleton label="Loading match data…" /> },
  ),
  "league-ml": dynamic(
    () =>
      import("./leagueml/WinProbabilityDemo").then((m) => m.WinProbabilityDemo),
    { ssr: false, loading: () => <DemoSkeleton label="Loading model…" /> },
  ),
};
