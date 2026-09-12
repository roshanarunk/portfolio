import { describe, it, expect } from "vitest";
import {
  CAMPUS,
  buildingOf,
  findFloor,
  findRoute,
  nodeById,
  nodesOnFloor,
  rooms,
  type BuildingId,
} from "./pathfinding";

describe("findFloor", () => {
  /** Room numbers encode the floor in the first digit, as in the Kotlin source. */
  it("reads the floor from the first digit", () => {
    expect(findFloor(101)).toBe(1);
    expect(findFloor(305)).toBe(3);
    expect(findFloor(495)).toBe(4);
  });

  it("reads it the same way for the offset building", () => {
    expect(findFloor(10201)).toBe(2);
    expect(findFloor(10395)).toBe(3);
  });
});

describe("buildingOf", () => {
  it("separates the two buildings by id range", () => {
    expect(buildingOf(101)).toBe("MC");
    expect(buildingOf(10201)).toBe("DC");
  });
});

describe("the campus graph", () => {
  it("has both buildings", () => {
    expect(CAMPUS.buildings.map((b) => b.id).sort()).toEqual(["DC", "MC"]);
  });

  it("has rooms on every floor of every building", () => {
    for (const building of CAMPUS.buildings) {
      for (const floor of building.floors) {
        const onFloor = nodesOnFloor(CAMPUS, building.id, floor).filter(
          (n) => n.kind === "room",
        );
        expect(onFloor.length, `${building.id} floor ${floor}`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every edge two real endpoints and a positive weight", () => {
    for (const edge of CAMPUS.edges) {
      expect(nodeById(CAMPUS, edge.from), String(edge.from)).toBeDefined();
      expect(nodeById(CAMPUS, edge.to), String(edge.to)).toBeDefined();
      expect(edge.weight).toBeGreaterThan(0);
    }
  });

  it("has stairs and a lift on every floor", () => {
    for (const building of CAMPUS.buildings) {
      for (const floor of building.floors) {
        const kinds = nodesOnFloor(CAMPUS, building.id, floor).map((n) => n.kind);
        expect(kinds, `${building.id} ${floor}`).toContain("stairs");
        expect(kinds, `${building.id} ${floor}`).toContain("elevator");
      }
    }
  });

  it("keeps every node inside its floor plan", () => {
    for (const node of CAMPUS.nodes) {
      expect(node.x, node.label).toBeGreaterThanOrEqual(0);
      expect(node.x, node.label).toBeLessThanOrEqual(1);
      expect(node.y, node.label).toBeGreaterThanOrEqual(0);
      expect(node.y, node.label).toBeLessThanOrEqual(1);
    }
  });

  it("joins the buildings at exactly one crossing", () => {
    const links = CAMPUS.edges.filter((e) => {
      const a = nodeById(CAMPUS, e.from)!;
      const b = nodeById(CAMPUS, e.to)!;
      return a.building !== b.building;
    });
    expect(links).toHaveLength(1);
  });
});

describe("findRoute", () => {
  it("routes within one floor without changing floor", () => {
    const route = findRoute(CAMPUS, 101, 105)!;
    expect(route).not.toBeNull();
    expect(route.legs).toEqual([{ building: "MC", floor: 1 }]);
    expect(route.transitions).toBe(0);
  });

  it("returns a zero-length route to the starting room", () => {
    const route = findRoute(CAMPUS, 101, 101)!;
    expect(route.distance).toBe(0);
    expect(route.path).toEqual([101]);
  });

  it("starts and ends where it was asked to", () => {
    const route = findRoute(CAMPUS, 102, 403)!;
    expect(route.path[0]).toBe(102);
    expect(route.path.at(-1)).toBe(403);
  });

  it("returns a connected path", () => {
    const route = findRoute(CAMPUS, 103, 302)!;
    for (let i = 1; i < route.path.length; i++) {
      const a = route.path[i - 1];
      const b = route.path[i];
      const joined = CAMPUS.edges.some(
        (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
      );
      expect(joined, `${a} → ${b} is not an edge`).toBe(true);
    }
  });

  it("reports a distance matching the edges it walked", () => {
    const route = findRoute(CAMPUS, 101, 305)!;
    let sum = 0;
    for (let i = 1; i < route.path.length; i++) {
      const a = route.path[i - 1];
      const b = route.path[i];
      const edge = CAMPUS.edges.find(
        (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
      )!;
      sum += edge.weight;
    }
    expect(sum).toBe(route.distance);
  });

  it("is symmetric, since the graph is undirected", () => {
    const there = findRoute(CAMPUS, 102, 304)!;
    const back = findRoute(CAMPUS, 304, 102)!;
    expect(there.distance).toBe(back.distance);
  });

  it("finds a route between every pair of rooms", () => {
    const all = rooms(CAMPUS);
    for (const from of all) {
      for (const to of all) {
        expect(
          findRoute(CAMPUS, from.id, to.id),
          `${from.id} → ${to.id}`,
        ).not.toBeNull();
      }
    }
  });
});

describe("crossing between buildings", () => {
  it("routes from MC to DC", () => {
    const route = findRoute(CAMPUS, 101, 10201)!;
    expect(route).not.toBeNull();
    expect(buildingOf(route.path[0])).toBe("MC");
    expect(buildingOf(route.path.at(-1)!)).toBe("DC");
  });

  it("passes through the link on the way", () => {
    const route = findRoute(CAMPUS, 101, 10201)!;
    const kinds = route.path.map((id) => nodeById(CAMPUS, id)!.kind);
    expect(kinds).toContain("link");
  });

  it("visits both buildings in its legs", () => {
    const route = findRoute(CAMPUS, 101, 10301)!;
    const buildings = new Set<BuildingId>(route.legs.map((l) => l.building));
    expect([...buildings].sort()).toEqual(["DC", "MC"]);
  });
});

describe("the floor-change toast", () => {
  /** The real app raises a toast only when the route leaves your floor. */
  it("stays empty for a same-floor route", () => {
    expect(findRoute(CAMPUS, 101, 105)!.toast).toBe("");
  });

  it("names the destination floor when changing floor", () => {
    expect(findRoute(CAMPUS, 101, 301)!.toast).toBe("Head to Floor 3");
  });

  it("says where to go when crossing buildings", () => {
    expect(findRoute(CAMPUS, 101, 10201)!.toast).toMatch(/^Go to Floor \d$/);
  });
});

describe("avoiding stairs", () => {
  it("uses no staircase when asked not to", () => {
    const route = findRoute(CAMPUS, 101, 401, { avoidStairs: true })!;
    const kinds = route.path.map((id) => nodeById(CAMPUS, id)!.kind);
    expect(kinds).not.toContain("stairs");
    expect(kinds).toContain("elevator");
  });

  it("still reaches every floor without stairs", () => {
    for (const floor of [2, 3, 4]) {
      const target = rooms(CAMPUS, "MC").find((r) => findFloor(r.id) === floor)!;
      const route = findRoute(CAMPUS, 101, target.id, { avoidStairs: true });
      expect(route, `floor ${floor}`).not.toBeNull();
    }
  });

  it("still crosses to the other building without stairs", () => {
    expect(findRoute(CAMPUS, 101, 10201, { avoidStairs: true })).not.toBeNull();
  });

  it("costs no less than the unrestricted route", () => {
    // Removing options can only make the best route longer or equal.
    for (const target of [201, 301, 401]) {
      const free = findRoute(CAMPUS, 101, target)!;
      const lift = findRoute(CAMPUS, 101, target, { avoidStairs: true })!;
      expect(lift.distance).toBeGreaterThanOrEqual(free.distance);
    }
  });

  it("leaves same-floor routes untouched", () => {
    const free = findRoute(CAMPUS, 101, 105)!;
    const lift = findRoute(CAMPUS, 101, 105, { avoidStairs: true })!;
    expect(lift.distance).toBe(free.distance);
  });
});
