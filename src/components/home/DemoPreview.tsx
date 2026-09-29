import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAGNIFIER_SHADER } from "@/components/demos/vrvision/shaders";
import { MAP_TRANSFORMS, fitBounds, gameToPlot } from "@/components/demos/valheatmap/transform";

/**
 * Card previews for the "Run one now" row, rendered at build time from each
 * project's own data rather than from screenshots: the CC3K floor comes from
 * the game's map file, the bars are the League model's fitted weights, the dots
 * are real deaths on Bind, and the code is the VRVision fragment shader.
 *
 * This is a server component. It reads files during the static export and
 * emits plain markup, so none of the demo code reaches the landing page — the
 * constraint that every demo is code-split still holds.
 */

const PUBLIC = join(process.cwd(), "public");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(PUBLIC, path), "utf8")) as T;
}

/** The first of the five floors in the original map file, unchanged. */
function CC3KPreview() {
  const rows = readFileSync(join(PUBLIC, "data/cc3k/default.txt"), "utf8")
    .split(/\r?\n/)
    .slice(0, 25);
  const width = 79 * 6;
  const height = rows.length * 10;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="size-full p-3 text-neutral-500 dark:text-neutral-500"
      preserveAspectRatio="xMidYMid meet"
    >
      {rows.map((row, i) => (
        <text
          key={i}
          x={0}
          y={(i + 1) * 10 - 2}
          fontSize={10}
          textLength={row.length > 0 ? row.length * 6 : undefined}
          lengthAdjust="spacing"
          xmlSpace="preserve"
          className="fill-current font-mono"
        >
          {row}
        </text>
      ))}
    </svg>
  );
}

interface LeagueModel {
  features: { label: string }[];
  coef: number[];
}

/** The five largest standardised weights, drawn to one linear scale. */
function LeaguePreview() {
  const model = readJson<LeagueModel>("data/leagueml/model.json");
  const weights = model.coef
    .map((value, i) => ({ label: model.features[i].label, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);
  const max = Math.abs(weights[0].value);

  return (
    <div className="flex size-full flex-col justify-center gap-1.5 px-5">
      {weights.map(({ label, value }) => (
        <div key={label} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
          <span className="truncate text-[11px] text-neutral-600 dark:text-neutral-400">
            {label}
          </span>
          <span className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
            <span
              className={
                value > 0
                  ? "block h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                  : "block h-full rounded-full bg-neutral-400 dark:bg-neutral-500"
              }
              style={{ width: `${Math.max((Math.abs(value) / max) * 100, 2)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

interface MatchFile {
  kills: { vx: number; vy: number }[];
}

/** Where every victim died on Bind, through the demo's own coordinate transform. */
function KillMapPreview() {
  const match = readJson<MatchFile>("data/valheatmap/bind.json");
  const points = match.kills.map((k) =>
    gameToPlot({ x: k.vx, y: k.vy }, MAP_TRANSFORMS.bind),
  );
  const b = fitBounds(points);
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY);

  return (
    <svg
      viewBox={`${b.minX} ${b.minY} ${b.maxX - b.minX} ${b.maxY - b.minY}`}
      className="size-full p-3"
      preserveAspectRatio="xMidYMid meet"
    >
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={size / 90}
          className="fill-emerald-600/60 dark:fill-emerald-400/60"
        />
      ))}
    </svg>
  );
}

/** The magnifier's offset sampling, as it appears in MyShaders.java. */
function ShaderPreview() {
  const lines = MAGNIFIER_SHADER.trim().split("\n");
  const start = lines.findIndex((l) => l.includes("vec2 position"));
  const excerpt = lines.slice(start, start + 4).map((l) => l.replace(/^ {4}/, ""));
  // Scaled to the card rather than clipped: a cut-off line reads as a
  // rendering fault, not as code. 0.6em is the monospace advance.
  const advance = 6.6;
  const lineHeight = 17;
  const width = Math.max(...excerpt.map((l) => l.length)) * advance;

  return (
    <svg
      viewBox={`0 0 ${width} ${excerpt.length * lineHeight}`}
      className="size-full px-4 py-3 text-neutral-600 dark:text-neutral-400"
      preserveAspectRatio="xMinYMid meet"
    >
      {excerpt.map((line, i) => (
        <text
          key={i}
          x={0}
          y={(i + 1) * lineHeight - 5}
          fontSize={11}
          textLength={line.length > 0 ? line.length * advance : undefined}
          lengthAdjust="spacing"
          xmlSpace="preserve"
          className="fill-current font-mono"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}

const previews: Record<string, () => React.ReactNode> = {
  cc3k: CC3KPreview,
  "league-ml": LeaguePreview,
  valheatmap: KillMapPreview,
  vrvision: ShaderPreview,
};

/** What each preview is drawn from, stated on the card so it is not mistaken for a mockup. */
export function previewSource(slug: string): string | null {
  switch (slug) {
    case "cc3k":
      return "Floor 1, from the game's map file";
    case "league-ml":
      return "The model's five largest weights";
    case "valheatmap":
      return `${readJson<MatchFile>("data/valheatmap/bind.json").kills.length} deaths on Bind`;
    case "vrvision":
      return "From the app's fragment shader";
    default:
      return null;
  }
}

export function DemoPreview({ slug }: { slug: string }) {
  const Preview = previews[slug];
  return Preview ? <Preview /> : null;
}
