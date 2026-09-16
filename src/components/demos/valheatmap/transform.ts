/**
 * Coordinate handling for the Valorant kill map.
 *
 * Valorant reports positions in world space, with a different origin and
 * orientation per map. ValHeatMap's utils.py maps them onto the minimap with
 *
 *     plot = game * multiplier + offset
 *
 * and the per-map multipliers from Constants.py, ported below. Note the y
 * multipliers are negative: world y grows the opposite way to screen y.
 */

export interface MapTransform {
  /** Display name. */
  name: string;
  /** Riot's internal map path, as it appears in matchInfo.mapId. */
  mapId: string;
  xMultiplier: number;
  yMultiplier: number;
  xOffset: number;
  yOffset: number;
}

/** Ported from Constants.py in the ValHeatMap repo. */
export const MAP_TRANSFORMS: Record<string, MapTransform> = {
  ascent: {
    name: "Ascent",
    mapId: "/Game/Maps/Ascent/Ascent",
    xMultiplier: 1,
    yMultiplier: -1,
    xOffset: 0,
    yOffset: 0,
  },
  bind: {
    name: "Bind",
    mapId: "/Game/Maps/Duality/Duality",
    xMultiplier: 1,
    yMultiplier: -1,
    xOffset: 0,
    yOffset: 0,
  },
  fracture: {
    name: "Fracture",
    mapId: "/Game/Maps/Canyon/Canyon",
    xMultiplier: 1,
    yMultiplier: -1,
    xOffset: 0,
    yOffset: 0,
  },
  haven: {
    name: "Haven",
    mapId: "/Game/Maps/Triad/Triad",
    xMultiplier: 1,
    yMultiplier: -1,
    xOffset: 0,
    yOffset: 0,
  },
  icebox: {
    name: "Icebox",
    mapId: "/Game/Maps/Port/Port",
    xMultiplier: 1,
    yMultiplier: -1,
    xOffset: 0,
    yOffset: 0,
  },
  // Split alone is reported at five times the scale of the other maps.
  split: {
    name: "Split",
    mapId: "/Game/Maps/Bonsai/Bonsai",
    xMultiplier: 1 / 5,
    yMultiplier: -1 / 5,
    xOffset: 0,
    yOffset: 0,
  },
};

export interface Point {
  x: number;
  y: number;
}

/** Applies the per-map transform, matching plot_x/plot_y in utils.py. */
export function gameToPlot(point: Point, transform: MapTransform): Point {
  return {
    x: point.x * transform.xMultiplier + transform.xOffset,
    y: point.y * transform.yMultiplier + transform.yOffset,
  };
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Fits a square viewport around the plotted points.
 *
 * The upstream project draws onto per-map minimap images, which are not in the
 * repo. Deriving the extent from the kills instead keeps the demo free of Riot
 * artwork and self-contained; the square keeps both axes at the same scale so
 * the geometry is not distorted.
 */
export function fitBounds(points: Point[], padding = 0.08): Bounds {
  if (points.length === 0) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;
  // A single span for both axes preserves the aspect ratio.
  const span = Math.max(maxX - minX, maxY - minY, 1) * (1 + padding * 2);

  return {
    minX: centreX - span / 2,
    maxX: centreX + span / 2,
    minY: centreY - span / 2,
    maxY: centreY + span / 2,
  };
}

/** Maps a plotted point into an SVG viewBox of the given size. */
export function toViewBox(point: Point, bounds: Bounds, size: number): Point {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  return {
    x: ((point.x - bounds.minX) / width) * size,
    y: ((point.y - bounds.minY) / height) * size,
  };
}
