import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  MAP_TRANSFORMS,
  fitBounds,
  gameToPlot,
  toViewBox,
  type Point,
} from "./transform";

const DATA_DIR = join(process.cwd(), "public/data/valheatmap");

function loadMatch(slug: string) {
  return JSON.parse(
    readFileSync(join(DATA_DIR, `${slug}.json`), "utf8"),
  ) as {
    map: string;
    mapId: string;
    rounds: number;
    players: { id: number; name: string; team: string }[];
    kills: {
      round: number;
      killer: number;
      victim: number;
      kx: number;
      ky: number;
      vx: number;
      vy: number;
    }[];
  };
}

describe("MAP_TRANSFORMS", () => {
  it("covers all six example maps", () => {
    expect(Object.keys(MAP_TRANSFORMS).sort()).toEqual([
      "ascent",
      "bind",
      "fracture",
      "haven",
      "icebox",
      "split",
    ]);
  });

  it("has a data file for every transform", () => {
    for (const slug of Object.keys(MAP_TRANSFORMS)) {
      expect(existsSync(join(DATA_DIR, `${slug}.json`)), slug).toBe(true);
    }
  });

  it("matches each transform to the mapId in its data file", () => {
    for (const [slug, transform] of Object.entries(MAP_TRANSFORMS)) {
      expect(loadMatch(slug).mapId, slug).toBe(transform.mapId);
    }
  });

  /** World y grows opposite to screen y on every map. */
  it("inverts the y axis everywhere", () => {
    for (const [slug, transform] of Object.entries(MAP_TRANSFORMS)) {
      expect(transform.yMultiplier, slug).toBeLessThan(0);
    }
  });

  it("scales Split to a fifth, as Constants.py does", () => {
    expect(MAP_TRANSFORMS.split.xMultiplier).toBeCloseTo(0.2, 10);
    expect(MAP_TRANSFORMS.split.yMultiplier).toBeCloseTo(-0.2, 10);

    for (const slug of ["ascent", "bind", "fracture", "haven", "icebox"]) {
      expect(MAP_TRANSFORMS[slug].xMultiplier, slug).toBe(1);
    }
  });
});

describe("gameToPlot", () => {
  it("applies multiplier and offset", () => {
    const transform = { ...MAP_TRANSFORMS.ascent, xOffset: 100, yOffset: -50 };
    expect(gameToPlot({ x: 1000, y: 2000 }, transform)).toEqual({
      x: 1100,
      y: -2050,
    });
  });

  it("scales Split coordinates down by five", () => {
    expect(gameToPlot({ x: 5000, y: -5000 }, MAP_TRANSFORMS.split)).toEqual({
      x: 1000,
      y: 1000,
    });
  });

  it("leaves the origin at the origin without offsets", () => {
    expect(gameToPlot({ x: 0, y: 0 }, MAP_TRANSFORMS.ascent)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("fitBounds", () => {
  it("returns a square region so the geometry is not distorted", () => {
    const bounds = fitBounds([
      { x: 0, y: 0 },
      { x: 1000, y: 100 },
    ]);
    expect(bounds.maxX - bounds.minX).toBeCloseTo(bounds.maxY - bounds.minY, 6);
  });

  it("contains every input point", () => {
    const points: Point[] = [
      { x: -500, y: 300 },
      { x: 900, y: -200 },
      { x: 100, y: 100 },
    ];
    const bounds = fitBounds(points);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(point.x).toBeLessThanOrEqual(bounds.maxX);
      expect(point.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(point.y).toBeLessThanOrEqual(bounds.maxY);
    }
  });

  it("survives an empty set and a single point", () => {
    expect(() => fitBounds([])).not.toThrow();
    const single = fitBounds([{ x: 5, y: 5 }]);
    expect(single.maxX).toBeGreaterThan(single.minX);
  });
});

describe("toViewBox", () => {
  const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

  it("maps the corners of the region to the corners of the box", () => {
    expect(toViewBox({ x: 0, y: 0 }, bounds, 1000)).toEqual({ x: 0, y: 0 });
    expect(toViewBox({ x: 100, y: 100 }, bounds, 1000)).toEqual({
      x: 1000,
      y: 1000,
    });
  });

  it("maps the centre to the centre", () => {
    expect(toViewBox({ x: 50, y: 50 }, bounds, 1000)).toEqual({
      x: 500,
      y: 500,
    });
  });
});

describe("real match data", () => {
  const slugs = Object.keys(MAP_TRANSFORMS);

  /**
   * Two of the sample matches upstream (Ascent and Haven) ship a partial roster
   * rather than the full ten players, so this asserts the roster is usable
   * rather than complete.
   */
  it.each(slugs)("%s has usable kills and players", (slug) => {
    const match = loadMatch(slug);
    expect(match.kills.length).toBeGreaterThan(0);
    expect(match.players.length).toBeGreaterThan(0);
    expect(match.players.length).toBeLessThanOrEqual(10);
    expect(match.rounds).toBeGreaterThan(0);
  });

  it.each(slugs)("%s gives every player a distinct id and a name", (slug) => {
    const match = loadMatch(slug);
    const ids = match.players.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const player of match.players) expect(player.name).toBeTruthy();
  });

  it.each(slugs)("%s references only players that exist", (slug) => {
    const match = loadMatch(slug);
    const ids = new Set(match.players.map((p) => p.id));
    for (const kill of match.kills) {
      expect(ids.has(kill.killer)).toBe(true);
      expect(ids.has(kill.victim)).toBe(true);
    }
  });

  /**
   * The real check on the transform: every kill must land inside the fitted
   * viewport. A wrong multiplier or a dropped sign puts points outside it.
   */
  it.each(slugs)("%s plots every kill inside the viewport", (slug) => {
    const match = loadMatch(slug);
    const transform = MAP_TRANSFORMS[slug];

    const points = match.kills.flatMap((kill) => [
      gameToPlot({ x: kill.kx, y: kill.ky }, transform),
      gameToPlot({ x: kill.vx, y: kill.vy }, transform),
    ]);
    const bounds = fitBounds(points);

    for (const point of points) {
      const view = toViewBox(point, bounds, 1000);
      expect(view.x).toBeGreaterThanOrEqual(0);
      expect(view.x).toBeLessThanOrEqual(1000);
      expect(view.y).toBeGreaterThanOrEqual(0);
      expect(view.y).toBeLessThanOrEqual(1000);
    }
  });

  it("keeps Split's plotted extent comparable to the other maps", () => {
    // Split's raw coordinates are five times larger; after the transform its
    // plotted span should be the same order as everything else. This is what
    // the 1/5 multiplier is for, so it is worth asserting rather than assuming.
    const spans = Object.keys(MAP_TRANSFORMS).map((slug) => {
      const match = loadMatch(slug);
      const transform = MAP_TRANSFORMS[slug];
      const points = match.kills.map((kill) =>
        gameToPlot({ x: kill.kx, y: kill.ky }, transform),
      );
      const bounds = fitBounds(points);
      return bounds.maxX - bounds.minX;
    });

    expect(Math.max(...spans) / Math.min(...spans)).toBeLessThan(10);
  });
});
