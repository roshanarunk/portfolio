"use client";

import { useMemo, useState } from "react";
import {
  BUILDING,
  findFloor,
  findRoute,
  nodeById,
  rooms,
  type Node,
} from "./pathfinding";
import { cn } from "@/lib/utils";

const W = 520;
const H = 150;

const KIND_STYLE: Record<Node["kind"], string> = {
  room: "fill-neutral-400 dark:fill-neutral-600",
  hallway: "fill-neutral-300 dark:fill-neutral-700",
  stairs: "fill-amber-500",
  elevator: "fill-sky-500",
};

/** One floor drawn as a plan, with the route highlighted where it crosses. */
function FloorPlan({
  floor,
  path,
  onPick,
  start,
  end,
}: {
  floor: number;
  path: number[];
  onPick: (id: number) => void;
  start: number;
  end: number;
}) {
  const nodes = BUILDING.nodes.filter((n) => findFloor(n.id) === floor);
  const onPath = new Set(path);

  // Edges with both ends on this floor, so vertical hops are not drawn flat.
  const edges = BUILDING.edges.filter(
    (e) => findFloor(e.from) === floor && findFloor(e.to) === floor,
  );

  const at = (n: Node) => ({ x: n.x * W, y: n.y * H });

  return (
    <div className="rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
      <p className="mb-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Floor {floor}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Floor ${floor} plan`}
      >
        {edges.map((edge, i) => {
          const a = nodeById(BUILDING, edge.from)!;
          const b = nodeById(BUILDING, edge.to)!;
          const pa = at(a);
          const pb = at(b);
          // Highlight an edge only when the route uses it consecutively.
          const ia = path.indexOf(edge.from);
          const ib = path.indexOf(edge.to);
          const used = ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1;
          return (
            <line
              key={i}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              strokeWidth={used ? 4 : 1.5}
              className={
                used
                  ? "stroke-emerald-500"
                  : "stroke-neutral-200 dark:stroke-neutral-800"
              }
            />
          );
        })}

        {nodes.map((node) => {
          const p = at(node);
          const isEnd = node.id === start || node.id === end;
          const used = onPath.has(node.id);
          return (
            <g key={node.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isEnd ? 9 : used ? 6 : node.kind === "room" ? 6 : 4}
                className={cn(
                  isEnd
                    ? "fill-emerald-500"
                    : used
                      ? "fill-emerald-400"
                      : KIND_STYLE[node.kind],
                  node.kind === "room" && "cursor-pointer",
                )}
                onClick={() => node.kind === "room" && onPick(node.id)}
              />
              {(node.kind === "room" || isEnd) && (
                <text
                  x={p.x}
                  y={p.y + (node.y > 0.5 ? 18 : -11)}
                  textAnchor="middle"
                  className="fill-neutral-500 text-[10px] dark:fill-neutral-500"
                >
                  {node.id}
                </text>
              )}
              {node.kind === "stairs" && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="fill-amber-600 text-[9px]"
                >
                  stairs
                </text>
              )}
              {node.kind === "elevator" && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="fill-sky-600 text-[9px]"
                >
                  lift
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function WatTravlDemo() {
  const [start, setStart] = useState(101);
  const [end, setEnd] = useState(403);
  const [avoidStairs, setAvoidStairs] = useState(false);

  const route = useMemo(
    () => findRoute(BUILDING, start, end, { avoidStairs }),
    [start, end, avoidStairs],
  );

  const comparison = useMemo(
    () => findRoute(BUILDING, start, end, { avoidStairs: !avoidStairs }),
    [start, end, avoidStairs],
  );

  const allRooms = rooms(BUILDING);

  return (
    <div className="p-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
        <div className="space-y-2">
          {BUILDING.floors.map((floor) => (
            <FloorPlan
              key={floor}
              floor={floor}
              path={route?.path ?? []}
              start={start}
              end={end}
              onPick={(id) => setEnd(id)}
            />
          ))}
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Click any room to route to it.
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
              onChange={(e) => setStart(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              {allRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.id}
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
              onChange={(e) => setEnd(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              {allRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.id}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={avoidStairs}
              onChange={(e) => setAvoidStairs(e.target.checked)}
              className="mt-0.5 accent-neutral-900 dark:accent-neutral-100"
            />
            <span>
              Step-free route
              <span className="block text-xs text-neutral-500">
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
                <dt className="text-neutral-500">Distance</dt>
                <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {route.distance} m
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Floor changes</dt>
                <dd className="font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {route.transitions}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-neutral-500">Floors</dt>
                <dd className="font-mono text-neutral-900 dark:text-neutral-100">
                  {route.floors.join(" → ")}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-800">
              No step-free route exists between these rooms.
            </p>
          )}

          {route && comparison && comparison.distance !== route.distance && (
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
              {avoidStairs
                ? `Taking the stairs would be ${route.distance - comparison.distance} m shorter.`
                : `A step-free route costs ${comparison.distance - route.distance} m more.`}
            </p>
          )}

          <p className="border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
            One Dijkstra search over the whole building, with staircases and
            elevators as ordinary weighted edges — so the route picks the
            transition that suits the whole journey, not just the current floor.
          </p>
        </div>
      </div>
    </div>
  );
}
