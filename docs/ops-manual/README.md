# Operations manual (CTL OS)

How California Tenant Law runs, per role, in person and in the software. Rendered in the app at `/#/manual` (M-01 cover with reading paths per role, one route per chapter, `/#/manual/pending` for decisions, captures and drafts; task T-048). Source of truth: `docs/ops-manual/en/NN-slug.md` (English source, D-031); `docs/ops-manual/es/NN-slug.md` mirrors the **same file names** in Spanish (Spanish fill is a pass, never a blocker; a missing `es` chapter falls back to `en` with a banner).

## Parts

| Part | Title | Roles | Chapters (planned; numbering is append-only) |
| --- | --- | --- | --- |
| I | Front desk | front desk, all staff | 10 welcome and how to use this manual · 11 the day at the desk · 12 phones, hotline minutes and messages · 13 payments and receipts |
| II | Intake and consultations | front desk, attorney | 20 the initial consultation form · 21 scheduling phone and video consultations · 22 the consultation itself (recording, summary) · 23 follow-up consultations and returning clients |
| III | Case work by board stage | attorney, paralegal | 30 the game board as our workflow · 31 start and service · 32 motion to quash · 33 demurrer and answer · 34 default and relief · 35 summary judgment · 36 trial · 37 appeal and stays · 38 removal for foreclosure tenants · 39 suing the landlord |
| IV | Discovery | attorney, paralegal, client-facing staff | 40 gathering documents from the client · 41 email and text messages as evidence · 42 our discovery · 43 their discovery · 44 meet and confer and motions to compel · 45 the binder before trial |
| V | Documents and pleadings | paralegal, attorney | 50 templates by stage · 51 assembling a document · 52 pleading paper in CTL OS (replacing WordPerfect) · 53 co-editing, review and filing · 54 e-signatures |
| VI | Client learning | all staff | 60 the video curriculum · 61 what a client has watched before a consultation · 62 dripping content along the case |
| VII | Owner and finance | owner | 70 the late-work radar · 71 assignments and workload · 72 revenue by stage and SKU · 73 the attorney network and payouts · 74 pricing and the cost roadmap |
| VIII | Marketing | marketing, owner | 80 leads and the funnel · 81 content calendar · 82 city pages · 83 reviews |
| IX | Using CTL OS | all staff | 90 the hub, roles and dev mode · 91 annotations: how to report a bug or ask for a change · 92 languages · 93 the appliance |

Chapter `00-introduction.md` (this pass) is the cover text. Chapters 10+ are written in Pass 5 (T-109 en, T-110 es) with drafts from module workers in `en/_pending/<module>.md` from Pass 2.

## Writing a chapter

Adding a chapter needs no code: drop `NN-slug.md` in `en/` (and `es/`) and it gets a route, a spec from the front matter and a card on the cover.

Front matter (all required):

```
---
title: The day at the desk
role: front desk
part: I
version: 0.1.0
updated: 2026-09-18
summary: One line for the card and the search.
---
```

- `role` is a comma list of audiences: `all staff`, `front desk`, `attorney`, `paralegal`, `owner`, `marketing`. The cover's reading path filters on it.
- `part` is the roman numeral above.
- Optional: `code` (M-xx page code, assigned at integration), `rules` (R-xxx ids the chapter teaches), `board_nodes` (ids from `docs/game-board/nodes.json` the chapter covers).

Every chapter has a `## In person` and a `## In CTL OS` section; the reader records completion with the buttons in the header (`training_completions` table).

## Inside a chapter

| You write | You get |
| --- | --- |
| `[screenshot: F-10 — The intake queue]` (own line) | framed figure with `docs/screenshots/F-10/1280.jpg` (390 for `C-` codes) and a chip to the live page; dashed placeholder until the capture exists |
| `{{pricing:consultations}}` `{{pricing:sku}}` `{{pricing:hotline}}` | price tables read from the catalog tables (never typed) |
| `{{offices}}` `{{roles}}` `{{permissions:paralegal}}` `{{routes:frontdesk}}` `{{demo-users}}` `{{stats}}` | offices, roles, permissions, screens of a surface, demo people, row counts |
| `{{board:phase:discovery}}` `{{board:node:demurrer}}` | the board's nodes and documents for a phase or node |
| `{{deadline:CCP §1167}}` `{{statute:CC §1950.5}}` | the rule with its verification state from `docs/legal` |
| `{{templates:demurrer}}` | document templates bound to a board node |
| `{{table:cases}}` `{{tables}}` | first rows of any table; the whole schema grouped |
| `> NOTE:` `> TIP:` `> WARNING:` `> DECISION NEEDED:` `> IN PERSON:` `> IN CTL OS:` | callouts; `DECISION NEEDED` also lists on `/#/manual/pending` |

A `{{...}}` directive sits alone on its line. **No price, deadline, statute text, office address, status name or rule is ever typed into a chapter**: the block reads the system, so the manual is never older than the data. Unknown directives explain themselves instead of breaking the page.

## Resumen en español

Manual de operaciones del bufete por rol, en persona y en el software, en nueve partes (recepción; admisión y consultas; trabajo de casos por etapa del tablero; discovery; documentos y alegatos; aprendizaje del cliente; dueño y finanzas; marketing; uso de CTL OS). Fuente en inglés (`en/`), espejo en español (`es/`) con los mismos nombres de archivo. Cada capítulo lleva portada obligatoria (`title, role, part, version, updated, summary`) y usa directivas `{{...}}` que leen el sistema: ningún precio, plazo ni artículo de ley se escribe a mano.
