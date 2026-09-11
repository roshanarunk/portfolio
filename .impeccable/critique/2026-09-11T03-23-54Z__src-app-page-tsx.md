---
target: the site (landing page)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\Roshan\\Documents\\Code\\portfolio\\src\\app\\page.tsx"
target_fingerprint: "sha256:53952a2746c465fb472092c9fb6e01c7469f3089bcd652c2600ff3f7bdb4fb7e"
target_path: "C:\\Users\\Roshan\\Documents\\Code\\portfolio\\src\\app\\page.tsx"
timestamp: 2026-09-11T03-23-54Z
slug: src-app-page-tsx
---
Method: dual-agent (A: a55ba0149c0f09127 · B: a641885f893ad02b1)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Demo skeleton labels are good; landing never signals six demos exist |
| 2 | Match System / Real World | 3 | Copy is plain and human; "Interactive" badge is system-speak for "playable" |
| 3 | User Control and Freedom | 3 | Reset on every demo, error boundary with retry; no breadcrumb back to section |
| 4 | Consistency and Standards | 3 | Strong via DemoShell; two different CTA priorities rendered at same weight |
| 5 | Error Prevention | 3 | Exhaustive union fails build on new demo kind; resume.pdf/linkedin are dead |
| 6 | Recognition Rather Than Recall | 2 | Cards carry no thumbnail or preview; visitor must recall what "VRVision" was |
| 7 | Flexibility and Efficiency | 2 | allTechLabels() filter written then never wired; 14 projects, no filter/search |
| 8 | Aesthetic and Minimalist Design | 2 | Minimal to the point of no point of view; one accent colour, spent on a label |
| 9 | Error Recovery | 3 | DemoErrorBoundary with retry is above average; blocked-mobile is a dead end |
| 10 | Help and Documentation | 3 | About's "How this site works" is honest but undiscoverable from landing |
| **Total** | | **27/40** | **Acceptable — significant improvements needed** |

All ten heuristics applied; 7 and 10 were scored rather than n/a because the dropped filter and the About explainer are both real and assessable.

## Design Specificity Verdict

**LLM assessment: authored in the copy, generic in the interface.**

The writing is unmistakably this person's — "a backtracking solver you can watch think", the cc3k note that four of five races won none of sixty simulated runs until a missing `rand() % 2` surfaced, the bank-website entry labelling itself a tutorial build before a recruiter can catch it.

The interface is the default. Strip the content files and what remains is the Next.js starter: Geist, `max-w-5xl px-6`, neutral-900 on white, `rounded-xl border p-5` cards, `border-t` section rules. Exactly one accent colour exists in the system — emerald on the demo badge — and it is spent on a label rather than on the work.

The fatal mismatch is against Experience mode, whose brief is "let the artifact lead from the first viewport". Six interactive demos exist and **the landing page contains none of them**. The differentiator is represented above the fold by nothing, and below it by the word "Interactive" in a small green pill.

**Deterministic scan: zero findings.** `impeccable detect --json src public` and `--json src/app src/components` both returned `[]`, exit 0. No slop families, no anti-patterns, no rule hits. This is a clean result from a detector that ran successfully, not an unavailable scan — the problems here are compositional, not defect-level.

**Browser evidence corroborated one real accessibility gap the design review only sensed.** Three contrast failures, all the same pair, all dark theme: `neutral-500` on `neutral-950` at **4.18:1** against a 4.5:1 requirement, from an explicit `dark:text-neutral-500` override that keeps the colour identical in both themes instead of lightening it. 23 occurrences in source. Two further computed failures in the WatTravl SVG at 9px: `fill-amber-600` on white at **3.2:1**, `fill-sky-600` at **4.02:1**.

**Visual overlays: not available.** No script injection into a presented browser tab was attempted, so no user-visible overlay exists. The evidence above is CLI detector output plus headless measurement.

## Overall Impression

The engineering is well ahead of the design, and the content is well ahead of both. This is a site whose entire argument — *my projects actually run, here, now* — is made everywhere except the place that decides whether anyone reads on.

Nothing here is broken. The detector is clean, there is zero horizontal overflow at any breakpoint, every image has alt text, every button has an accessible name, and the heading outline is correct on three of five pages. It is competent, tidy, and anonymous.

The single biggest opportunity: **put a running demo in the first viewport.** The peak moment — realising the roguelike is playable — currently sits three clicks deep behind six identical cards. Most visitors never reach it, so their remembered experience is of a tidy portfolio that looked like everyone else's.

## What's Working

1. **The HOOJ narrative section.** Four scattered repos reframed as one year-long product story — league site, then admin tooling, then coach analysis — as a numbered list that makes the sequence legible. This is the difference between "four side projects" and "I saw an organisation's needs and built them out over a year". It is the most senior thinking on the site.

2. **The `challenges` content model, and the candour in it.** Problem/solution pairs force specificity and the entries deliver: the GroupShuffleSplit leak, the tuple-comparison port bug, the round-numbering off-by-one, the `rand() % 2` discovery that only a bot playing hundreds of runs could surface. Most portfolios claim competence; this one documents specific mistakes and the reasoning that resolved them.

3. **`DemoShell` as a unifying contract.** One component owns reset, error boundary, badge, instructions and source link, so no demo reimplements chrome and one failure cannot blank the page. With the `ssr: false` registry keeping demo bundles off pages that do not render one, the architecture is itself part of the portfolio — and the About page correctly uses it as evidence.

## Priority Issues

**[P0] The first viewport contains no artifact.**
- **Why it matters:** Experience mode requires the artifact to lead. A recruiter spending twenty seconds forms their whole impression from "I build tools people actually use" — a claim true of every engineer alive — and never learns the site's one distinguishing fact. The best asset is invisible at the only moment it can change an outcome.
- **Fix:** Mount the Sudoku solver in "watch it solve" mode in the hero, auto-playing on load and respecting reduced-motion. It is the lightest bundle, visually self-explanatory, and its step counter is hypnotic. Cut the hero copy to one line so the h1 captions a working artifact instead of standing alone as an assertion.
- **Suggested command:** `/impeccable shape`

**[P1] Six identical cards, no ranking, no preview of what is behind them.**
- **Why it matters:** Fails recognition-over-recall and chunking at once. The visitor must decode six text blocks and guess which deserves a click; most pick none. "VRVision — Augmented reality as an aid for low vision" gives no hint that clicking runs its actual GLSL against your webcam.
- **Fix:** Promote one project to a full-width hero card with a live or looping preview, and cut the featured set to three. Add `posterSrc` to `LiveDemo` — the type already supports posters for iframe and video — and render it on the card.
- **Suggested command:** `/impeccable layout`

**[P1] Dark-theme contrast fails WCAG AA in 23 places.**
- **Why it matters:** `neutral-500` on `neutral-950` measures 4.18:1 against a 4.5:1 requirement, affecting tech tags, section headings and year labels. Dark is the default for a large share of developer-audience traffic. This is the one finding where measurement beat intuition — the design review flagged the palette as thin, the browser proved a specific failure.
- **Fix:** Replace `dark:text-neutral-500` with `dark:text-neutral-400`, which measures 7.66:1. Raise the 9px WatTravl SVG labels (`fill-amber-600` 3.2:1, `fill-sky-600` 4.02:1) to 400-level equivalents and above 9px.
- **Suggested command:** `/impeccable audit`

**[P1] `resume.pdf` and `linkedin` are shipped dead on a recruiter-targeted site.**
- **Why it matters:** The stated goal is internships. Recruiters look for a resume within seconds of deciding they are interested, and it is absent entirely. Wiring the existing constant without adding the file produces a 404 at the highest-intent moment.
- **Fix:** Add `public/resume.pdf`, surface it as a second hero CTA and in the footer, and either populate `linkedin` or delete the key so it cannot be wired to an empty string.
- **Suggested command:** `/impeccable clarify`

**[P2] Three h2s at identical weight flatten the page.**
- **Why it matters:** "Selected work", "Building the tooling for a coaching org" and "Get in touch" are all `text-xl font-medium` behind identical rules and padding. The HOOJ section is the strongest narrative on the site; the contact section is a utility footer. Uniform rhythm reads as "nothing here matters more than anything else".
- **Fix:** Differentiate by role. Give HOOJ a tinted panel and a larger heading; demote "Get in touch" to a compact inline band; keep section rules only at genuine topic changes.
- **Suggested command:** `/impeccable typeset`

## Cognitive Load

**4 of 8 checks fail — high, critical band.**

- **Single focus — FAIL.** Four co-equal sections, each with identical rule and padding. No instructed path.
- **Chunking — FAIL.** Six featured cards where the working-memory limit is four.
- **Visual hierarchy — FAIL.** All three h2s identical; the page reads as a flat list of four equal things.
- **Minimal choices — FAIL.** The landing page offers **19 interactive targets**; `/projects` opens with 14 cards.
- Passing: grouping (HOOJ is the smartest IA decision on the site), one-thing-at-a-time on detail pages, working memory, progressive disclosure.

## Persona Red Flags

**Jordan (first-timer) — most damaging.** Lands on a claim with no evidence. The green "Interactive" pill could equally mean "has a UI". The one paragraph that resolves it — *"Portfolios usually show screenshots. I wanted the projects to be usable"* — is on `/about`, behind a nav link Jordan has no reason to click. Jordan leaves without discovering the site's premise.

**Alex (power user).** Wants the best demo in one action. The only primary CTA leads to 14 more cards in three groups. `allTechLabels()` was written for a filter and never wired to a UI. No search, no deep link to the strongest demo, no cue distinguishing the roguelike from the HooBank tutorial build.

**Casey (mobile, one-handed).** At 390px the header packs a full name, three nav links and a theme toggle into one row with no hamburger; the 32×32 toggle sits at the hardest point to reach one-handed. Worst: tapping through to ChamberCrawler3000 — the most intriguing card — reaches an arrow-key-and-numpad roguelike set to `mobileFallback: "scaled"`, with no touch controls verified at that width.

## Minor Observations

- `allTechLabels()` is dead code with a comment promising a filter that does not exist. Build it or delete it.
- `Project.role` is populated on three projects and rendered nowhere. "One of six on the team" is exactly the honest signal a recruiter wants.
- 197 touch targets fall under 44×44 at some breakpoint. Most are Sudoku grid cells (inherent to a 9×9 board), but nav links (~62×32), the theme toggle (32×32) and footer links (57×20) are not.
- Heading levels skip h1 to h3 on `/projects/cc3k/` and `/projects/sudoku/`, because `DemoShell` renders an h3 before the first h2.
- Smallest rendered text is 12px; 10px, 9px and 8px sizes are declared inside the WatTravl SVG and Sudoku pencil marks.
- `twitter: { card: "summary_large_image" }` is declared with no OG image anywhere — link previews render blank.
- `site.url` is a placeholder Vercel domain feeding `metadataBase`.
- The landing hero renders the tagline, not the name; the visitor first meets who this is in the header logo at `text-base`.
- `demoLabel` maps gallery and writeup to `null`, a silent third state indistinguishable from "no demo".

## Questions to Consider

1. If a recruiter saw only your first viewport, what would they know about you that they would not know about any other CS student? Right now: nothing.
2. You built six interactive demos, then made a landing page that describes them. Why does the site argue for the work instead of being the work?
3. Your best sentence — "the same GLSL runs in the demo above, unmodified apart from the sampler" — is buried in a bullet list. What is it doing there instead of in the hero?
4. Which single project should a recruiter open first? You know the answer. Nothing in the design says it.
5. The `disclosure` field is the most trustworthy thing on this site. What would it cost to put that candour on the landing page rather than only where it is required?
