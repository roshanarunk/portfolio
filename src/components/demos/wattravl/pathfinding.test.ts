import { describe, it, expect } from "vitest";
import {
  CAMPUS,
  DC_BRIDGE,
  MC_BRIDGE,
  buildingOf,
  findFloor,
  legFor,
  nodeById,
  nodesOnFloor,
  planJourney,
  rooms,
  type BuildingId,
} from "./pathfinding";

const mcRoom = (floor: number) =>
  rooms(CAMPUS, "MC").find((r) => findFloor(r.id) === floor)!.id;
const dcRoom = (floor: number) =>
  rooms(CAMPUS, "DC").find((r) => findFloor(r.id) === floor)!.id;

describe("findFloor", () => {
  it("reads the floor from the first digit", () => {
    expect(findFloor(101)).toBe(1);
    expect(findFloor(305)).toBe(3);
  });

  it("reads it the same way in the offset building", () => {
    expect(findFloor(DC_BRIDGE)).toBe(2);
    expect(buildingOf(DC_BRIDGE)).toBe("DC");
  });
});

describe("the campus graph", () => {
  it("has both buildings with their bridge floors", () => {
    const mc = CAMPUS.buildings.find((b) => b.id === "MC")!;
    const dc = CAMPUS.buildings.find((b) => b.id === "DC")!;
    expect(mc.bridgeFloor).toBe(3);
    expect(dc.bridgeFloor).toBe(2);
    expect(mc.bridgeNode).toBe(MC_BRIDGE);
    expect(dc.bridgeNode).toBe(DC_BRIDGE);
  });

  it("puts each bridge node on its building's bridge floor", () => {
    expect(findFloor(MC_BRIDGE)).toBe(3);
    expect(findFloor(DC_BRIDGE)).toBe(2);
  });

  /** Every node needs something drawable, or the plan is unreadable. */
  it("labels every node, and gives every room a visible number", () => {
    for (const node of CAMPUS.nodes) {
      expect(node.label, String(node.id)).toBeTruthy();
      if (node.kind !== "hallway") {
        expect(node.glyph, node.label).toBeTruthy();
      }
      if (node.kind === "room") {
        expect(node.glyph, node.label).toMatch(/^\d{4}$/);
      }
    }
  });

  it("gives every edge two real endpoints inside one building", () => {
    for (const edge of CAMPUS.edges) {
      const a = nodeById(CAMPUS, edge.from);
      const b = nodeById(CAMPUS, edge.to);
      expect(a, String(edge.from)).toBeDefined();
      expect(b, String(edge.to)).toBeDefined();
      expect(edge.weight).toBeGreaterThan(0);
      // The crossing is a leg, not an edge, so no edge may span buildings.
      expect(a!.building, `${edge.from} → ${edge.to}`).toBe(b!.building);
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
});

describe("routing inside one building", () => {
  it("stays on one leg when start and end share a floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), 105)!;
    expect(journey.legs).toHaveLength(1);
    expect(journey.legs[0].notice).toBe("");
  });

  /**
   * The app compares only the start and end room digits:
   *   if (end.first() != start.first()) toast = "Head to Floor ${end.first()}"
   * Floor 1 to floor 3 says "Head to Floor 3" once, never "Head to Floor 2".
   */
  it("names the destination floor once, not every floor on the way", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), mcRoom(3))!;
    expect(journey.legs.length).toBeGreaterThan(1);

    const notices = journey.legs.map((l) => l.notice).filter(Boolean);
    expect(notices).toEqual(["Head to Floor 3"]);
    // Nothing mentions the floor merely passed through.
    expect(notices).not.toContain("Head to Floor 2");
  });

  it("says nothing when the destination is on the same floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), 105)!;
    expect(journey.legs.every((l) => l.notice === "")).toBe(true);
  });

  it("names the destination even across three floors", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), mcRoom(4))!;
    const notices = journey.legs.map((l) => l.notice).filter(Boolean);
    expect(notices).toEqual(["Head to Floor 4"]);
  });

  it("returns a connected path", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), mcRoom(4))!;
    for (let i = 1; i < journey.path.length; i++) {
      const a = journey.path[i - 1];
      const b = journey.path[i];
      const joined = CAMPUS.edges.some(
        (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
      );
      expect(joined, `${a} → ${b} is not an edge`).toBe(true);
    }
  });

  it("finds a route between every pair of rooms in a building", () => {
    for (const from of rooms(CAMPUS, "MC")) {
      for (const to of rooms(CAMPUS, "MC")) {
        expect(
          planJourney(CAMPUS, from.id, to.id),
          `${from.label} → ${to.label}`,
        ).not.toBeNull();
      }
    }
  });
});

describe("routing between buildings", () => {
  /**
   * The app does not search across the bridge. It routes to the bridge in one
   * building, tells you to take the link, then routes again in the other.
   */
  it("reaches the bridge, then continues from the far side", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3))!;
    expect(journey).not.toBeNull();

    const crossing = journey.legs.findIndex((l) => l.notice.endsWith("Link"));
    expect(crossing).toBeGreaterThanOrEqual(0);

    // Everything before the crossing is in MC, everything after is in DC.
    for (let i = 0; i <= crossing; i++) {
      expect(journey.legs[i].building).toBe("MC");
    }
    for (let i = crossing + 1; i < journey.legs.length; i++) {
      expect(journey.legs[i].building).toBe("DC");
    }
  });

  it("raises the link notice on the bridge floor, not elsewhere", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3))!;
    const linkLeg = journey.legs.find((l) => l.notice === "Take DC Link")!;
    expect(linkLeg).toBeDefined();
    expect(linkLeg.building).toBe("MC");
    expect(linkLeg.floor).toBe(3);
    expect(linkLeg.path).toContain(MC_BRIDGE);
  });

  it("gives one notice to reach the bridge floor, naming only that floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(2))!;
    // Bridge is on MC 3; starting on MC 1 names 3 directly, never 2.
    expect(journey.legs[0].notice).toBe("Go to Floor 3");
    const mcNotices = journey.legs
      .filter((l) => l.building === "MC")
      .map((l) => l.notice)
      .filter(Boolean);
    expect(mcNotices).toEqual(["Go to Floor 3", "Take DC Link"]);
  });

  it("goes straight to the link when already on the bridge floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(3), dcRoom(2))!;
    expect(journey.legs[0].building).toBe("MC");
    expect(journey.legs[0].floor).toBe(3);
    expect(journey.legs[0].notice).toBe("Take DC Link");
  });

  it("arrives in DC on the bridge floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3))!;
    const crossing = journey.legs.findIndex((l) => l.notice.endsWith("Link"));
    const arrival = journey.legs[crossing + 1];
    expect(arrival.building).toBe("DC");
    expect(arrival.floor).toBe(2);
    expect(arrival.path).toContain(DC_BRIDGE);
  });

  it("gives one notice on the far side, naming the destination floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3))!;
    const dcNotices = journey.legs
      .filter((l) => l.building === "DC")
      .map((l) => l.notice)
      .filter(Boolean);
    expect(dcNotices).toEqual(["Head to Floor 3"]);
    expect(journey.legs.at(-1)!.floor).toBe(3);
    expect(journey.legs.at(-1)!.notice).toBe("");
  });

  it("says nothing extra when the bridge lands on the destination floor", () => {
    // DC bridge is on floor 2, so a DC floor 2 room needs no further notice.
    const journey = planJourney(CAMPUS, mcRoom(3), dcRoom(2))!;
    const dcNotices = journey.legs
      .filter((l) => l.building === "DC")
      .map((l) => l.notice)
      .filter(Boolean);
    expect(dcNotices).toEqual([]);
  });

  it("works in the other direction too", () => {
    const journey = planJourney(CAMPUS, dcRoom(1), mcRoom(4))!;
    expect(journey.legs.some((l) => l.notice === "Take MC Link")).toBe(true);
    expect(journey.legs[0].building).toBe("DC");
    expect(journey.legs.at(-1)!.building).toBe("MC");
  });

  it("sums the distance of both halves", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3))!;
    expect(journey.distance).toBeGreaterThan(0);
    expect(journey.path.length).toBe(
      journey.legs.reduce((n, l) => n + l.path.length, 0),
    );
  });
});

describe("legFor", () => {
  it("returns the leg drawn on a given floor", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3));
    expect(legFor(journey, "MC", 1)).toBeDefined();
    expect(legFor(journey, "DC", 2)).toBeDefined();
    // DC floor 1 is never entered on this journey.
    expect(legFor(journey, "DC", 1)).toBeUndefined();
  });

  it("is undefined when there is no journey", () => {
    expect(legFor(null, "MC", 1)).toBeUndefined();
  });
});

describe("avoiding stairs", () => {
  it("uses no staircase when asked not to", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), mcRoom(4), {
      avoidStairs: true,
    })!;
    const kinds = journey.path.map((id) => nodeById(CAMPUS, id)!.kind);
    expect(kinds).not.toContain("stairs");
    expect(kinds).toContain("elevator");
  });

  it("still crosses between buildings without stairs", () => {
    const journey = planJourney(CAMPUS, mcRoom(1), dcRoom(3), {
      avoidStairs: true,
    });
    expect(journey).not.toBeNull();
    expect(journey!.legs.some((l) => l.notice === "Take DC Link")).toBe(true);
  });

  it("costs no less than the unrestricted route", () => {
    for (const floor of [2, 3, 4]) {
      const free = planJourney(CAMPUS, mcRoom(1), mcRoom(floor))!;
      const lift = planJourney(CAMPUS, mcRoom(1), mcRoom(floor), {
        avoidStairs: true,
      })!;
      expect(lift.distance).toBeGreaterThanOrEqual(free.distance);
    }
  });

  it("keeps the notices identical in shape, and just as sparse", () => {
    const lift = planJourney(CAMPUS, mcRoom(1), dcRoom(3), {
      avoidStairs: true,
    })!;
    const notices = lift.legs.map((l) => l.notice).filter(Boolean);

    for (const notice of notices) {
      expect(notice).toMatch(/^((Head|Go) to Floor \d|Take (DC|MC) Link)$/);
    }
    // Reaching the bridge, crossing it, and reaching the destination floor —
    // never one per floor walked through.
    expect(notices).toEqual([
      "Go to Floor 3",
      "Take DC Link",
      "Head to Floor 3",
    ]);
  });
});

describe("building ids", () => {
  it("separates the two buildings by id range", () => {
    const buildings = new Set<BuildingId>(
      CAMPUS.nodes.map((n) => buildingOf(n.id)),
    );
    expect([...buildings].sort()).toEqual(["DC", "MC"]);
    for (const node of CAMPUS.nodes) {
      expect(buildingOf(node.id), node.label).toBe(node.building);
    }
  });
});
