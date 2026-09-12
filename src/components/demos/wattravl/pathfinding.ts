/**
 * Dijkstra over a multi-building, multi-floor graph, ported from the Kotlin
 * original.
 *
 * The real app walks hand-mapped hallway nodes across two University of
 * Waterloo buildings — MC and DC — joined by a link bridge, and renders one
 * floor at a time over the building's own floor-plan SVG. Those plans are not
 * reproduced here (see the project page), so this uses a synthetic building of
 * the same shape: rooms off a corridor on each floor, stairs at one end, a lift
 * at the other, and a link between the two buildings on a single floor.
 *
 * What is preserved is the part that matters: floor and building transitions
 * are ordinary weighted edges, so one search spans everything and picks the
 * staircase or bridge that suits the whole journey.
 *
 * Room numbers encode their floor in the first digit, exactly as in the source.
 */

export type BuildingId = "MC" | "DC";

export interface Node {
  id: number;
  building: BuildingId;
  label: string;
  /** Position on that floor's plan, 0-1 in both axes. */
  x: number;
  y: number;
  kind: "room" | "hallway" | "stairs" | "elevator" | "link";
}

export interface Edge {
  from: number;
  to: number;
  weight: number;
}

export interface Building {
  id: BuildingId;
  name: string;
  floors: number[];
}

export interface Campus {
  buildings: Building[];
  nodes: Node[];
  edges: Edge[];
}

/** First digit of a room number is its floor, as in the Kotlin `findFloor`. */
export function findFloor(id: number): number {
  return Number(String(Math.abs(id) % 1000)[0]);
}

/** DC ids are offset so the two buildings never collide. */
const DC_OFFSET = 10000;

export function buildingOf(id: number): BuildingId {
  return id >= DC_OFFSET ? "DC" : "MC";
}

/**
 * Builds two buildings of the same shape: a corridor per floor with rooms off
 * it, stairs at one end and a lift at the other. MC has four floors, DC has
 * three, and a link bridge joins them on one floor only — which is what forces
 * a cross-building route through a specific level, as it does in the real app.
 */
function makeCampus(): Campus {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const perFloor = 5;

  const spec: { id: BuildingId; name: string; floors: number[]; offset: number }[] = [
    { id: "MC", name: "Math & Computer", floors: [1, 2, 3, 4], offset: 0 },
    { id: "DC", name: "Davis Centre", floors: [1, 2, 3], offset: DC_OFFSET },
  ];

  for (const building of spec) {
    for (const floor of building.floors) {
      const base = building.offset + floor * 100;

      for (let i = 0; i < perFloor; i++) {
        const id = base + 50 + i;
        nodes.push({
          id,
          building: building.id,
          label: `Corridor ${floor}-${i + 1}`,
          x: 0.12 + (i * 0.76) / (perFloor - 1),
          y: 0.5,
          kind: "hallway",
        });
        if (i > 0) edges.push({ from: id - 1, to: id, weight: 12 });
      }

      for (let i = 0; i < perFloor; i++) {
        const corridor = base + 50 + i;
        const id = base + i + 1;
        nodes.push({
          id,
          building: building.id,
          label: `${building.id} ${floor}${String(i + 1).padStart(2, "0")}`,
          x: 0.12 + (i * 0.76) / (perFloor - 1),
          y: i % 2 === 0 ? 0.22 : 0.78,
          kind: "room",
        });
        edges.push({ from: corridor, to: id, weight: 5 });
      }

      const stairId = base + 90;
      nodes.push({
        id: stairId,
        building: building.id,
        label: `Stairs ${floor}`,
        x: 0.04,
        y: 0.5,
        kind: "stairs",
      });
      edges.push({ from: stairId, to: base + 50, weight: 6 });

      const liftId = base + 95;
      nodes.push({
        id: liftId,
        building: building.id,
        label: `Elevator ${floor}`,
        x: 0.96,
        y: 0.5,
        kind: "elevator",
      });
      edges.push({ from: liftId, to: base + 50 + perFloor - 1, weight: 6 });
    }

    // Stairs are quicker per floor than waiting for a lift, so the choice is
    // a real one rather than automatic.
    for (let i = 0; i < building.floors.length - 1; i++) {
      const lower = building.offset + building.floors[i] * 100;
      const upper = building.offset + building.floors[i + 1] * 100;
      edges.push({ from: lower + 90, to: upper + 90, weight: 20 });
      edges.push({ from: lower + 95, to: upper + 95, weight: 32 });
    }
  }

  // The link bridge: MC floor 3 to DC floor 2, mirroring the real app's single
  // crossing point between the two buildings.
  const mcLink = 380;
  const dcLink = DC_OFFSET + 280;
  nodes.push({
    id: mcLink,
    building: "MC",
    label: "Link to DC",
    x: 0.5,
    y: 0.06,
    kind: "link",
  });
  nodes.push({
    id: dcLink,
    building: "DC",
    label: "Link to MC",
    x: 0.5,
    y: 0.94,
    kind: "link",
  });
  edges.push({ from: mcLink, to: 352, weight: 8 });
  edges.push({ from: dcLink, to: DC_OFFSET + 252, weight: 8 });
  edges.push({ from: mcLink, to: dcLink, weight: 45 });

  return {
    buildings: spec.map(({ id, name, floors }) => ({ id, name, floors })),
    nodes,
    edges,
  };
}

export const CAMPUS = makeCampus();

export interface Route {
  path: number[];
  distance: number;
  /** Floors the route passes through, as building/floor pairs, in order. */
  legs: { building: BuildingId; floor: number }[];
  transitions: number;
  /** The app's toast text, e.g. "Head to Floor 3". Empty when none is shown. */
  toast: string;
}

export interface RouteOptions {
  /**
   * Excludes staircases, which is what makes the route usable for someone who
   * cannot take stairs. In the original this is the same switch between the
   * `staircases` and `elevators` maps.
   */
  avoidStairs?: boolean;
}

/**
 * Shortest path by Dijkstra.
 *
 * The Kotlin version uses a PriorityQueue; this uses a linear scan for the
 * minimum, which is the same algorithm and indistinguishable at this size.
 */
export function findRoute(
  campus: Campus,
  start: number,
  end: number,
  options: RouteOptions = {},
): Route | null {
  const blocked = new Set(
    options.avoidStairs
      ? campus.nodes.filter((n) => n.kind === "stairs").map((n) => n.id)
      : [],
  );

  if (blocked.has(start) || blocked.has(end)) return null;

  const adjacency = new Map<number, { to: number; weight: number }[]>();
  for (const edge of campus.edges) {
    if (blocked.has(edge.from) || blocked.has(edge.to)) continue;
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    adjacency.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
  }

  const distances = new Map<number, number>();
  const previous = new Map<number, number>();
  const unvisited = new Set<number>();

  for (const node of campus.nodes) {
    if (blocked.has(node.id)) continue;
    distances.set(node.id, Infinity);
    unvisited.add(node.id);
  }
  if (!distances.has(start) || !distances.has(end)) return null;
  distances.set(start, 0);

  while (unvisited.size > 0) {
    let current: number | null = null;
    let best = Infinity;
    for (const id of unvisited) {
      const d = distances.get(id)!;
      if (d < best) {
        best = d;
        current = id;
      }
    }

    if (current === null || best === Infinity) break;
    if (current === end) break;

    unvisited.delete(current);

    for (const { to, weight } of adjacency.get(current) ?? []) {
      if (!unvisited.has(to)) continue;
      const candidate = best + weight;
      if (candidate < distances.get(to)!) {
        distances.set(to, candidate);
        previous.set(to, current);
      }
    }
  }

  const total = distances.get(end);
  if (total === undefined || total === Infinity) return null;

  const path: number[] = [];
  let step: number | undefined = end;
  while (step !== undefined) {
    path.unshift(step);
    step = previous.get(step);
  }
  if (path[0] !== start) return null;

  const legs: { building: BuildingId; floor: number }[] = [];
  for (const id of path) {
    const building = buildingOf(id);
    const floor = findFloor(id);
    const last = legs.at(-1);
    if (!last || last.building !== building || last.floor !== floor) {
      legs.push({ building, floor });
    }
  }

  // The real app raises a toast when the route leaves the floor you are on.
  const startFloor = findFloor(start);
  const endFloor = findFloor(end);
  const crossesBuilding = buildingOf(start) !== buildingOf(end);
  let toast = "";
  if (crossesBuilding) {
    toast = `Go to Floor ${findFloor(legs.find((l) => l.building !== buildingOf(start))?.floor ?? endFloor)}`;
  } else if (startFloor !== endFloor) {
    toast = `Head to Floor ${endFloor}`;
  }

  return {
    path,
    distance: total,
    legs,
    transitions: Math.max(0, legs.length - 1),
    toast,
  };
}

export function nodeById(campus: Campus, id: number): Node | undefined {
  return campus.nodes.find((n) => n.id === id);
}

/** Rooms only — the places a person actually asks to be routed between. */
export function rooms(campus: Campus, building?: BuildingId): Node[] {
  return campus.nodes.filter(
    (n) => n.kind === "room" && (!building || n.building === building),
  );
}

/**
 * The first floor of `building` that this route actually passes through.
 *
 * Switching the building picker used to keep the current floor number if it
 * happened to exist in the new building, which could land on a floor the route
 * never touches and show an empty map with no explanation.
 */
export function firstFloorIn(
  route: Route | null,
  building: BuildingId,
  fallback: number,
): number {
  const leg = route?.legs.find((l) => l.building === building);
  return leg ? leg.floor : fallback;
}

/** Nodes drawn on one floor of one building. */
export function nodesOnFloor(
  campus: Campus,
  building: BuildingId,
  floor: number,
): Node[] {
  return campus.nodes.filter(
    (n) => n.building === building && findFloor(n.id) === floor,
  );
}
