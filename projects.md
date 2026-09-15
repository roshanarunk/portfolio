# Projects

Roshan Arun Kumar — a record of what I have built, what each thing is, and what
it was built with.

Ordered roughly newest first. Repositories marked **private** are not public,
either because they are university coursework or because they are personal
tooling.

---

## SF6Assist
**JavaScript · Python · C++ · HTML** — [github.com/roshanarunk/SF6Assist](https://github.com/roshanarunk/SF6Assist)

A frame-accurate combo trainer for Street Fighter 6. You build a combo from a
character's real movelist, every transition is checked against SF6's actual
cancel rules, and then you drill the timing against audio cues while it grades
each input as PERFECT / EARLY / LATE with the frame delta.

Notable pieces:
- **Frame data pipeline** — fetches and normalises the real frame data for all
  32 characters into ~5 MB of JSON (`npm run build:data`).
- **Validation with honest uncertainty** — transitions are badged legal,
  illegal, or *unverifiable*, the last meaning the dataset genuinely cannot
  express the situation (juggle state, counterhit, spacing, Drive Rush) rather
  than guessing.
- **Frame meter** — one bar per frame in SF6 training-mode style: green
  startup, red active, blue recovery, with a playhead tracking the run.
- **Stated accuracy limits** — timing is good to ±1–2 frames, and the README
  explains why a timing-offset setting would not help: the error is phase noise
  between two unsynchronised 60 Hz samplers, not constant bias.

The browser app is 37 ES modules with no build step and no dependencies, served
on bare Node and deployed to Cloudflare Workers. Two earlier native prototypes
remain in the repository: a Python version (tkinter, pygame, winsound) and a
Windows C++ one (XInput, Win32, optional DirectX 11 overlay).

*Tech: Node.js 20+, ES modules, HTML/CSS, Cloudflare Workers, Wrangler,
node:test · Python (tkinter, pygame) · C++17 (XInput, Win32, Direct2D/DirectWrite)*

---

## Portfolio site
**TypeScript · React · Next.js** — [github.com/roshanarunk/portfolio](https://github.com/roshanarunk/portfolio) · [roshanarun.com](https://roshanarun.com)

This site. A static Next.js export where the projects are playable rather than
screenshotted: six demos run entirely in the browser, including a full port of
a C++ roguelike, a Sudoku solver visualising its own backtracking, and a
machine-learning model running its real fitted coefficients client-side.

Built around a demo plugin system — each project declares a demo *kind* (live,
iframe, video, gallery, writeup) and a discriminated union makes the renderer
exhaustive, so adding a kind fails the build until it is handled. Live demos are
code-split so the landing page never downloads a demo it is not showing.

*Tech: Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind
CSS v4, Vitest, Testing Library, Cloudflare Workers*

---

## Subspleasio
**JavaScript** — private

A Stremio addon that resolves an anime episode across three sources, checks a
debrid service for what is already cached, and returns a direct stream. It
merges SubsPlease (current-season releases), SeaDex (the community's record of
which release of a show is the preferred one), and nekoBT as a fallback for
older titles, then filters to what Real-Debrid can play immediately.

Credentials travel in the URL path rather than being stored, so the server keeps
no user tokens between requests; adding a second source later meant adding a
second path segment while leaving the original route working.

*Tech: Node.js, Express, Stremio Addon SDK, Real-Debrid API, systray2, xml2js*

---

## WatTravl
**Kotlin** — private (University of Waterloo coursework)

An Android app that routes you between rooms *inside* University of Waterloo
buildings, where GPS stops working and the official maps end at the front door.
A CS446 team project with six people; my work concentrated on the routing and
the graph model.

Dijkstra runs over a hand-mapped graph of hallway nodes across the floors of two
buildings, joined by a link bridge. Staircases and elevators are modelled as
parallel transition sets, so routing step-free for someone who cannot take
stairs is a filter over the same graph rather than a special case. The map
screen renders one floor at a time over the building's floor-plan SVG, drawing
the route with directional arrows and announcing floor changes as you go.

*Tech: Kotlin, Android SDK, MVVM, Google Maps SDK, AndroidSVG, Firebase,
SendGrid*

---

## CS-343 — Concurrent and Parallel Programming
**C++** — private (University of Waterloo coursework)

Six assignments for the Fall 2023 offering, in µC++. Working through them was
the most demanding course I have taken.

- **A1** — exception handling: exception types, `longjmp` versus throw/catch
- **A2** — concurrent binary insertion sort; a hot-potato passing simulation
- **A3** — mutual exclusion with explicit barging checks; concurrent quicksort;
  a bounded buffer
- **A4** — vote tallying with barging control and a coordinating printer
- **A5** — automatic-signal monitors applied to the same voting problem
- **A6** — a full bottling-plant simulation: bank, plant, group-off, and
  configuration

*Tech: C++17, µC++, Make*

---

## Manga Reader
**Swift** — [github.com/roshanarunk/mangareader](https://github.com/roshanarunk/mangareader)

A native iOS reader for CBZ and CBR comic archives, including right-to-left
paging. The piece I am most pleased with is the Quick Look thumbnail extension:
comic archives normally show as generic file icons in the Files app, and a
shared archive-decoding framework lets both the app and the extension render
real covers.

*Tech: Swift, UIKit, Quick Look extension, app entitlements, Xcode*

---

## League Win Predictor
**Python (Jupyter)** — [github.com/roshanarunk/league-ML](https://github.com/roshanarunk/league-ML)

Asks whether a League of Legends match is effectively decided before it ends. I
scraped the top 100 of the Korean ranked ladder, pulled match timelines through
the Riot API, and captured each team's state at the 14-minute mark — gold,
levels, farm, kills, objectives, vision — then trained classifiers to predict
the winner.

Logistic regression, a decision tree and a random forest were compared on both
the full 13-feature set and a reduced 10-feature set, evaluated on precision,
recall, confusion matrix and ROC-AUC rather than accuracy alone. Re-fitted for
the portfolio with a game-level split, it reaches 79.5% accuracy and 0.886
ROC-AUC, and gold lead outweighs every other signal by roughly seven to one.

*Tech: Python, scikit-learn, pandas, seaborn, matplotlib, riotwatcher, Riot API,
Jupyter, xlsxwriter*

---

## Valorant Lineup Tool
**Python** — [github.com/roshanarunk/ValoLineUpTool](https://github.com/roshanarunk/ValoLineUpTool)

A Windows desktop overlay that computes utility lineups instead of making you
memorise them. It screenshots the minimap region, finds the spike by colour,
works out distance and bearing from the player, and draws a crosshair placement
marker that follows the mouse — with per-agent and per-map calibration for
Brimstone, Viper and KAY/O.

*Tech: Python, OpenCV-style colour detection, tkinter, Pillow, pyautogui,
pynput, Win32 API via ctypes*

---

## Valorant Kill Map
**Python** — [github.com/roshanarunk/ValHeatMap](https://github.com/roshanarunk/ValHeatMap)

A Flask service that turns a Valorant match into a picture. It pulls the full
kill feed for a match ID and plots every engagement onto the minimap — killer,
victim, and the line between them — using per-map coordinate transforms, since
Valorant reports world-space positions with a different origin and scale for
each map. Filtering by player, side or round range makes a team's patterns
obvious in a way VOD review does not.

*Tech: Python, Flask, matplotlib, requests, Riot API, gunicorn, Heroku*

---

## VRVision
**Java** — [github.com/roshanarunk/VRVision](https://github.com/roshanarunk/VRVision)

A Google Cardboard app that processes the phone camera feed in real time to make
the world more legible for people with vision impairments. Built as IB Diploma
coursework, where the brief was to solve a real problem for an actual client.

It renders a stereoscopic camera feed and applies shader-based processing —
a bounded magnifier region with offset sampling, brightness adjustment, and
colour inversion for contrast. The part that shaped the project most was
consulting someone who actually lives with a vision impairment: what I assumed
would help was not what was asked for.

*Tech: Java, Android SDK, Google Cardboard SDK, OpenGL ES 2.0 (GLSL shaders),
Gradle; with a PHP backend tier and a Java Swing companion*

---

## Underpeel
**React · JavaScript** — [v1](https://github.com/roshanarunk/underpeelsite) · [v2](https://github.com/roshanarunk/underpeelsite2.0) · [live](https://roshanarunk.github.io/underpeelsite/)

The public site for Underpeel, a Valorant league I helped run: team rosters,
player ranks and season structure. The most iterated project I have shipped, and
the one that taught me the difference between finishing something and shipping
it, because it had real users on a deadline.

Version one is still live. Version two moved to Vite, Tailwind and daisyUI with
a Firebase backend so seasons could be updated without a redeploy, and a third
revision exists as a Figma design.

*Tech: React, Vite, Tailwind CSS, daisyUI, Firebase, react-spring, GitHub Pages,
Figma*

---

## Student Progress Tracker
**Python** — [github.com/roshanarunk/WHJStudentUpdate](https://github.com/roshanarunk/WHJStudentUpdate)

Automates the coaching report nobody wanted to write. It reads a roster of
students from Google Sheets, parses Riot IDs out of pasted tracker URLs with a
regex, queries current rank across the NA, EU and AP regions, and compares each
student against their starting rank across act and episode boundaries.

It writes two files rather than one — students with usable data, and students
whose data is missing or stale — which is the difference between a report
someone reads and a report someone has to audit.

*Tech: Python, gspread (Google Sheets API), valo-api, xlsxwriter, unofficial
Valorant rank APIs*

---

## Valorant Sheet Updater
**Python** — private

A smaller companion to the above: pulls Valorant match history and keeps a
spreadsheet of results up to date, authenticating against Google via a stored
OAuth token.

*Tech: Python, Google Sheets API, OAuth*

---

## ChamberCrawler3000 (CC3K)
**C++** — private (University of Waterloo coursework)

A terminal roguelike: five playable races, seven enemy types, procedurally
populated floors, and turn-based combat. The real exercise was object-oriented
design — 38 classes hang off a single `Object` hierarchy, so the game loop can
iterate a floor without asking what anything is.

Combat calls a virtual `attack`, and a troll regenerating or a vampire draining
health is the subclass's business. Potions are a pure interface with one
`useItem` method, so six effects are six small classes instead of a branching
statement that grows with the game.

*Tech: C++, Make*

---

## Springboot Student Manager
**Java · JavaScript** — [github.com/roshanarunk/Springboot](https://github.com/roshanarunk/Springboot)

My introduction to a properly layered backend: a Spring Boot REST API with
controller, service and model separated, and a React front end that talks to it
through a single client module rather than scattering fetch calls through
components. Packaged with Docker Compose for AWS Elastic Beanstalk, which was my
first experience of the gap between code that works locally and code that is
deployed.

*Tech: Java, Spring Boot, Maven, React, Ant Design, Docker Compose, AWS Elastic
Beanstalk*

---

## Sudoku Solver
**Python** — [github.com/roshanarunk/Sudoku](https://github.com/roshanarunk/Sudoku)

A playable Sudoku board with a depth-first backtracking solver. Two files: the
algorithm and a pygame GUI with cell selection, pencil marks, a strike counter
and a timer. The solver imports nothing at all, which is what made it portable
years later — it now runs on my portfolio site, visualising every guess and
undo.

*Tech: Python, pygame*

---

## AnarchyChess
**Python** — [github.com/roshanarunk/AnarchyChess](https://github.com/roshanarunk/AnarchyChess)

Local two-player graphical chess with full move validation for every piece,
turn alternation, check detection, castling and pawn promotion. No engine — it
is hot-seat only.

*Tech: Python, tkinter, Pillow*

---

## HooBank Landing Page
**JavaScript** — [github.com/roshanarunk/BankWebsite](https://github.com/roshanarunk/BankWebsite)

A polished fintech marketing page built by following the JavaScript Mastery
HooBank tutorial. Deliberate practice with Tailwind's composition model and
holding a design system together across a dozen sections — not original design
work, and listed as such.

*Tech: React, Vite, Tailwind CSS*

---

## ATM Simulator
**Java** — [github.com/roshanarunk/ATM](https://github.com/roshanarunk/ATM)

An early coursework project, and where domain modelling stopped being abstract:
`Customer`, `BankAccount` and `Transactions` each own their state and rules,
with the Swing interface kept as a layer on top rather than the place the logic
lives.

*Tech: Java, Swing, NetBeans Matisse, Ant*

---

## Also in the account

- **GP2040-CE** — a fork of the multi-platform gamepad firmware for RP2040
  boards (C++). Not my project.
- **AgentComp** — an untouched Create React App scaffold; no application code
  was ever written.
- **gitbot** — a single 37-byte JSON file; never started.
- **cs343** — an empty placeholder repository (one 8-byte README). The real
  coursework is under **CS-343** above.
- **roshanarunk** — GitHub profile README.
