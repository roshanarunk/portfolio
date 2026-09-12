/**
 * Multi-building routing, ported from the Kotlin original.
 *
 * The real app does NOT run one search across both buildings. `drawPath`
 * concatenates two separate searches through fixed bridge nodes — MC node 30
 * and DC node 28521 — and the interface then walks you through the join in
 * stages: route to the transition on your current floor, be told which floor
 * the bridge is on, cross it, then route again in the destination building.
 *
 * That staging is reproduced here as an ordered list of legs, each carrying the
 * notification the app would raise at that point. The University's floor plans
 * are not reproduced (see the project page), so the same structure sits over a
 * synthetic building with real-looking room numbers.
 *
 * Room numbers encode their floor in the first digit, as in the Kotlin source.
 */

export type BuildingId = "MC" | "DC";

export interface Node {
  id: number;
  building: BuildingId;
  /** What the app would show: a room number, or a named feature. */
  label: string;
  /** Short glyph drawn on the plan so a node is identifiable at a glance. */
  glyph: string;
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
  /** The node where this building meets the link bridge. */
  bridgeNode: number;
  /** The floor that bridge sits on. */
  bridgeFloor: number;
}

export interface Campus {
  buildings: Building[];
  nodes: Node[];
  edges: Edge[];
}

/** First digit of a room number is its floor, as in the Kotlin `findFloor`. */
export function findFloor(id: number): number {
  return Number(String(Math.abs(id) % 10000)[0]);
}

/** The Kotlin uses `nodeId < 1000` to mean MC; the same split applies here. */
const DC_OFFSET = 20000;

export function buildingOf(id: number): BuildingId {
  return id >= DC_OFFSET ? "DC" : "MC";
}

/** Bridge endpoints, mirroring the app's hard-coded node 30 and node 28521. */
export const MC_BRIDGE = 330;
export const DC_BRIDGE = DC_OFFSET + 2521;

function makeCampus(): Campus {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const perFloor = 5;

  const spec: {
    id: BuildingId;
    name: string;
    floors: number[];
    offset: number;
    bridgeFloor: number;
    bridgeNode: number;
  }[] = [
    {
      id: "MC",
      name: "Mathematics and Computer (MC)",
      floors: [1, 2, 3, 4],
      offset: 0,
      bridgeFloor: 3,
      bridgeNode: MC_BRIDGE,
    },
    {
      id: "DC",
      name: "Davis Centre (DC)",
      floors: [1, 2, 3],
      offset: DC_OFFSET,
      bridgeFloor: 2,
      bridgeNode: DC_BRIDGE,
    },
  ];

  for (const building of spec) {
    for (const floor of building.floors) {
      const base = building.offset + floor * 100;

      for (let i = 0; i < perFloor; i++) {
        const id = base + 50 + i;
        nodes.push({
          id,
          building: building.id,
          label: `${building.id} corridor`,
          glyph: "",
          x: 0.12 + (i * 0.76) / (perFloor - 1),
          y: 0.5,
          kind: "hallway",
        });
        if (i > 0) edges.push({ from: id - 1, to: id, weight: 12 });
      }

      // Rooms are numbered the way the app's picker lists them: floor digit
      // then a two-digit room, e.g. 1023, 3048.
      for (let i = 0; i < perFloor; i++) {
        const corridor = base + 50 + i;
        const id = base + i + 1;
        const roomNumber = `${floor}${String(11 + i * 13).padStart(3, "0")}`;
        nodes.push({
          id,
          building: building.id,
          label: `${building.id} ${roomNumber}`,
          glyph: roomNumber,
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
        label: `Stairwell, floor ${floor}`,
        glyph: "Stairs",
        x: 0.04,
        y: 0.5,
        kind: "stairs",
      });
      edges.push({ from: stairId, to: base + 50, weight: 6 });

      const liftId = base + 95;
      nodes.push({
        id: liftId,
        building: building.id,
        label: `Elevator, floor ${floor}`,
        glyph: "Lift",
        x: 0.96,
        y: 0.5,
        kind: "elevator",
      });
      edges.push({ from: liftId, to: base + 50 + perFloor - 1, weight: 6 });
    }

    for (let i = 0; i < building.floors.length - 1; i++) {
      const lower = building.offset + building.floors[i] * 100;
      const upper = building.offset + building.floors[i + 1] * 100;
      edges.push({ from: lower + 90, to: upper + 90, weight: 20 });
      edges.push({ from: lower + 95, to: upper + 95, weight: 32 });
    }
  }

  // Bridge endpoints. Each is an ordinary node inside its own building; the
  // crossing between them is handled as a separate leg, not an edge, because
  // the app searches each building independently.
  nodes.push({
    id: MC_BRIDGE,
    building: "MC",
    label: "Link bridge to DC",
    glyph: "DC Link",
    x: 0.5,
    y: 0.08,
    kind: "link",
  });
  nodes.push({
    id: DC_BRIDGE,
    building: "DC",
    label: "Link bridge to MC",
    glyph: "MC Link",
    x: 0.5,
    y: 0.92,
    kind: "link",
  });
  edges.push({ from: MC_BRIDGE, to: 352, weight: 8 });
  edges.push({ from: DC_BRIDGE, to: DC_OFFSET + 252, weight: 8 });

  return {
    buildings: spec.map(({ id, name, floors, bridgeNode, bridgeFloor }) => ({
      id,
      name,
      floors,
      bridgeNode,
      bridgeFloor,
    })),
    nodes,
    edges,
  };
}

export const CAMPUS = makeCampus();

export interface RouteOptions {
  /** Excludes staircases, so the route is usable without taking stairs. */
  avoidStairs?: boolean;
}

/**
 * One stage of a journey: a path the visitor walks on a single floor of a
 * single building, plus the instruction the app gives when they reach its end.
 */
export interface Leg {
  building: BuildingId;
  floor: number;
  /** Node ids walked on this floor, in order. */
  path: number[];
  /** The app's toast at the end of this leg, e.g. "Take DC Link". */
  notice: string;
}

export interface Journey {
  legs: Leg[];
  distance: number;
  /** Every node in order, across all legs. */
  path: number[];
}

/** Dijkstra within one building. The Kotlin uses a PriorityQueue; same result. */
function search(
  campus: Campus,
  start: number,
  end: number,
  options: RouteOptions,
): { path: number[]; distance: number } | null {
  const building = buildingOf(start);
  const blocked = new Set(
    options.avoidStairs
      ? campus.nodes.filter((n) => n.kind === "stairs").map((n) => n.id)
      : [],
  );
  if (blocked.has(start) || blocked.has(end)) return null;

  const inBuilding = (id: number) => buildingOf(id) === building;

  const adjacency = new Map<number, { to: number; weight: number }[]>();
  for (const edge of campus.edges) {
    if (!inBuilding(edge.from) || !inBuilding(edge.to)) continue;
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
    if (!inBuilding(node.id) || blocked.has(node.id)) continue;
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
  return { path, distance: total };
}

/** Splits a single-building path into one leg per floor. */
function toLegs(campus: Campus, path: number[]): Leg[] {
  const legs: Leg[] = [];
  for (const id of path) {
    const building = buildingOf(id);
    const floor = findFloor(id);
    const last = legs.at(-1);
    if (last && last.building === building && last.floor === floor) {
      last.path.push(id);
    } else {
      legs.push({ building, floor, path: [id], notice: "" });
    }
  }
  return legs;
}

/**
 * Plans a journey the way the app does.
 *
 * Within one building it is a single search, with a "Head to Floor N" notice
 * when the destination is on another floor. Across buildings it is two
 * searches joined at the bridge, with a notice telling you which floor the
 * bridge is on and then to take the link.
 */
export function planJourney(
  campus: Campus,
  start: number,
  end: number,
  options: RouteOptions = {},
): Journey | null {
  const startBuilding = buildingOf(start);
  const endBuilding = buildingOf(end);

  if (startBuilding === endBuilding) {
    const found = search(campus, start, end, options);
    if (!found) return null;
    const legs = toLegs(campus, found.path);

    // "Head to Floor N" when the journey leaves the floor you are on.
    for (let i = 0; i < legs.length - 1; i++) {
      legs[i].notice = `Head to Floor ${legs[i + 1].floor}`;
    }
    return { legs, distance: found.distance, path: found.path };
  }

  const from = campus.buildings.find((b) => b.id === startBuilding)!;
  const to = campus.buildings.find((b) => b.id === endBuilding)!;

  const first = search(campus, start, from.bridgeNode, options);
  const second = search(campus, to.bridgeNode, end, options);
  if (!first || !second) return null;

  const firstLegs = toLegs(campus, first.path);
  const secondLegs = toLegs(campus, second.path);

  // Inside the first building, each floor change is announced as usual.
  for (let i = 0; i < firstLegs.length - 1; i++) {
    firstLegs[i].notice = `Head to Floor ${firstLegs[i + 1].floor}`;
  }
  // At the bridge floor, the app tells you to take the link.
  firstLegs[firstLegs.length - 1].notice = `Take ${to.id} Link`;

  for (let i = 0; i < secondLegs.length - 1; i++) {
    secondLegs[i].notice = `Head to Floor ${secondLegs[i + 1].floor}`;
  }

  return {
    legs: [...firstLegs, ...secondLegs],
    distance: first.distance + second.distance,
    path: [...first.path, ...second.path],
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

/** The leg of a journey shown on a given floor, if any. */
export function legFor(
  journey: Journey | null,
  building: BuildingId,
  floor: number,
): Leg | undefined {
  return journey?.legs.find(
    (l) => l.building === building && l.floor === floor,
  );
}
