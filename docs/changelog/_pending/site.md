version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Build the public site + proposal module (T-033..T-036): P-01 the landing concept for a redesigned caltenantlaw.com, P-02 the departments x roles full-stack proposal, P-03 the replacement map, P-04 the client-facing roadmap.
decision: One module `src/modules/site` holds all four pages rather than the `site` + `proposal` split sketched in build-plan.md - the four pages share the SiteLayout frame, one nav, one string table and one plan-lookup helper, and the registry keys on path, not folder. Pass and status are never typed into the proposal: `planFor(codes)` reads `docs/plan/tasks.json` at build time so P-02, P-03 and P-04 cannot disagree with the plan (D-014). The matrix and the replacement map are DataTables (library only, card fallback under 768 px) rather than hand-rolled grids. Every price and vendor from the firm digest renders behind an "Unverified" badge with "as listed on the current site" (D-025), and rows carry how the fact was established (on the site / inferred / from the firm).
rejected: A separate `proposal` module (splits one frame, one nav and one string table across two folders for no gain); a hand-rolled CSS-grid matrix (contract forbids hand-rolled tables and it would lose the phone fallback); hard-coded pass numbers in the proposal (would drift from tasks.json within a pass); a `/site/consultation` route for the header CTA (nothing behind it until F-11, so the CTA points at the booking band on P-01 instead of a route that redirects to the hub); naming the unidentified scheduler / forms vendors (inferred, not observed).
files: src/modules/site/{index.ts,specs.ts,strings.ts,chrome.tsx,site.css,siteData.ts,proposalData.ts,LandingPage.tsx,ProposalPage.tsx,ReplacesPage.tsx,RoadmapPage.tsx}, docs/pages/{P-01,P-02,P-03,P-04}.md, docs/screenshots/{P-01,P-02,P-03,P-04}/
codes: P-01, P-02, P-03, P-04

# Public site and proposal 0.1.0

Model: Opus 5 (module and pages, against the contract).

## What landed

- **P-01 `/site`** - the educate-first funnel: hero on "Renters' rights lawyers since 1980" and "Your cloudy day is about to clear up", the three-step "how it works", the game-board teaser into `/#/board`, a ten-stage picker (notice, served, motion to quash, demurrer, answer, default, discovery, summary judgment, trial, appeal) that shows what happens at that square and the services indexed under it, a twelve-lesson curriculum preview, the offices strip from the `tenants` table, EN/ES in the header and in the hero, and the booking band. Replaces the `_stubs` P-01 by registering the same path.
- **P-02 `/site/proposal`** - 9 departments x 7 roles x 52 features as an interactive matrix with a role filter and a detail drawer (what it does, who uses it, which pass, page codes, the planned tasks behind it); "one system around the client's case"; seven promises (deadline radar, discovery gathering, cost roadmap with if/then, pleading paper replacing WordPerfect, the LMS, one comms log, the appliance); the development method (hub, dev mode, annotations, docs in the same turn, model routing, phone-to-4K); links into `/#/plan` and `/#/board`; print.
- **P-03 `/site/proposal/replaces`** - twelve current tools with what they do, why they hurt, what replaces them, the pass and the page codes, plus four integrations kept on purpose as seams (Stripe, Supabase, YouTube, court e-filing). Every row carries its evidence flag.
- **P-04 `/site/proposal/roadmap`** - the six passes with goal, gate, lanes and live progress from task statuses, the ticks-not-days explanation, the annotation workflow, and the five "awaiting the firm" asks mirrored from `docs/kanban.md`.
- **Module data** - `siteData.ts` (stages, SKUs as listed, lessons, steps) and `proposalData.ts` (departments, matrix roles, 52 features, promises, method, 12 replacements, 4 seams, 5 asks, plus the `tasks.json` lookup helpers `planFor`, `passProgress`, `passTicks`).
- **18 actions** across the four pages, every one with a live handler; the unwired ones answer honestly with the pass that wires them.

## Surfaces delta

New routes (all surface `public`, roles `EVERYONE`, SiteLayout):

| Route | Code | Page |
| --- | --- | --- |
| `/site` | P-01 | Public home (replaces the `_stubs` placeholder at the same path) |
| `/site/proposal` | P-02 | Proposal: the full-stack view |
| `/site/proposal/replaces` | P-03 | Replacement map |
| `/site/proposal/roadmap` | P-04 | Client-facing roadmap |

New actions in the registry (D-20 / the WebMCP and voice vocabulary):

| Id | Page | Permission | Params |
| --- | --- | --- | --- |
| `site.pickStage` | P-01 | — | `stage: enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal` |
| `site.openStore` | P-01 | `store.read` | `stage: enum` |
| `site.startIntake` | P-01 | — | — |
| `site.bookConsult` | P-01 | — | — |
| `site.watchVideo` | P-01 | — | `lessonId: string` |
| `site.openBoard` | P-01 | — | — |
| `site.setLang` | P-01 | — | `lang: enum:en,es` |
| `site.filterRole` | P-02 | — | `role: enum:all,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel` |
| `site.resetMatrix` | P-02 | — | — |
| `site.openFeature` | P-02 | — | `featureId: string` |
| `site.openPlan` | P-02 | — | — |
| `site.printProposal` | P-02 | — | — |
| `site.filterReplacements` | P-03 | — | `view: enum:all,replaced,partly` |
| `site.openReplacement` | P-03 | — | `toolId: string` |
| `site.printReplacements` | P-03 | — | — |
| `site.selectPass` | P-04 | — | `pass: number` |
| `site.toggleTasks` | P-04 | — | — |
| `site.giveFeedback` | P-04 | — | — |

No new tables, no new rules, no new DataProvider methods, no new npm scripts, no new components. `docs/reference/surfaces.md` is a shared file owned by the Pass 1 integration task (T-050); this section is the delta to fold into it.

## Quality

- `npm run build` green.
- `npm run qa:responsive -- --codes=P-01,P-02,P-03,P-04`: 56 cells (4 routes x 7 widths x light/dark), **0 failing, 0 a11y findings**.
- `npm run screenshots -- --codes=P-01,P-02,P-03,P-04 --dark` plus `--widths=3840` for P-01 and P-02: no console errors.

## Open

- Prices, the video order, the eighth office and the real attorney names stay unverified (D-025, U-2, U-4, U-5); T-112 in Pass 5 clears them from P-02 and P-03.
- The header CTA and the booking band are Placeholders until F-10 / F-11 land; the stage picker's store link waits on P-10; the play buttons wait on C-40.
- Spanish covers every heading, every label and every short body string; the longest feature descriptions in `proposalData.ts` fall back to English until the Spanish fill pass.
