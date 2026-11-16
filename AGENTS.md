# AGENTS.md

Repository instructions for coding agents working on Devly. Keep this file as the
single source of project guidance; `CLAUDE.md` imports it.

## User preferences and privacy

- Begin the first response to each user prompt with "Okay, Zach". Do not repeat it
  in subsequent updates for that same prompt.
- When usage information is available, check it on the first response and warn
  Zach if session usage is nearing its limit. Do not invent usage figures or claim
  monitoring when usage is unavailable.
- Never read `.env` files, including environment-specific variants or copies in
  Git history. Devly needs no secrets; if configuration context is ever needed,
  ask Zach to create a sanitized `.env.example`.
- Never print credentials or commit secrets.

## Project overview and map

Devly is an offline installable PWA for practicing system design between gym
sets: one problem a day, each split into a multiple-choice quiz, a step-by-step
diagram walkthrough, a free-text design compared against a model answer, and
concept flashcards with Leitner review. All content is bundled (60 problems and
109 cards); there is no server, account or database. It shares Lift's stack and
look: React 19, Vite 8, Tailwind CSS 4, Motion and Preact signals.

| Location | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Startup, appearance, service worker, routes and tab bar |
| `src/pages/` | Today and problem overview, quiz, diagram, design, cards, library/deck, progress/settings |
| `src/components/kit.tsx`, `ui/` | Shared page, card, row, sheet and control primitives (from Lift) |
| `src/components/problem.tsx` | Problem brief, step list, `Progress` bar and the `PracticeFrame` every step uses |
| `src/components/diagram-view.tsx` | SVG architecture renderer (node size `NODE`, kinds and icons) |
| `src/content/problems/NN-<id>.js` | One problem per file; the `NN` prefix is the daily order |
| `src/content/cards/*.js` | Concept cards by topic, merged into one deck; `core.js` holds the base concepts |
| `src/content/index.js` | Loads content with `import.meta.glob`; warns in dev if it's malformed |
| `src/lib/model.js` | Pure logic: dates, daily pick, streaks, Leitner boxes, scoring, `validateContent` |
| `src/lib/store.js`, `db.js` | Signals over IndexedDB records and the actions that write them |
| `src/lib/router.js`, `theme.js`, `wake.ts` | Hash navigation, appearance, screen wake lock |
| `tests/model.test.js`, `tests/content.test.js` | Logic tests and checks over every content file |
| `vite.config.ts`, `vercel.json` | PWA build and static deployment with security headers |
| `tsconfig.json` | Typechecks `src/` only (`vite.config.ts` is excluded) |
| `.claude/launch.json` | `devly` (dev server) and `devly-preview` (production preview), both on port 4340 |
| `assets/icon.svg`, `scripts/build-icons.mjs` | Source icon and PNG generation |

## Setup and commands

Use npm and preserve `package-lock.json`. On Windows PowerShell use `npm.cmd`.

| Task | PowerShell command |
| --- | --- |
| Install locked dependencies | `npm.cmd ci` |
| Start development with hot reload | `npm.cmd run dev` |
| Run all tests | `npm.cmd test` |
| Check content only | `node --test tests/content.test.js` |
| Typecheck | `npx.cmd tsc --noEmit -p .` |
| Build production assets into `dist/` | `npm.cmd run build` |
| Serve the production build | `npm.cmd run preview` |
| Regenerate PNG icons after editing the SVG | `npm.cmd run build:icons` |

Development and preview both use `http://localhost:4340` with a strict port (Lift
uses 4330), so stop one before starting the other. Service workers are disabled on
localhost unless the URL has `?sw`.

## Change workflow and code style

- Read the affected code and search its callers before editing. Make the smallest
  complete change, and reuse existing helpers and components before adding
  dependencies or abstractions.
- Match nearby code: ES modules, two-space indentation, semicolons and double
  quotes. UI is TSX; logic in `src/lib` is JavaScript. Use the `@/` alias for `src`.
- Keep pure logic in `model.js` and cover it in `tests/model.test.js`.
- Read signals in React through `useValue` (`src/lib/use-signal.ts`). Write progress
  only through the store actions (`updateAttempt`, `finish`, `rate`, `saveSettings`,
  `pinToday`) so streak marks and `updatedAt` stay correct.
- Reuse `kit.tsx`, `PracticeFrame` and `Progress`, and the theme tokens in
  `styles.css`. Keep practice actions in the bottom thumb zone, the tab bar hidden
  on practice pages, and preserve light/dark themes, safe areas and accessible
  labels. New practice pages call `useWakeLock()`.
- Look: graphite neutrals, one accent (default marker blue, `blue` tint) used for
  the primary action, selection and progress only. The architecture diagram is
  the one multi-colored thing; no glows, gradients, uppercase labels or springs
  (motion uses `spring`/`softSpring` from `kit.tsx`, which are ease-out tweens).
  Step progress always shows as `SetTicks` (four sets); counts and meta use
  `font-mono`. Weights 400–500, sizes on the existing scale.
- Don't reformat unrelated files or edit generated `dist/` output.

## Content rules

- Problem shape: see `01-url-shortener.js`. `tags` and quiz `tag` come from `TAGS`
  and node kinds from `NODE_KINDS` in `model.js`. Spread correct answers across
  choices A–D.
- Diagrams use a 360×480 canvas with 96×46 nodes: x 50–310, y 30–450, any two nodes
  ≥104 apart horizontally or ≥62 vertically, node labels ≤14 characters, edge
  labels ≤10. Every node is added by exactly one step. The renderer drops an edge
  label that doesn't fit beside a short arrow, so leave labels off short edges.
- If `NODE` in `diagram-view.tsx` changes, update the spacing check in
  `tests/content.test.js` and the numbers above.
- Every `cardIds` entry must exist in a cards file; card ids are unique.
- Content is original writing. Don't copy from DevMaxx, books or courses.
- Adding a problem never needs code changes; `content.test.js` must pass.

## Data invariants

- Records: `settings`, `day:<YYYY-MM-DD>` (`problemId`, `done` marks like
  `url-shortener:quiz`), `attempt:<problemId>` (quiz answers, diagram step, design
  draft/checked/revealed, rated cards, `done`, `completedOn`) and `card:<cardId>`
  (Leitner `box`, `due`, `reviews`). All carry `updatedAt`.
- `dailyProblem` returns the day's pinned problem; otherwise the first problem in
  bank order that no earlier day was given and that isn't completed; once the bank
  is used up, the one given longest ago. A problem is completed when all four steps
  are done. Inserting or reordering problem files changes future picks, never
  pinned days.
- Streaks count days with at least one done mark; a day without one yet doesn't
  break the streak until it's over.
- Leitner intervals are `BOX_DAYS = [0, 1, 3, 7, 14, 30]`; "Again" returns a card to
  box 1, due today.
- Problem and card ids are stored in progress, so don't rename them once shipped.
- Backups are `{ app: "devly", version: 1, records }`; imports keep the newer copy.

## Validation

Before handing off code, run `npm.cmd test`, `npx.cmd tsc --noEmit -p .` and
`npm.cmd run build`. For UI changes, check the flow in a browser at mobile size in
light and dark. For offline or service-worker changes, serve the build with
`npm.cmd run preview`, open it with `?sw`, and confirm the Workbox precache holds
every built asset. Report exactly which checks ran, without claiming device or
deployment validation.

## Git, build and deployment

- The repository is `https://github.com/zachhersick/devly` (public, with secret
  scanning, push protection and Dependabot alerts on); `main` is the deploy
  branch. There is no CI workflow. Commit or push only when Zach asks, and never
  commit anything personal or secret, since every commit is public.
- Vercel builds with `npm run build` and serves `dist/` at devly.zachhersick.com,
  deploying on every push to `main` once the project is imported. There are no
  functions or environment variables. The Vercel project imports the repo with
  the "Other" preset, and `vercel.json` supplies the build settings.
- `README.md` is public facing: what Devly is, privacy, running locally and
  adding problems. Keep it in step with features, and keep personal or
  deployment-account details out of it. Screenshots live in `docs/screenshots/`.
- `package.json` `overrides` pin patched `glob` and `minimatch` under
  `vite-plugin-pwa`'s `workbox-build` (build-time only). Drop them once
  `vite-plugin-pwa` ships with patched versions; `npm audit --omit=dev` must stay at 0.
- All content ships in one JS chunk (about 830 KB, 268 KB gzipped) under a
  `chunkSizeWarningLimit` of 900. If content grows much, load it with dynamic
  imports rather than raising the limit.
