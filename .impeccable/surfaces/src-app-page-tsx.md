---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/layout.tsx","src/app/globals.css"]
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

THESIS: A portfolio of programs that actually run should be presented by an
operating system, not by a marketing page. The site is a one-bit desktop: each
project is a window you open, the solver runs in its own window while you read,
and the chrome is the design. It refuses the dev-portfolio canon of near-black
ground with a neon accent, and refuses the warm cream editorial page.

OWN-WORLD: Black and white only — no greys except ordered dither patterns
standing in for every tone. The desktop ground is a 50% dither; windows are pure
white with 1px black chrome; the title bar of a focused window carries horizontal
rules flanking its name, an unfocused one is bare. Depth is a hard offset shadow
block (no blur, no softness), which is the one place this world earns a shape
CSS usually gets wrong. Type is a pixel face for titles and system labels with a
clean small sans for body copy. Every control is a real one-bit control: buttons
with a 1px border and a doubled bottom-right edge, pressed state inverting to
solid black, selection wearing a marching-ants dotted border, disabled rendered
as 50% dither over the label.

STORY: The visitor arrives at a desktop mid-session. The solver is already
running in an open window with its counters climbing, so the claim "these
actually work" is demonstrated before it is stated. Project windows are
arranged around it, each showing what it is, what it was ported from, and
whether it runs here. They open one.

FIRST VIEWPORT: A dithered desktop ground filling the viewport. Top-left: a menu
bar carrying the name and the site's own navigation as menu titles. The largest
window, roughly two-thirds width, is the solver running live, its title bar
reading the project name and its status bar reading the decision and backtrack
counts. To its right, a stacked column of smaller windows: one holding the
intro copy with the primary action as a real button, one listing what runs here
as a file list with sizes. Bottom edge: a status bar counting the projects.
Windows overlap with hard offset shadows so the layering is legible.

FORM: One-Bit Desktop — early black-and-white desktop interfaces. A dealt
challenger that won the re-rolled hand on both axes; the assigned direction was
scientific plate engraving. Seed key 15b36776, re-roll round 1.

Raises taken from declined challengers, each named by donor:
- From Cutting Bench: state is a mark, not a hue — playable, archived and
  source-unavailable are shown by a drawn mark, so state survives greyscale.
- From Mezzotint: total commitment to one ground — the dither owns every
  surface, never a white page with a patterned strip dropped onto it.
- From Data Portrait: the numbers are the argument — counters, sizes and item
  counts are shown as real measured values, never as decorative chrome.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Unresolved

- No image generation in this session. This direction was chosen specifically
  because it needs none: every element is 1px chrome, flat fill, dither pattern
  or type, all of which CSS draws exactly. Nothing here may be approximated with
  a gradient or a blur.
- Build one screen fully and review it before converting any other surface. The
  previous direction failed by converting fourteen files before looking once.
- Card images across the project surfaces are still placeholders; `resume.pdf`
  is still absent.
