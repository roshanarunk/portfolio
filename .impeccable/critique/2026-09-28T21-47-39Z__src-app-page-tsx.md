---
target: the portfolio website
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:c:\\Users\\Roshan\\Documents\\Code\\portfolio\\src\\app\\page.tsx"
target_fingerprint: "sha256:b1510f3b608a271239b46bdc7622d56d77b2d10d2ff3a6bbfa4c53d436184096"
target_path: "c:\\Users\\Roshan\\Documents\\Code\\portfolio\\src\\app\\page.tsx"
timestamp: 2026-09-28T21-47-39Z
slug: src-app-page-tsx
---
Method: dual-agent (A: design review, B: detector + browser evidence). Visual inspection partial: dark mode only; mobile from source; detector ran via URL scan, no overlay injection (no browser automation package).

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Hero solver has no running/paused state |
| 2 | Match System / Real World | 3 | CC3K touch buttons labelled "move no" / "attack ea" |
| 3 | User Control and Freedom | 2 | Hero loops forever with no pause; home filter capped at 3 with no "see all" |
| 4 | Consistency and Standards | 2 | 5 synonyms for "runnable"; two Source buttons; VRVision copy contradiction |
| 5 | Error Prevention | 3 | Primary CTA sends phones to keyboard-first CC3K |
| 6 | Recognition Rather Than Recall | 3 | Cards are text-only, no preview |
| 7 | Flexibility and Efficiency | n/a | Experience surface |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but category-default styling |
| 9 | Error Recovery | 3 | Good demo error boundary; 404 is a dead end |
| 10 | Help and Documentation | n/a | Per-demo instructions suffice |
| **Total** | | **22/32** | **Acceptable (69%)** |

## Design Specificity Verdict
Content is specific to the author; visuals are the default Next/Tailwind kit (Geist on neutral-950, one emerald accent, bordered cards with pills and arrows, tracked micro-labels, rise stagger). The hero solver is the one authored visual idea and is never echoed. Detector: CLI clean with config; URL scan flagged overused-font Geist (true), ai-color-palette x60 (false positive: dark: class read in light mode), gray-on-color x3 (false positive; config ignore reason stale: says emerald-600, code is emerald-700).

## Priority Issues
- [P1] No resume anywhere: site.resume (site.ts:20) never rendered; public/resume.pdf missing. Fix: ship PDF, add to header nav, contact band, and end of detail pages. /impeccable clarify
- [P1] Random 3-of-18 home sample (FilteredWork.tsx:9-18) often has no live demo. Fix: curated fixed row of 3-4 live demos with verb+duration labels and visual previews; move stack filter to /projects. /impeccable distill
- [P1] Primary CTA "Play the roguelike" (page.tsx:33) sends phones to ~948px keyboard-first CC3K; hero board entry is a tiny text-xs link. Fix: board as CTA, or route touch to Sudoku/League. /impeccable adapt
- [P2] Hero animation loops forever, no pause (WCAG 2.2.2), runs off-screen, role=img label changes every frame (HeroSolver.tsx:408). Fix: pause toggle, IntersectionObserver, static label. /impeccable harden
- [P2] Contrast below AA: white on emerald-600 3.67:1 (FilteredWork.tsx:150, GP2040Demo.tsx:132); neutral-500 in dark 4.18:1 (CC3K, League, HeatMap demos); MotionDemo focus border 2.46:1 (MotionDemo.tsx:212). /impeccable audit

## Persona Red Flags
- Recruiter (45s): name not in h1; no school/grad year/availability above fold; experience list below random sample.
- Casey: hero board below h1, intro, 5 links, fact list; filter chips ~26px tall; non-interactive tech names look tappable.
- Sam: changing hero label, no pause; compass shorthand labels; CC3K log index keys over slice(-40); hover on non-interactive Experience rows.
- Jordan: two competing demos in hero; unnamed coaching org; tier labels don't say what's runnable.

## Minor Observations
- VRVision contradiction: projects/page.tsx:25 and about/page.tsx:53 say Android AR app can't run in browser.
- "36 million kills" fact vs 667-kill demo reads as inflation.
- Detail pages end with no next demo/resume/contact; challenge paragraphs unlabeled.
- "actually" x3; unreachable empty-state branch; 404 could offer a demo.

## Questions to Consider
- What if the hero board is the CTA?
- Would one curated row of four 20-second demos lose anything vs sample+filters+tiers?
- Why not surface bug-writeup hooks on the cards?
