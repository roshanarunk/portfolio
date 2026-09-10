import { describe, it, expect } from "vitest";
import {
  BUILDING,
  findFloor,
  findRoute,
  nodeById,
  rooms,
} from "./pathfinding";

describe("findFloor", () => {
  /** Room numbers encode the floor in the first digit, as in the Kotlin source. */
  it("reads the floor from the first digit", () => {
    expect(findFloor(101)).toBe(1);
    expect(findFloor(305)).toBe(3);
    expect(findFloor(495)).toBe(4);
  });
});

describe("the building graph", () => {
  it("has rooms on every floor", () => {
    for (const floor of BUILDING.floors) {
      const onFloor = rooms(BUILDING).filter((r) => findFloor(r.id) === floor);
      expect(onFloor.length, `floor ${floor}`).toBeGreaterThan(0);
    }
  });

  it("gives every edge two real endpoints", () => {
    for (const edge of BUILDING.edges) {
      expect(nodeById(BUILDING, edge.from), String(edge.from)).toBeDefined();
      expect(nodeById(BUILDING, edge.to), String(edge.to)).toBeDefined();
      expect(edge.weight).toBeGreaterThan(0);
    }
  });

  it("has both a staircase and an elevator on every floor", () => {
    for (const floor of BUILDING.floors) {
      const onFloor = BUILDING.nodes.filter((n) => findFloor(n.id) === floor);
      expect(onFloor.some((n) => n.kind === "stairs"), `floor ${floor}`).toBe(true);
      expect(onFloor.some((n) => n.kind === "elevator"), `floor ${floor}`).toBe(true);
    }
  });

  it("keeps every node inside the floor plan", () => {
    for (const node of BUILDING.nodes) {
      expect(node.x, node.label).toBeGreaterThanOrEqual(0);
      expect(node.x, node.label).toBeLessThanOrEqual(1);
      expect(node.y, node.label).toBeGreaterThanOrEqual(0);
      expect(node.y, node.label).toBeLessThanOrEqual(1);
    }
  });
});

describe("findRoute", () => {
  it("routes between two rooms on the same floor without changing floor", () => {
    const route = findRoute(BUILDING, 101, 105)!;
    expect(route).not.toBeNull();
    expect(route.floors).toEqual([1]);
    expect(route.transitions).toBe(0);
  });

  it("returns a zero-length route to the starting room", () => {
    const route = findRoute(BUILDING, 101, 101)!;
    expect(route.distance).toBe(0);
    expect(route.path).toEqual([101]);
  });

  it("starts and ends where it was asked to", () => {
    const route = findRoute(BUILDING, 102, 403)!;
    expect(route.path[0]).toBe(102);
    expect(route.path.at(-1)).toBe(403);
  });

  it("crosses floors when it has to", () => {
    const route = findRoute(BUILDING, 101, 401)!;
    expect(route.floors).toEqual([1, 2, 3, 4]);
    expect(route.transitions).toBe(3);
  });

  it("returns a connected path", () => {
    const route = findRoute(BUILDING, 103, 302)!;
    for (let i = 1; i < route.path.length; i++) {
      const a = route.path[i - 1];
      const b = route.path[i];
      const joined = BUILDING.edges.some(
        (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
      );
      expect(joined, `${a} → ${b} is not an edge`).toBe(true);
    }
  });

  it("reports a distance matching the edges it walked", () => {
    const route = findRoute(BUILDING, 101, 305)!;
    let sum = 0;
    for (let i = 1; i < route.path.length; i++) {
      const a = route.path[i - 1];
      const b = route.path[i];
      const edge = BUILDING.edges.find(
        (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
      )!;
      sum += edge.weight;
    }
    expect(sum).toBe(route.distance);
  });

  /**
   * The property the whole design rests on: searching the building as one graph
   * must never cost more than any particular route through it.
   */
  it("is at least as short as a route forced through the elevator", () => {
    const free = findRoute(BUILDING, 101, 401)!;
    const viaLift = findRoute(BUILDING, 101, 401, { avoidStairs: true })!;
    expect(free.distance).toBeLessThanOrEqual(viaLift.distance);
  });

  it("is symmetric, since the graph is undirected", () => {
    const there = findRoute(BUILDING, 102, 304)!;
    const back = findRoute(BUILDING, 304, 102)!;
    expect(there.distance).toBe(back.distance);
  });

  it("finds a route between every pair of rooms", () => {
    const all = rooms(BUILDING);
    for (const from of all) {
      for (const to of all) {
        expect(findRoute(BUILDING, from.id, to.id), `${from.id} → ${to.id}`)
          .not.toBeNull();
      }
    }
  });
});

describe("avoiding stairs", () => {
  it("uses no staircase when asked not to", () => {
    const route = findRoute(BUILDING, 101, 401, { avoidStairs: true })!;
    const kinds = route.path.map((id) => nodeById(BUILDING, id)!.kind);
    expect(kinds).not.toContain("stairs");
    expect(kinds).toContain("elevator");
  });

  it("still reaches every floor without stairs", () => {
    for (const floor of BUILDING.floors) {
      const target = rooms(BUILDING).find((r) => findFloor(r.id) === floor)!;
      const route = findRoute(BUILDING, 101, target.id, { avoidStairs: true });
      expect(route, `floor ${floor}`).not.toBeNull();
    }
  });

  it("costs no less than the unrestricted route", () => {
    // Removing options can only ever make the best route longer or equal.
    for (const target of [201, 301, 401]) {
      const free = findRoute(BUILDING, 101, target)!;
      const lift = findRoute(BUILDING, 101, target, { avoidStairs: true })!;
      expect(lift.distance).toBeGreaterThanOrEqual(free.distance);
    }
  });

  it("leaves same-floor routes untouched", () => {
    const free = findRoute(BUILDING, 101, 105)!;
    const lift = findRoute(BUILDING, 101, 105, { avoidStairs: true })!;
    expect(lift.distance).toBe(free.distance);
  });
});
