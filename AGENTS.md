# AGENTS.md

Repository instructions for coding agents working on Devly. Keep this file as the
single source of project guidance; `CLAUDE.md` imports it.

## User preferences and privacy

- Begin the first response to each user prompt with "Okay, Zach". Do not repeat it
  in subsequent updates for that same prompt.
- Never read `.env` files, including environment-specific variants or copies in
  Git history. Devly needs no secrets; if configuration context is ever needed,
  ask Zach to create a sanitized `.env.example`.
- Never print credentials or commit secrets.

## Project overview and map

Devly is an offline installable PWA for practicing system design between gym
sets: one problem a day, each split into a multiple-choice quiz, a step-by-step
diagram walkthrough, a free-text design compared against a model answer, and
concept flashcards with Leitner review. All content is bundled; there is no
server, account or database. It shares Lift's stack and look: React 19, Vite 8,
Tailwind CSS 4, Motion and Preact signals.

| Location | Responsibility |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Startup, appearance, service worker, routes and tab bar |
| `src/pages/` | Today and problem overview, quiz, diagram, design, cards, library/deck, progress/settings |
| `src/components/kit.tsx`, `ui/` | Shared page, card, row, sheet and control primitives (from Lift) |
| `src/components/problem.tsx` | Problem brief, step list, progress bar and the practice-step frame |
| `src/components/diagram-view.tsx` | SVG architecture renderer (node size `NODE`, kinds and icons) |
| `src/content/problems/NN-<id>.js` | One problem per file; the `NN` prefix is the daily order |
| `src/content/cards/*.js` | Concept cards, merged into one deck |
| `src/content/index.js` | Loads content with `import.meta.glob`; warns in dev if it's malformed |
| `src/lib/model.js` | Pure logic: dates, daily pick, streaks, Leitner boxes, scoring, `validateContent` |
| `src/lib/store.js`, `db.js` | Signals over IndexedDB records and the actions that write them |
| `src/lib/router.js`, `theme.js`, `wake.ts` | Hash navigation, appearance, screen wake lock |
| `tests/model.test.js`, `tests/content.test.js` | Logic tests and checks over every content file |
| `vite.config.ts`, `vercel.json` | PWA build and static deployment with security headers |
| `assets/icon.svg`, `scripts/build-icons.mjs` | Source icon and PNG generation |

## Setup and commands

Use npm and preserve `package-lock.json`. On Windows PowerShell use `npm.cmd`.

| Task | PowerShell command |
| --- | --- |
| Install locked dependencies | `npm.cmd ci` |
| Start development with hot reload | `npm.cmd run dev` |
| Run all tests | `npm.cmd test` |
| Check content only | `node --test tests/content.test.js` |
| Build production assets into `dist/` | `npm.cmd run build` |
| Serve the production build | `npm.cmd run preview` |
| Typecheck | `npx.cmd tsc --noEmit -p .` |
| Regenerate PNG icons after editing the SVG | `npm.cmd run build:icons` |

Development uses `http://localhost:4340` with a strict port (Lift uses 4330).
Service workers are disabled on localhost unless the URL has `?sw`.

## Content rules

- Problem shape: see `01-url-shortener.js`. `tags` and quiz `tag` come from `TAGS`
  and node kinds from `NODE_KINDS` in `model.js`.
- Diagrams use a 360×480 canvas with 96×46 nodes: x 50–310, y 30–450, any two nodes
  ≥104 apart horizontally or ≥62 vertically, node labels ≤14 characters, edge
  labels ≤10. Every node is added by exactly one step.
- Every `cardIds` entry must exist in a cards file; card ids are unique.
- Content is original writing. Don't copy from DevMaxx, books or courses.
- Adding a problem never needs code changes; `content.test.js` must pass.

## Data invariants

- Records: `settings`, `day:<YYYY-MM-DD>` (`problemId`, `done` marks like
  `url-shortener:quiz`), `attempt:<problemId>` (quiz answers, diagram step, design
  draft/checked/revealed, rated cards, `done`, `completedOn`) and `card:<cardId>`
  (Leitner `box`, `due`, `reviews`). All carry `updatedAt`.
- A day keeps its pinned problem. Streaks count days with at least one done mark.
- Problem and card ids are stored in progress, so don't rename them once shipped.
- Backups are `{ app: "devly", version: 1, records }`; imports keep the newer copy.

## Validation

Before handing off, run `npm.cmd test` and `npm.cmd run build`. For UI changes,
check the flow in a browser at mobile size in light and dark. Report exactly
which checks ran, without claiming device or deployment validation.

## Build and deployment

Vercel builds with `npm run build` and serves `dist/` at devly.zachhersick.com.
There are no functions or environment variables. See `README.md`.
