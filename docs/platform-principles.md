# Platform principles (binding)

Standing principles for everything built in this repo. Justin set them for every project on 2026-09-18 (workspace rules; first written down in imagine-os/petrock `docs/platform-principles.md`, D-193..D-209 there) and they apply to CTL OS from its first commit (decision D-002 here). They sit above the module contract in `CLAUDE.md`: a page that follows the contract but breaks one of these is not done. Each principle has an id (`P-nn`), the rule an agent applies, **what it means for CTL OS today**, and a **queued work** pointer (task id in `build-plan.md` / `plan/tasks.json`).

Start here if you are new: `docs/README.md`, then this file, then `CLAUDE.md`, `docs/build-plan.md`, `docs/decisions.md`.

## 1. Quality bar

**P-01 - It works on a phone and on a 4K TV.** The responsive matrix is **360, 390, 768, 1280, 1920, 2560 and 3840** px. Large screens serve two uses at once: a 10-foot UI (the owner's or the front desk's wall screen showing the deadline radar) and a 4K monitor at a desk (an attorney with four pleadings open). So body text is at least 16 px at 1920 and above, type and spacing scale up at >= 2560 through a `--scale` custom property on `:root` per width band (never per-page font sizes), focus rings and selection states are visible from across a room (>= 3 px ring, high-contrast token, never colour alone), and dense views (case list, discovery tracker, timeline) stay legible up close by using the extra width for columns, not for whitespace. Nothing is pinned to a 390 or 1440 design width; centred max-width layouts are fine, tiny centred layouts on a TV are not.
- _Today_: nothing is built yet; the foundation ships `scripts/qa-responsive.mjs` with all seven widths and the `--scale` band from day one (T-010, T-021).
- _Queued_: key pages verified first (HUB-01, C-01, L-01, F-01, O-01, GB-01, PM-01, P-01), then the matrix; `spec.checkedAt` records each width; full 4K / 10-foot pass in Pass 5 (T-108).

**P-02 - The quality bar is checked, not assumed.** Definition of done: build green, `spec.checkedAt` recorded, screenshots, page doc, changelog, no console errors, plus the checks below (placeholders marked P-09, actions manifest P-05, en / es strings P-13, surfaces recorded P-10). A deadline rule is not "done" until it cites its statute row.
- _Today_: `npm run qa:responsive`, `npm run qa:bundle`, D-09 spec completeness, D-15 a11y scan come with the foundation.
- _Queued_: legibility check (computed body font-size >= 16 px at >= 1920) in the QA script (T-021); QA matrices per pass (T-051, T-086, T-111).

## 2. Input modalities

**P-03 - Keyboard, mouse, trackpad, touch and pen are expected now.** Every interactive element is reachable and operable by keyboard in a sensible focus order, with a visible focus state (never `outline: none` without a replacement). Touch targets are at least 44 x 44 px. Hover is never the only affordance: anything shown on hover is also shown on focus and reachable on touch (tap to reveal, or always visible on coarse pointers via `@media (pointer: coarse)`). No drag-only interaction: the kanban (PM-01), the game board (GB-01), the canvas (D-21), the document binder and the timeline always have a click / keyboard alternative ("move to", up / down, "place here"), because pens and screen readers do not drag well. Scroll containers are usable with trackpad inertial scrolling (no scroll-jacking); the canvas and the board zoom with buttons as well as wheel / pinch.
- _Today_: library components carry a11y notes in their metas (D-02 / D-08); D-15 checks names, labels, heading order, target size.
- _Queued_: `target-size` promoted to an error once the library is stable (Pass 1 integration, T-051); hover-only audit of DataTable row actions and tooltips.

**P-04 - TV remote, gamepad d-pad and voice are expected in the near future; never design against them.** D-pad navigation means spatial focus: from any focused element, up / down / left / right moves to the geometrically nearest focusable, so pages need a clear grid of focusables, no focus traps and one obvious primary action per screen. Voice means every action has a name (P-05). Do not build interactions that only work with a pointer position (hover menus, precise drags, tiny close buttons in corners). A client watching the pre-consultation videos on a TV must be able to play, pause, mark watched and move to the next lesson with four arrows and OK.
- _Today_: tab order only.
- _Queued_: `useSpatialNav` focus manager (T-104), voice controller (T-103), both in Pass 4.

## 3. Control and voice abilities

**P-05 - Every change updates the control and voice abilities.** Each `PageSpec` lists its actions in an `actions` manifest: `{ id, label, intent, permission?, params? }` where `id` is `<module>.<verb>` (e.g. `cases.addDeadline`, `discovery.requestDocument`, `binder.upload`), `intent` is the phrase a person would say ("add a deadline to {case}"), and `permission` is the string the page already calls through `can()`. A page's buttons, menu items and form submits are its actions; a new button without an action entry is incomplete, and removing a button removes its entry in the same commit. The manifest is data (`window.__ctl.routes[].spec.actions`), so a voice controller, an agent or a test can enumerate what a page can do and drive it. The actions registry **is** the WebMCP surface (P-10): each action becomes one tool with the same id, description = intent, input schema = params.
- _Today_: the foundation ships `actions` on `PageSpec`, the actions bus in `src/actions/` and `/#/dev/actions` (D-20) from day one (T-013, D-007).
- _Queued_: WebMCP tool generation from the registry (T-102); `specCompleteness` counts pages without actions.

**P-06 - Voice will move fast and feel real time, and it multiplayers with the person.** The voice / agent controller operates the same UI the person sees (highlighting what it does as it does it) or works on its own in the background; either way it goes through the actions registry and the `DataProvider`, never a private code path. Design implications now: actions are idempotent where possible, take ids not screen positions, return a result the controller can read, and UI state that matters (selected case, current board node, open document) is addressable (URL, hash params or a store), not trapped in a component. "Show me where the Ramirez case is on the board" must be one action with one id.
- _Today_: rule for every module worker; drafts (intake form, document edits) go through the provider (`*_drafts` tables).
- _Queued_: voice controller (T-103).

## 4. Tables, design system and the component library

**P-07 - Table management, design-system management and the component library are first-class, in the product.** Every table is in the schema registry and editable in the table manager (D-04 / D-10); every design value is a token in `src/design/tokens.ts` and visible in D-01; every component has a `.meta.ts` and shows in `/#/dev/components` (D-02) with states, props, a11y notes and usages (D-08). Pages never hand-roll a table, button, input, modal, card, tooltip or a pleading-paper line ruler. **Document templates are managed the same way**: every template is a row in `document_templates` bound to a board node and a SKU, edited in the template manager (S-10), never a loose file. New components are added to the library first, then used. The builder tool (SpecChip + InspectorPanel, Ctrl+.) stays on every page and links spec -> tables -> rules -> components -> actions.
- _Today_: the foundation's contract in `CLAUDE.md`.
- _Queued_: template manager (T-067), library growth per module.

## 5. Annotations in the product

**P-08 - Testers annotate the product itself.** From any page a tester (Justin, the firm's owner, an attorney, a paralegal, a client tester) picks an element or the whole page, writes a note, chooses a kind (`comment | request | bug`), and the record stores author, role, `page_code`, route, element path (stable selector + library component name), viewport width, theme, a screenshot (mock upload today, storage later) and status. Pins render on the page for people with permission (dev mode or `feedback.read`). **Agent triage workflow** (recorded, not ad hoc): (1) read the store (`status = new`), (2) decide _fix_ vs _ask_ by **who** wrote it (Justin / the firm's owner: binding; attorney or paralegal tester: request, and a legal-content note from an attorney is authoritative for `docs/legal`; client tester: signal), (3) record the decision on the row (`triage`, `triage_note`, `decision_ref`) **before changing anything**, (4) fix in the same turn with docs, or set `status = waiting` and add it to kanban "Awaiting Justin". Workflow file: `docs/reference/annotations-triage.md` (foundation).
- _Today_: the `feedback` table carries every annotation column from day one (T-018, D-009).
- _Queued_: element picker and pins (Pass 1 integration), triage automation (T-105).

## 6. Placeholder and undeveloped UI

**P-09 - If it is on screen and does not work, it says so.** Any UI that is a placeholder, stub or not yet wired is marked with the `Placeholder` component: a tooltip on hover and focus ("Not wired yet - <what it will do>") and a "not wired yet" toast on activation, so a click never silently does nothing. In dev mode the marker is always visible (dashed outline + badge); in production it is the tooltip and the toast. Every `PageStub` uses it, every "coming soon" `onClick` is replaced by it, and `data-placeholder` lets D-09 and QA count what is not real. A placeholder names the task that will build the real thing in `spec.notes` (e.g. "T-094 e-sign").
- _Today_: `Placeholder` atom in the foundation (T-017, D-008).
- _Queued_: every Pass 1 module uses it for Pass 2+ controls (video call button, pay button, e-sign).

## 7. Surfaces: MCP, CLI, API

**P-10 - Every surface a machine can drive is recorded every pass.** `docs/reference/surfaces.md` lists, and is updated in the same turn as any change to: the route manifest (`window.__ctl.routes`), the `DataProvider` methods, npm scripts and flags, the actions manifest (P-05), any HTTP API, and planned / live WebMCP and MCP tools and CLI commands. A new script, provider method or action without a `surfaces.md` line is incomplete.
- _Today_: created by the foundation worker this turn.
- _Queued_: WebMCP tools (T-102), a `ctl` CLI wrapping the scripts, Supabase API notes (T-099), Company-OS REST when D-016 lifts.

## 8. Context and memory

**P-11 - Any agent or developer sees the big picture and the details with ease.** The memory system is the docs tree: `docs/README.md` (map), `kanban.md` (state), `decisions.md` (why), `changelog/` (what changed), `prompts/` (what was asked, verbatim), `pages/<CODE>.md` (each screen), `build-plan.md` + `plan/tasks.json` (order of operations), `legal/` (the law we rely on, with a change log), this file (principles). All updated **in the same turn** as the work; the app renders them at `/#/docs` and `/#/dev/knowledge` and the plan at `/#/plan`. Numbered files are append-only; reversals add rows. For CTL OS memory has a second meaning: **legal memory** (`docs/legal/`) must state what changed in the law and when it was last verified, so an agent never drafts against a superseded rule (D-019).
- _Today_: the whole tree exists after this turn.
- _Queued_: keep current every turn (rule, not a card); law-change log entries whenever a rule changes.

## 9. The Hub and the standard deliverable batch

**P-12 - Every project ships the same batch, reachable from one hub.** CTL OS has: the public website and store (P-xx), the client app (C-xx), staff dashboards (front desk F-xx, attorneys L-xx, paralegals / assistants S-xx, owner O-xx, admin A-xx), the opposing-counsel portal (X-xx), the game board (GB-xx), the project-management viewer (PM-xx), the marketing engine (MK-xx), in-app docs and legal memory (K-xx), the ops manual (M-xx), dev / builder tools (D-xx) and the testing hub (HUB-01) with the **canvas** (D-21: every page laid out, zoomable, usable) and the **demo simulator** (D-22: phone and desktop frames). **Until real auth is connected, the viewer can see everything from the perspective of any role** (super admin "view as", one fictional demo user per role) **with dev mode on / off**; role guards stay real (`RequireRole`, `can()`), only the identity is mocked.
- _Today_: HUB-01, session, demo users in the foundation (T-014); canvas and simulator are Pass 1 modules (T-025, T-026).
- _Queued_: when Supabase Auth lands (T-099) the hub keeps view-as for super admins only.

## 10. Multilingual

**P-13 - English and Spanish from the start.** Every visible string goes through `useT()` with a namespaced key in the module's `strings` table (`{ en, es? }`); Spanish falls back to English, so a missing translation is never a blocker but always a gap. English is the default (D-011: the firm's clients are in California; many are Spanish speakers, so the client app and the videos' captions get the first Spanish fill). The language toggle is present on every surface. A "Spanish fill" pass translates the `es` side; hard-coded English in JSX is a defect the D-09 report flags. Legal terms keep their English term of art in parentheses the first time ("demurrer (demurrer, excepción previa)").
- _Today_: `src/i18n` in the foundation (T-016).
- _Queued_: Spanish fill passes (T-052, T-087, T-110), ops manual `es/` mirror.

## 11. Multiplayer and realtime

**P-14 - Many people at once, with insight into what each is doing.** Expected (not first pass, never designed against): presence (who is viewing / editing which case, document or board node), optimistic concurrency with conflict handling (every row has `id`, `tenant_id`, `updated_at` and `version`; a stale write is detected and surfaced, not silently overwritten), online / offline status with queued writes, realtime data through the `DataProvider.subscribe` seam. The multi-editor pleading-paper document (Pass 3) is the first true concurrent-editing surface, so its data model (document, revisions, operations) is designed for it from Pass 2. Rules today: no in-memory-only state that would break with two users, writes by id through the provider, lists re-render from `subscribe`, no page assumes it is the only writer.
- _Today_: `MockProvider` broadcasts `ChangeEvent`s; base columns include `tenant_id`, `created_at`, `updated_at`, `version` (T-015, D-006).
- _Queued_: realtime / presence / offline queue (T-101), multi-editor (T-097).

## 12. Company-OS and the 2027+ bar

**P-15 - Build on the Company-OS framework at the strength of 2027+ technology, not the old way.** CTL OS is one of many next-gen systems on our company OS; assume realtime data, agents as first-class users (the drafting assistant, the discovery gatherer, the deadline watcher), voice and multi-device as normal, and do not reach for legacy patterns (page reloads, form posts, one-user-at-a-time locks, hover-only desktop UI, hard-coded strings and prices, WordPerfect-era document files). **Nothing wires into Company-OS until Justin says so** (D-016, binding); `CompanyOsProvider` is the seam. Supabase (DB + Auth) and Stripe (payments + payroll) are the assumed later backends (D-017), also behind seams, so the switch is an adapter change, not a rewrite.
- _Today_: `DataProvider`, `PaymentProvider`, `CommsProvider` seams in the foundation and Pass 2/3.
- _Queued_: Supabase provider (T-099), Stripe (T-100), Company-OS "what CTL OS expects" section when Justin opens it.

## Checklist for a change (paste into your turn)

- [ ] Works at 360 / 390 / 768 / 1280 / 1920 (+ 2560 / 3840 for key pages); `spec.checkedAt` updated (P-01)
- [ ] Keyboard order and visible focus; 44 px targets; nothing hover-only or drag-only (P-03)
- [ ] `spec.actions` lists every button / submit with intent and permission (P-05)
- [ ] Library components only; new component has a meta (P-07)
- [ ] Every non-working control uses `Placeholder` (P-09)
- [ ] `docs/reference/surfaces.md` updated if a route, action, provider method or script changed (P-10)
- [ ] Page doc, changelog (or `_pending`), kanban + `plan/tasks.json`, decisions, prompt log, screenshots in the same turn (P-11)
- [ ] Any legal rule used cites a row in `docs/legal/statute-index.md`; a changed rule adds a `law-change-log.md` entry (P-11, D-019)
- [ ] Strings through `useT()` with `es` where known (P-13)
- [ ] No in-memory-only shared state; writes by id through the provider; `version` respected (P-14)

## Resumen en español

Quince principios obligatorios fijados por Justin (2026-09-18) para todo lo que se construye aquí: funciona en teléfono y en TV 4K (matriz 360-3840, texto legible de cerca y a tres metros); teclado, ratón, táctil y lápiz hoy, mando a distancia y voz pronto; cada página declara sus acciones (el registro de acciones es la superficie WebMCP y el vocabulario de voz); tablas, sistema de diseño, biblioteca de componentes y plantillas de documentos se gestionan dentro del producto; los probadores anotan el producto y el agente registra la decisión antes de cambiar nada; todo control sin cablear se marca con `Placeholder`; las superficies para máquinas se registran en cada pasada; la memoria es el árbol `docs/` (incluida la memoria legal con su registro de cambios de ley); un hub abre cada superficie como cualquier rol; inglés y español desde el inicio; multijugador previsto; Company-OS solo como costura hasta que Justin lo indique.
