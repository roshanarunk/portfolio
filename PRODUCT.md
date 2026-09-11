# Product context

Captured for Impeccable from the working session, rather than a fresh interview —
every answer below was stated during the build. Correct anything that is wrong.

## What this is

A personal portfolio for Roshan Arun Kumar, an early-career software engineer.
Static Next.js site, exported and served without a backend.

## Who it is for

Recruiters and hiring engineers screening for **internships and early-career
roles**. They arrive from a application, a GitHub profile, or a link in a
message, usually give the site well under a minute, and frequently arrive on a
phone.

## What makes it unusual

Six projects are genuinely interactive in the browser, not screenshotted:

- **ChamberCrawler3000** — the full C++ roguelike, playable, ported to TypeScript
- **Sudoku** — the original Python backtracking solver, visualised step by step
- **League win predictor** — the real fitted logistic regression, run client-side
- **Valorant kill map** — 667 real kills from six recorded matches
- **VRVision** — the Android app's own GLSL shaders, running on your webcam
- **WatTravl** — Dijkstra over a multi-floor building graph

Where a project genuinely cannot run in a browser (an iOS app, a Windows
overlay), it gets a video or a writeup instead of a faked demo.

## The primary outcome

A visitor plays or watches **one** demo, and leaves understanding that these
projects actually work. Secondary: they can reach the resume and contact.

## What is true here that a template could not claim

- The demos are ports of the real code, not re-creations. The Sudoku solver is
  the original algorithm; VRVision compiles the app's actual shaders.
- The writeups document specific mistakes and how they were found — a data leak
  from splitting rows instead of games, an off-by-one in Riot's round numbering,
  a missing coin-flip that made a game unwinnable.
- Four projects form one story: tooling built over a year for a Valorant
  coaching organisation with real users.

## Tone

Plain, honest, specific. No superlatives, no invented metrics. Where work is not
original or not live, the site says so in its own words.

## Constraints

- Static export; no server, no database.
- Every demo is code-split and must not load on pages that do not render it.
- Accessible: keyboard-operable demos, WCAG AA contrast, reduced-motion honoured.
- Two projects cannot show source (University of Waterloo coursework).

## Visitor mode

**Experience.** The artifact leads; the interface recedes.
