/**
 * Dijkstra over a multi-floor building graph, ported from the Kotlin original.
 *
 * The real app walks a hand-mapped graph of every hallway node in the building.
 * This demo uses a smaller representative building with the same structure:
 * rooms along corridors on each floor, joined between floors by staircases and
 * elevators. What matters is the property the original demonstrates — that
 * floor transitions are ordinary weighted edges, so one search spans the whole
 * building and picks the staircase that suits the entire route.
 *
 * Room numbers encode their floor in the first digit, exactly as in the source.
 */

export interface Node {
  id: number;
  label: string;
  /** Position on that floor's plan, 0-1 in both axes. */
  x: number;
  y: number;
  kind: "room" | "hallway" | "stairs" | "elevator";
}

export interface Edge {
  from: number;
  to: number;
  weight: number;
}

export interface Building {
  name: string;
  floors: number[];
  nodes: Node[];
  edges: Edge[];
}

/** First digit of a room number is its floor, as in the Kotlin `findFloor`. */
export function findFloor(id: number): number {
  return Number(String(id)[0]);
}

/**
 * Builds a four-floor building: a corridor of hallway nodes per floor with
 * rooms hanging off it, plus a staircase at one end and an elevator at the
 * other. The asymmetry is the point — the better transition depends on where
 * you start and where you are going.
 */
function makeBuilding(): Building {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const floors = [1, 2, 3, 4];
  const perFloor = 5;

  for (const floor of floors) {
    // Corridor running left to right.
    for (let i = 0; i < perFloor; i++) {
      const id = floor * 100 + 50 + i;
      nodes.push({
        id,
        label: `Corridor ${floor}-${i + 1}`,
        x: 0.12 + (i * 0.76) / (perFloor - 1),
        y: 0.5,
        kind: "hallway",
      });
      if (i > 0) {
        edges.push({ from: id - 1, to: id, weight: 12 });
      }
    }

    // Rooms alternating above and below the corridor.
    for (let i = 0; i < perFloor; i++) {
      const corridor = floor * 100 + 50 + i;
      const id = floor * 100 + i + 1;
      const above = i % 2 === 0;
      nodes.push({
        id,
        label: `Room ${id}`,
        x: 0.12 + (i * 0.76) / (perFloor - 1),
        y: above ? 0.22 : 0.78,
        kind: "room",
      });
      edges.push({ from: corridor, to: id, weight: 5 });
    }

    // Stairs at the left end, elevator at the right.
    const stairId = floor * 100 + 90;
    nodes.push({
      id: stairId,
      label: `Stairs ${floor}`,
      x: 0.04,
      y: 0.5,
      kind: "stairs",
    });
    edges.push({ from: stairId, to: floor * 100 + 50, weight: 6 });

    const liftId = floor * 100 + 95;
    nodes.push({
      id: liftId,
      label: `Elevator ${floor}`,
      x: 0.96,
      y: 0.5,
      kind: "elevator",
    });
    edges.push({ from: liftId, to: floor * 100 + 50 + perFloor - 1, weight: 6 });
  }

  // Floor transitions. Stairs are quicker per floor than waiting for a lift,
  // which is what makes the choice interesting rather than automatic.
  for (let i = 0; i < floors.length - 1; i++) {
    const lower = floors[i];
    const upper = floors[i + 1];
    edges.push({ from: lower * 100 + 90, to: upper * 100 + 90, weight: 20 });
    edges.push({ from: lower * 100 + 95, to: upper * 100 + 95, weight: 32 });
  }

  return { name: "Demo Hall", floors, nodes, edges };
}

export const BUILDING = makeBuilding();

export interface Route {
  path: number[];
  distance: number;
  /** Floors the route passes through, in order. */
  floors: number[];
  /** How many times the route changes floor. */
  transitions: number;
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
  building: Building,
  start: number,
  end: number,
  options: RouteOptions = {},
): Route | null {
  const blocked = new Set(
    options.avoidStairs
      ? building.nodes.filter((n) => n.kind === "stairs").map((n) => n.id)
      : [],
  );

  if (blocked.has(start) || blocked.has(end)) return null;

  // Undirected graph, so every edge goes into the adjacency list both ways.
  const adjacency = new Map<number, { to: number; weight: number }[]>();
  for (const edge of building.edges) {
    if (blocked.has(edge.from) || blocked.has(edge.to)) continue;
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    adjacency.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
  }

  const distances = new Map<number, number>();
  const previous = new Map<number, number>();
  const unvisited = new Set<number>();

  for (const node of building.nodes) {
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

    // Everything still unvisited is unreachable from the start.
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

  const floors: number[] = [];
  for (const id of path) {
    const floor = findFloor(id);
    if (floors.at(-1) !== floor) floors.push(floor);
  }

  return {
    path,
    distance: total,
    floors,
    transitions: Math.max(0, floors.length - 1),
  };
}

export function nodeById(building: Building, id: number): Node | undefined {
  return building.nodes.find((n) => n.id === id);
}

/** Rooms only — the places a person actually asks to be routed between. */
export function rooms(building: Building): Node[] {
  return building.nodes.filter((n) => n.kind === "room");
}
