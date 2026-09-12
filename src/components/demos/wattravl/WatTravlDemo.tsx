"use client";

import { useMemo, useState } from "react";
import {
  CAMPUS,
  buildingOf,
  findFloor,
  findRoute,
  nodeById,
  nodesOnFloor,
  rooms,
  type BuildingId,
  type Node,
} from "./pathfinding";

/**
 * A reconstruction of the WatTravl map screen.
 *
 * The real app showed ONE floor at a time in a full-screen image view, with an
 * amber bar carrying a back arrow and building/floor pickers, a Refresh button,
 * and the route drawn over the building's own floor plan: blue lines with
 * arrowheads, a red start marker, a cyan destination, and green markers where
 * the path continued onto another floor. A toast announced floor changes.
 *
 * The University's floor plans are deliberately not reproduced — see the
 * project page — so the same chrome and route rendering sit over a synthetic
 * building instead.
 */

const W = 520;
const H = 340;

/** The app's own bar colour. */
const BAR = "#ffd54f";

const NODE_FILL: Record<Node["kind"], string> = {
  room: "#9ca3af",
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
  // Sits just short of the endpoint so it reads as direction, not a join.
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
  const [end, setEnd] = useState(10201);
  const [avoidStairs, setAvoidStairs] = useState(false);

  // The two pickers drive which floor is on screen; the route is computed once
  // and only the current floor's portion is drawn, as the app does.
  const [viewBuilding, setViewBuilding] = useState<BuildingId>("MC");
  const [viewFloor, setViewFloor] = useState(1);

  const route = useMemo(
    () => findRoute(CAMPUS, start, end, { avoidStairs }),
    [start, end, avoidStairs],
  );

  const building = CAMPUS.buildings.find((b) => b.id === viewBuilding)!;
  const floorNodes = nodesOnFloor(CAMPUS, viewBuilding, viewFloor);

  const onFloor = (n: Node) =>
    n.building === viewBuilding && findFloor(n.id) === viewFloor;

  const floorEdges = useMemo(
    () =>
      CAMPUS.edges
        .map((e) => ({
          a: nodeById(CAMPUS, e.from),
          b: nodeById(CAMPUS, e.to),
        }))
        .filter(
          (pair): pair is { a: Node; b: Node } =>
            !!pair.a && !!pair.b && onFloor(pair.a) && onFloor(pair.b),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewBuilding, viewFloor],
  );

  // Consecutive path pairs that both sit on the displayed floor.
  const segments = useMemo(() => {
    if (!route) return [];
    const out: { a: Node; b: Node }[] = [];
    for (let i = 1; i < route.path.length; i++) {
      const a = nodeById(CAMPUS, route.path[i - 1]);
      const b = nodeById(CAMPUS, route.path[i]);
      if (a && b && onFloor(a) && onFloor(b)) out.push({ a, b });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, viewBuilding, viewFloor]);

  // Where the path enters and leaves this floor, which the app marks green.
  const visited = useMemo(() => {
    if (!route) return [] as Node[];
    return route.path
      .map((id) => nodeById(CAMPUS, id))
      .filter((n): n is Node => !!n && onFloor(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, viewBuilding, viewFloor]);

  const startNode = nodeById(CAMPUS, start);
  const endNode = nodeById(CAMPUS, end);
  const showStart = !!startNode && onFloor(startNode);
  const showEnd = !!endNode && onFloor(endNode);

  const jumpToStart = () => {
    setViewBuilding(buildingOf(start));
    setViewFloor(findFloor(start));
  };

  return (
    <div className="p-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
        <div>
          <div className="overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
            {/* The app's chrome: amber bar, back arrow, two pickers. */}
            <div
              className="flex items-center gap-2 p-2"
              style={{ backgroundColor: BAR }}
            >
              <button
                type="button"
                onClick={jumpToStart}
                aria-label="Back to the starting floor"
                className="rounded p-1.5 text-neutral-900 transition hover:bg-black/10"
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
                  setViewBuilding(next);
                  const b = CAMPUS.buildings.find((x) => x.id === next)!;
                  if (!b.floors.includes(viewFloor)) setViewFloor(b.floors[0]);
                }}
                className="flex-1 rounded border border-black/20 bg-white/80 px-2 py-1 text-sm text-neutral-900"
              >
                {CAMPUS.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.name}
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
                onClick={jumpToStart}
                className="rounded border border-neutral-400 bg-white px-4 py-1 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Refresh
              </button>
            </div>

            {/* One floor at a time, as the app rendered it. */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full bg-white"
              role="img"
              aria-label={`${viewBuilding} floor ${viewFloor}${
                segments.length ? ", showing the route on this floor" : ""
              }`}
            >
              {floorEdges.map(({ a, b }, i) => (
                <line
                  key={i}
                  x1={a.x * W}
                  y1={a.y * H}
                  x2={b.x * W}
                  y2={b.y * H}
                  stroke="#d4d4d4"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              ))}

              {floorNodes.map((n) => (
                <circle
                  key={n.id}
                  cx={n.x * W}
                  cy={n.y * H}
                  r={n.kind === "room" ? 5 : 3.5}
                  fill={NODE_FILL[n.kind]}
                />
              ))}

              {/* Route: blue 2px lines with arrowheads, as in ViewModel.draw(). */}
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

              {/* Green where the path enters or leaves this floor. */}
              {visited.length > 0 && !showStart && (
                <circle
                  cx={visited[0].x * W}
                  cy={visited[0].y * H}
                  r={5}
                  fill="#16a34a"
                />
              )}
              {visited.length > 0 && !showEnd && (
                <circle
                  cx={visited.at(-1)!.x * W}
                  cy={visited.at(-1)!.y * H}
                  r={5}
                  fill="#166534"
                />
              )}

              {showStart && startNode && (
                <circle
                  cx={startNode.x * W}
                  cy={startNode.y * H}
                  r={5}
                  fill="#dc2626"
                />
              )}
              {showEnd && endNode && (
                <circle
                  cx={endNode.x * W}
                  cy={endNode.y * H}
                  r={5}
                  fill="#06b6d4"
                />
              )}
            </svg>
          </div>

          {/* The app raised this as a toast when the route left your floor. */}
          {route?.toast && (
            <p className="mx-auto mt-3 w-fit rounded-full bg-neutral-800 px-4 py-1.5 text-sm text-neutral-100">
              {route.toast}
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

          {route ? (
            <dl
              className="grid grid-cols-2 gap-2 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800"
              aria-live="polite"
            >
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Distance
                </dt>
                <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {route.distance} m
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Changes
                </dt>
                <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {route.transitions}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-neutral-500 dark:text-neutral-400">Route</dt>
                <dd className="font-mono text-neutral-900 dark:text-neutral-100">
                  {route.legs.map((l) => `${l.building} ${l.floor}`).join(" → ")}
                </dd>
              </div>
            </dl>
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
                ["#16a34a", "continues on another floor"],
                ["#2563eb", "route on this floor"],
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
