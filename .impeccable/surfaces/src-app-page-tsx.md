---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/layout.tsx","src/app/globals.css","src/components/layout/Header.tsx"]
---

# Landing page and site shell

Scope: `src/app/page.tsx`, the shared layout chrome, and the token layer every
route reads. Visitor mode: **Experience** — the artifact leads, the interface
recedes.

Audience: recruiters and hiring engineers screening for internships and
early-career roles. Under a minute, frequently on a phone, mid-triage across
many candidates. Job: play or watch one demo and leave believing these programs
actually run. Action: step into a demo. Proof: six projects that genuinely
execute in the browser, ported from the original source rather than recreated.

Constraints: static export, no backend. Every demo stays code-split and must not
load on pages that do not render it. WCAG AA in both themes, keyboard-operable,
reduced-motion honoured. Content, copy, demos and structure are preserved — this
is a restyle, not a rewrite. Two projects cannot show source.

## Direction contract

THESIS: An arcade cabinet is a machine that runs itself in public until a
stranger steps up and plays. Six of these projects do exactly that, so the site
becomes the cabinet rather than a page describing one. It refuses the two
category defaults: the dev-portfolio canon of near-black ground, neon accent,
mono labels and terminal chrome, and its predictable opposite, the warm cream
ground with editorial serif display.

OWN-WORLD: A deep indigo cabinet ground owns the full viewport, not a neutral
page wearing accents. Silkscreen palette with one job per colour: hot magenta-red
for what is live and playable, warm amber for scores, counters and measurement,
cyan reserved for active state and focus, bone-white stock for display lettering.
Marquee lettering is heavy, tight and slightly condensed with real character;
counters and measurements set in the same face tabular. Material is silkscreen
on metal and backlit acrylic — flat saturated ink over a subtly grained ground,
never gloss or bevel. Panels are bounded by drawn rules with hard corners, not
soft floating cards. Every control is rebuilt in this vocabulary: buttons read as
lit panel switches, links as screened labels, the theme control as a cabinet
toggle.

STORY: The visitor lands on a machine already mid-run. They understand within
seconds that these are working programs, not screenshots, because one is running
in front of them before they scroll. They believe it because each artifact
carries its own ticket of origin — what it was ported from, what is genuinely
executing. They step up and play one.

FIRST VIEWPORT: No hero paragraph and no hero-metric template. The Sudoku solver
runs full-bleed as attract mode across the upper field, its decision and
backtrack counters set as amber cabinet scores directly on the ground. A
silkscreened marquee carries the name across the top of that field. A lit
PLAYABLE HERE panel sits at the lower left of the field where a coin slot would
be, holding the primary action; the six runnable projects begin immediately
below as the cabinet row, each a bounded panel with its origin ticket. Section
headings are screened marquee labels on the ground, all sharing one left edge.

FORM: The Cabinet — arcade cabinet marquee, attract mode and cabinet side art.
Candidate 4 of seven on my grounded list, ordered by resonance; assigned by the
roll. Seed key 15b36776.

Raises taken from declined challengers, each named by donor:
- From Shader Portal: total environmental commitment — the cabinet owns the
  whole viewport as one machine, never a themed header above ordinary sections.
- From Darkroom Safelight Bay: station discipline — every demo is a station with
  real state (idle, attract, playing, finished), not a card that links away.
- From Moon-Shadow Bazaar: every artifact carries its ticket of origin, attached
  to the thing itself.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Unresolved

- No image generation in this session, so the build is code-led: no comps, and
  the ambition is carried by FIRST VIEWPORT plus the attract-mode signature
  interaction, audited in behaviour at the finish review.
- Card images across the project surfaces are still placeholders; `resume.pdf`
  is still absent.
