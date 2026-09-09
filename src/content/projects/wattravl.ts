import type { Project } from "@/lib/types";

export const wattravl: Project = {
  slug: "wattravl",
  title: "WatTravl",
  tagline: "Indoor navigation for a building where GPS gives up.",
  year: "2024",
  tier: 1,
  featured: true,
  role: "One of six on the team",
  collection: "coursework",
  tech: [
    { label: "Kotlin", category: "language" },
    { label: "Android", category: "platform" },
    { label: "Google Maps SDK", category: "library" },
    { label: "Firebase", category: "platform" },
  ],
  summary:
    "An Android app that routes you between rooms inside University of Waterloo buildings, running Dijkstra over a hand-mapped graph of hallways, staircases and elevators across six floors.",
  longDescription: [
    "Campus buildings are the place phone navigation stops working: GPS cannot tell which floor you are on, and the official maps end at the front door. Getting from one room to another in a building you do not know means asking someone. This routes it properly.",
    "There was no data to start from, so the graph is hand-built. Each floor is a set of hallway nodes keyed by room number, with edge weights for walking distance, and the floors are stitched together at the points where you can actually change level. Dijkstra then runs over the whole building at once rather than per floor, so a route that crosses three floors is one search instead of three stitched results.",
    "Staircases and elevators are modelled as separate transition sets covering the same floor changes. That started as a convenience and turned into the feature I am most glad we built: routing by elevator only is what makes the app usable for someone who cannot take stairs, and it fell out of the graph design almost for free.",
  ],
  highlights: [
    "Dijkstra with a priority queue over a multi-floor building graph",
    "Hallway nodes hand-mapped across six floors, keyed by real room numbers",
    "Stairs and elevators as parallel transitions, so accessible routing is a filter",
    "Google Maps for getting to the building, indoor routing for the rest",
  ],
  challenges: [
    {
      problem:
        "Floor changes break a naive graph. Routing each floor separately produces the shortest path on every floor and a poor route overall, because the best staircase depends on where you are going next.",
      solution:
        "Modelling transitions as ordinary weighted edges lets one search span the building, so the algorithm chooses the staircase because of the whole route rather than the current floor.",
    },
    {
      problem:
        "Six people, one Android codebase, one term.",
      solution:
        "Splitting along MVVM boundaries meant the graph and pathfinding could be built and tested independently of the map UI. Being able to run the routing without the app attached is what kept the work parallel.",
    },
  ],
  disclosure:
    "A CS446 team project with five collaborators, kept private as coursework. My work was concentrated on the routing and graph model.",
  demo: {
    kind: "writeup",
    title: "Routing between floors",
    instructions: "How the building becomes one graph.",
    excerpts: [
      {
        file: "model/MC/Dijkstra.kt",
        language: "kotlin",
        code: `val staircases = mapOf(
    1 to listOf(1099, 1106, 1096, 1091),
    2 to listOf(2077, 2099, 2074, 2068),
    // …one entry per floor
)

val elevators = mapOf(
    1 to listOf(1100, 1092),
    2 to listOf(2078, 2070),
)

fun findFloor(number: Int): Int =
    number.toString()[0].toString().toInt()`,
        note: "Room numbers already encode the floor, so the first digit gives it for free. Stairs and elevators are parallel lists, which is what makes elevator-only routing a one-line change at the call site.",
      },
    ],
  },
};
