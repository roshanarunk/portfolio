---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/globals.css"]
---

# Landing page and site shell

Scope: `src/app/page.tsx` and the token layer. Visitor mode: **Experience** — the
artifact leads, the interface recedes.

Audience: recruiters and hiring engineers screening for internships and
early-career roles. Under a minute, frequently on a phone, mid-triage. Job: play
or watch one demo and leave believing these programs actually run. Proof: six
projects that genuinely execute in the browser, ported from the original source.

Constraints: static export, no backend. Demos stay code-split. WCAG AA in both
themes, keyboard-operable, reduced-motion honoured. Content, copy, demos and
structure are preserved — a restyle, not a rewrite.

## Direction contract

THESIS: Every project here produces a measurement — 445,000 decisions to solve
one board, 0.886 ROC-AUC, 667 recorded kills, a shortest path across a building
graph. A collider event display is how a physicist reads one collision: the
readout IS the evidence. So the site presents the work as instrument output
rather than as a page describing it. It refuses the neon-on-black dev-portfolio
canon and the warm editorial page alike.

OWN-WORLD: Near-black vacuum ground (#0b0f14) owning every surface. Detector
structure in muted steel blue (#223244 rules, #3a5a7a ring strokes). Signal
yellow (#ffd23a) marks what is live and running; cyan (#35d0ff) marks what is
selected or interactive; red (#ff4d4d) marks deposited energy and cost. Text in
cool steel (#a7b3c2) with near-white for primary reading. Every figure on screen
is a real measured value from the project it belongs to — a fake number turns
the whole world into a skin, so there are none. Type is a spare technical
grotesk with tabular digits for every quantity. Chrome is hairline rules and
1px strokes; no glow, no gradient fills, no glass.

STORY: The visitor lands on a live readout. The solver is running at the centre,
its search drawn as tracks and its cost accumulating as energy bars, so "these
programs actually work" is demonstrated before it is claimed. The six runnable
projects sit as selectable events, each carrying its own real figures. They
select one and open it.

FIRST VIEWPORT: A detector cross-section occupies the primary field: concentric
rings on the vacuum ground, the Sudoku solver's search drawn as tracks curving
out from a central vertex, and calorimeter wedges around the outside whose bars
grow with decisions and backtracks. To one side, an event summary panel in
tabular type: the project name, what it was ported from, and its live counters.
Below, the six runnable projects as an event list — one row each, with its
headline measurement in tabular digits. The primary action sits in the summary
panel where an instrument's confirm control would be.

FORM: Collider Event Display — a dealt challenger that won the third hand on
both axes; the assigned direction was a radar sweep. Seed key 15b36776, re-roll
round 2.

Raises taken from declined challengers, each named by donor:
- From Provenance Ribbon: uncertainty is shown, not hidden — an estimated figure
  or an unavailable source says so in the display's own vocabulary.
- From Silkscreen Loft: variation is content — inspecting one project rewards
  attention rather than repeating an identical card.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Build rules for this run

These exist because the previous three attempts failed on them.

1. **No global style change without checking every page.** The one-bit desktop
   shipped a `body` background that only the landing page could survive. Any
   change to `body`, `html` or a shared token is verified on `/`, `/projects`,
   a project detail page, `/about` and 404 before it is committed.
2. **One page at a time.** The landing page is built and reviewed before any
   other surface is touched.
3. **No number on screen that is not real.** Every figure traces to a project's
   actual measured output.

## Unresolved

- No image generation this session. This world needs none: rings, curved tracks,
  bars, rules and type are all native to SVG.
- Card images are still placeholders; `resume.pdf` is still absent.
