import type { Project } from "@/lib/types";

export const cc3k: Project = {
  slug: "cc3k",
  title: "ChamberCrawler3000",
  tagline: "A roguelike built to make the inheritance hierarchy do the work.",
  year: "2021",
  tier: 2,
  featured: false,
  collection: "coursework",
  tech: [
    { label: "C++", category: "language" },
    { label: "Make", category: "tool" },
  ],
  summary:
    "A terminal roguelike in C++: five playable races, seven enemy types, a floor generator and combat, organised around a polymorphic object hierarchy rather than switch statements.",
  longDescription: [
    "The brief was a dungeon crawler, but the real exercise was object-oriented design. The dungeon holds one collection of Objects; everything in it — the player, enemies, gold, potions, walls, doors, stairs — descends from that single base, so the game loop can iterate the floor without ever asking what kind of thing it is looking at.",
    "That decision is what keeps the code small. Combat calls a virtual attack, and a troll regenerating each turn or a vampire draining HP is the subclass's business, not the loop's. Potions are pure interfaces with one useItem method, so the six effects — attack and defence up or down, HP up or down — are six tiny classes instead of a branching statement that grows every time the game does.",
    "Each of the five races is a Player subclass with its own stats and rules, and dragons guard their hoards with behaviour no other enemy has. Adding a race or an enemy means writing a class, not editing the engine — which is the entire point of the exercise, and the first time that clicked for me as something other than an abstract rule.",
  ],
  highlights: [
    "38 classes across a single Object hierarchy — characters, terrain, items and gold",
    "Potions and enemies behind pure virtual interfaces, so behaviour lives in subclasses",
    "Five playable races and seven enemy types, each with distinct rules",
    "Procedural floor generation with chamber, passage and stairway placement",
  ],
  challenges: [
    {
      problem:
        "My first pass reached for casts and type checks in the game loop, which meant every new enemy touched code that had nothing to do with it.",
      solution:
        "Pushing the behaviour down into virtual methods removed the branching entirely. The lasting lesson was that asking an object what it is usually means the hierarchy is wrong.",
    },
  ],
  disclosure: "Source code unavailable at the University of Waterloo's request.",
  demo: {
    kind: "live",
    componentId: "cc3k",
    title: "Pick a fight",
    instructions:
      "Choose a race and an enemy — the combat maths is the C++ original's.",
    badge: "Ported from the C++",
  },
};
