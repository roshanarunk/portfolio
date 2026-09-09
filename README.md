# Portfolio

Personal portfolio site. The goal is that projects are **usable**, not just
screenshotted: where a project can be made to run in a browser, it does.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

## Checks

```bash
npm run check        # typecheck + lint + test
npm run build        # static export into out/
npx serve out        # verify the exported build, not just dev
```

Always check `out/` before deploying — static export surfaces problems that dev
mode hides, such as a route missing from `generateStaticParams`.

## How demos work

Every project declares a demo *kind* in `src/content/projects/*.ts`:

| Kind      | Used when                                              |
| --------- | ------------------------------------------------------ |
| `live`    | The project runs in the browser (ported or reimplemented) |
| `iframe`  | It is deployed somewhere and can be embedded           |
| `video`   | It needs hardware — a phone, a headset, Windows        |
| `gallery` | Screenshots are the honest option                      |
| `writeup` | The code itself is the story                           |

`DemoRenderer` dispatches on that discriminated union, so adding a kind fails
the build until every branch handles it.

Live demos are registered in `src/components/demos/registry.tsx` and loaded via
`next/dynamic` with `ssr: false`. **Content files must never import the
registry** — they reference demos by id only. That is what keeps demo code off
pages that do not render one; the whole Sudoku demo is a 5KB gzipped chunk that
the landing page never downloads.

`DemoShell` wraps every kind with shared chrome, reset handling and an error
boundary, so one broken demo degrades to a card instead of blanking the page.

### Adding a live demo

1. Write the component under `src/components/demos/<name>/`.
2. Add it to `demoRegistry` and to the `LiveDemoId` union in `src/lib/types.ts`.
3. Set `demo: { kind: "live", componentId: "<name>" }` on the project.

## Layout

```
src/
├── app/                    routes (App Router, static export)
├── components/
│   ├── demos/              the demo system + one folder per demo
│   ├── layout/  project/  ui/
├── content/projects/       typed project data, one file each
├── hooks/  lib/
```

## Deployment

Static export (`output: "export"`) to Vercel. No server, no serverless
functions. `npm run build` produces `out/`.
