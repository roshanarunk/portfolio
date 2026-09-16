"use client";

import { useMemo, useState } from "react";
import {
  CAMPUS,
  buildingOf,
  findFloor,
  legFor,
  nodeById,
  nodesOnFloor,
  planJourney,
  rooms,
  type BuildingId,
  type Node,
} from "./pathfinding";

/**
 * A reconstruction of the WatTravl map screen.
 *
 * The app showed ONE floor at a time: an amber bar with a back arrow and
 * building/floor pickers, a Refresh button, and the route over the building's
 * floor plan as blue arrowed lines with a red start and a cyan destination.
 *
 * Crossing between buildings is staged, as in the original: you are routed to
 * the bridge on your current floor, told which floor the bridge is on, told to
 * take the link, and then routed again from the far side. Each leg carries the
 * instruction the app would raise at that point.
 *
 * The University's floor plans are not reproduced — see the project page — so
 * the same chrome and route rendering sit over a synthetic building.
 */

const W = 520;
const H = 340;
const BAR = "#ffd54f";

const NODE_FILL: Record<Node["kind"], string> = {
  room: "#6b7280",
  hallway: "#c8c8c8",
  stairs: "#f59e0b",
  elevator: "#0ea5e9",
  link: "#a855f7",
};

function Arrowhead({ from, to }: { from: Node; to: Node }) {
  const ax = from.x * W;
  const ay = from.y * H;
  const bx = to.x * W;
  const by = to.y * H;
  const angle = Math.atan2(by - ay, bx - ax);
  const hx = bx - Math.cos(angle) * 9;
  const hy = by - Math.sin(angle) * 9;
  const spread = 0.45;
  const size = 7;
  return (
    <polygon
      points={[
        `${hx},${hy}`,
        `${hx - Math.cos(angle - spread) * size},${hy - Math.sin(angle - spread) * size}`,
        `${hx - Math.cos(angle + spread) * size},${hy - Math.sin(angle + spread) * size}`,
      ].join(" ")}
      fill="#2563eb"
    />
  );
}

export function WatTravlDemo() {
  const [start, setStart] = useState(101);
  const [end, setEnd] = useState(20301);
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [viewBuilding, setViewBuilding] = useState<BuildingId>("MC");
  const [viewFloor, setViewFloor] = useState(1);

  const journey = useMemo(
    () => planJourney(CAMPUS, start, end, { avoidStairs }),
    [start, end, avoidStairs],
  );

  const building = CAMPUS.buildings.find((b) => b.id === viewBuilding)!;
  const floorNodes = nodesOnFloor(CAMPUS, viewBuilding, viewFloor);
  const leg = legFor(journey, viewBuilding, viewFloor);

  const onFloor = (n: Node) =>
    n.building === viewBuilding && findFloor(n.id) === viewFloor;

  const floorEdges = useMemo(
    () =>
      CAMPUS.edges
        .map((e) => ({ a: nodeById(CAMPUS, e.from), b: nodeById(CAMPUS, e.to) }))
        .filter(
          (pair): pair is { a: Node; b: Node } =>
            !!pair.a && !!pair.b && onFloor(pair.a) && onFloor(pair.b),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewBuilding, viewFloor],
  );

  // Only this floor's leg is drawn, as the app draws one floor at a time.
  const segments = useMemo(() => {
    if (!leg) return [];
    const out: { a: Node; b: Node }[] = [];
    for (let i = 1; i < leg.path.length; i++) {
      const a = nodeById(CAMPUS, leg.path[i - 1]);
      const b = nodeById(CAMPUS, leg.path[i]);
      if (a && b) out.push({ a, b });
    }
    return out;
  }, [leg]);

  const startNode = nodeById(CAMPUS, start);
  const endNode = nodeById(CAMPUS, end);
  const showStart = !!startNode && onFloor(startNode);
  const showEnd = !!endNode && onFloor(endNode);
  const legNodes = leg?.path.map((id) => nodeById(CAMPUS, id)!) ?? [];

  const goToLeg = (index: number) => {
    const target = journey?.legs[index];
    if (!target) return;
    setViewBuilding(target.building);
    setViewFloor(target.floor);
  };

  const currentLegIndex =
    journey?.legs.findIndex(
      (l) => l.building === viewBuilding && l.floor === viewFloor,
    ) ?? -1;

  return (
    <div className="p-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div>
          <div className="overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
            <div
              className="flex items-center gap-2 p-2"
              style={{ backgroundColor: BAR }}
            >
              <button
                type="button"
                onClick={() => goToLeg(0)}
                aria-label="Back to the first leg"
                className="rounded p-1.5 text-neutral-900 tx hover:bg-black/10"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path
                    d="M15 18l-6-6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <label className="sr-only" htmlFor="wt-building">
                Building
              </label>
              <select
                id="wt-building"
                value={viewBuilding}
                onChange={(event) => {
                  const next = event.target.value as BuildingId;
                  const b = CAMPUS.buildings.find((x) => x.id === next)!;
                  setViewBuilding(next);
                  const entered = journey?.legs.find((l) => l.building === next);
                  setViewFloor(entered ? entered.floor : b.floors[0]);
                }}
                className="flex-1 rounded border border-black/20 bg-white/80 px-2 py-1 text-sm text-neutral-900"
              >
                {CAMPUS.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="wt-floor">
                Floor
              </label>
              <select
                id="wt-floor"
                value={viewFloor}
                onChange={(event) => setViewFloor(Number(event.target.value))}
                className="flex-1 rounded border border-black/20 bg-white/80 px-2 py-1 text-sm text-neutral-900"
              >
                {building.floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center bg-neutral-100 py-1.5 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => goToLeg(0)}
                className="rounded border border-neutral-400 bg-white px-4 py-1 text-xs font-medium text-neutral-800 tx hover:bg-neutral-50"
              >
                Refresh
              </button>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full bg-white"
              role="img"
              aria-label={`${viewBuilding} floor ${viewFloor}${
                leg ? ", showing this leg of the route" : ", not on this route"
              }`}
            >
              {floorEdges.map(({ a, b }, i) => (
                <line
                  key={i}
                  x1={a.x * W}
                  y1={a.y * H}
                  x2={b.x * W}
                  y2={b.y * H}
                  stroke="#e0e0e0"
                  strokeWidth={7}
                  strokeLinecap="round"
                />
              ))}

              {/* Every node carries its label, so the plan is readable. */}
              {floorNodes.map((n) => (
                <g key={n.id}>
                  <circle
                    cx={n.x * W}
                    cy={n.y * H}
                    r={n.kind === "room" ? 6 : 5}
                    fill={NODE_FILL[n.kind]}
                  />
                  {n.glyph && (
                    <text
                      x={n.x * W}
                      y={n.y * H + (n.y > 0.5 ? 20 : -12)}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#404040"
                      fontWeight={n.kind === "room" ? 600 : 400}
                    >
                      {n.glyph}
                    </text>
                  )}
                </g>
              ))}

              {segments.map(({ a, b }, i) => (
                <g key={i}>
                  <line
                    x1={a.x * W}
                    y1={a.y * H}
                    x2={b.x * W}
                    y2={b.y * H}
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                  <Arrowhead from={a} to={b} />
                </g>
              ))}

              {legNodes.length > 0 && !showStart && (
                <circle
                  cx={legNodes[0].x * W}
                  cy={legNodes[0].y * H}
                  r={6}
                  fill="#16a34a"
                />
              )}
              {legNodes.length > 0 && !showEnd && (
                <circle
                  cx={legNodes.at(-1)!.x * W}
                  cy={legNodes.at(-1)!.y * H}
                  r={6}
                  fill="#166534"
                />
              )}
              {showStart && startNode && (
                <circle
                  cx={startNode.x * W}
                  cy={startNode.y * H}
                  r={6}
                  fill="#dc2626"
                />
              )}
              {showEnd && endNode && (
                <circle
                  cx={endNode.x * W}
                  cy={endNode.y * H}
                  r={6}
                  fill="#06b6d4"
                />
              )}
            </svg>
          </div>

          {leg?.notice && (
            <p className="mx-auto mt-3 w-fit rounded-full bg-neutral-800 px-4 py-1.5 text-sm text-neutral-100">
              {leg.notice}
            </p>
          )}

          <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            A reconstruction of the app&apos;s map screen. The real build drew
            this over the University&apos;s own floor plans, which are not
            reproduced here.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="wt-start"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              From
            </label>
            <select
              id="wt-start"
              value={start}
              onChange={(event) => {
                const id = Number(event.target.value);
                setStart(id);
                setViewBuilding(buildingOf(id));
                setViewFloor(findFloor(id));
              }}
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              {rooms(CAMPUS).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="wt-end"
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              To
            </label>
            <select
              id="wt-end"
              value={end}
              onChange={(event) => setEnd(Number(event.target.value))}
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              {rooms(CAMPUS).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={avoidStairs}
              onChange={(event) => setAvoidStairs(event.target.checked)}
              className="mt-0.5 accent-neutral-900 dark:accent-neutral-100"
            />
            <span>
              Step-free route
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                Elevators only
              </span>
            </span>
          </label>

          {/* The journey as the app sequences it, one instruction per leg. */}
          {journey ? (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Directions
              </p>
              <ol className="space-y-1">
                {journey.legs.map((l, i) => (
                  <li key={`${l.building}-${l.floor}-${i}`}>
                    <button
                      type="button"
                      onClick={() => goToLeg(i)}
                      className={`w-full rounded px-2 py-1.5 text-left text-xs tx ${
                        i === currentLegIndex
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className="font-mono">
                        {l.building} Floor {l.floor}
                      </span>
                      {l.notice && (
                        <span className="mt-0.5 block opacity-80">
                          → {l.notice}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                {journey.distance} m · {journey.legs.length} legs
              </p>
            </div>
          ) : (
            <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              No step-free route exists between these rooms.
            </p>
          )}

          <dl className="space-y-1 border-t border-neutral-200 pt-3 text-xs dark:border-neutral-800">
            {(
              [
                ["#dc2626", "start"],
                ["#06b6d4", "destination"],
                ["#16a34a", "continues from here"],
                ["#a855f7", "link bridge"],
              ] as const
            ).map(([colour, meaning]) => (
              <div key={meaning} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colour }}
                />
                <dd className="text-neutral-600 dark:text-neutral-400">
                  {meaning}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
