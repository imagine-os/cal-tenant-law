# Responsive QA report

generated: 2026-09-20T23:55:05.672Z
routes: 80
widths: 360, 390, 768, 1280, 1920, 2560, 3840
themes: light, dark
cells: 1120
failing_cells: 0
a11y_findings: 326

_Written by `npm run qa:responsive` (scripts/qa-responsive.mjs). Fail = horizontal scroll (documentElement.scrollWidth > viewport), a console error, visible text under 12 px (under 16 px at >= 1920, P-01), a fixed element covering a sticky one, or a blank page. Client routes run as the client demo user, public routes as the visitor, staff routes as the super admin with dev mode off. A11y findings come from src/dev/a11yScan.ts._

## Matrix (light / dark)

| Code | Route | 360 | 390 | 768 | 1280 | 1920 | 2560 | 3840 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `P-01` | `/site` | warn 12 / warn 12 | warn 12 / warn 12 | warn 12 / warn 12 | warn 12 / warn 12 | warn 12 / warn 12 | warn 12 / warn 12 | warn 12 / warn 12 |
| `C-01` | `/app` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `F-01` | `/desk` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-01` | `/counsel` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `S-01` | `/assist` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `O-01` | `/owner` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `A-01` | `/admin` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `X-01` | `/opposition` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-01` | `/board` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-01` | `/plan` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `M-01` | `/manual` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-01` | `/docs` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `MK-01` | `/marketing` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `A-05` | `/admin/feedback` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-20` | `/app/binder` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-20a` | `/app/binder/map` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-22` | `/app/binder/add` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-21` | `/app/requests` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-31a` | `/counsel/binder` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-31` | `/counsel/binder/:caseId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-02` | `/board/case/:caseId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-02` | `/board/case` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-03` | `/board/overlay` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-10` | `/site/services` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-13` | `/site/services/outline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-11` | `/site/services/:sku` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-12` | `/site/how-it-works` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `A-10` | `/admin/catalog` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-04` | `/app/pay` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-03` | `/dev` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-01` | `/dev/tokens` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-02` | `/dev/components` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-03` | `/dev/specs` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-04` | `/dev/tables` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-04` | `/dev/tables/:table` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-05` | `/dev/rules` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-23` | `/dev/illustrations` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-19` | `/dev/routes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-20` | `/dev/actions` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-24` | `/dev/roles` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-02` | `/docs/search` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-03` | `/docs/plan-log` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `S-21` | `/assist/drafting` | ok / ok | ok / ok | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 |
| `S-22` | `/assist/drafting/:draftId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `S-10` | `/assist/templates` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `F-12` | `/desk/calls` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `F-15` | `/desk/follow-ups` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `F-13` | `/desk/clients` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `HUB-01` | `/` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `HUB-02` | `/no-access` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-40` | `/app/learn` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-40` | `/app/learn/next` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-41` | `/app/learn/journey` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-42` | `/app/learn/lesson/:lessonId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-40` | `/counsel/learning` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `A-11` | `/admin/learning` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-10` | `/legal` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-11` | `/legal/statutes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-12` | `/legal/changes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-13` | `/legal/topics/:slug` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `M-03` | `/manual/decisions` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `M-02` | `/manual/:lang/:slug` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-13` | `/counsel/pipeline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `L-14` | `/counsel/orders/:orderId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `S-13` | `/assist/queue` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `F-14` | `/desk/orders` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-11` | `/app/orders` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-11a` | `/app/orders/:orderId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-02` | `/plan/list` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-03` | `/plan/timeline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-04` | `/plan/graph` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-05` | `/plan/passes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-05` | `/plan/task/:id` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-21` | `/dev/canvas` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-22` | `/dev/simulator` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-05` | `/site/attorneys` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-06` | `/site/videos` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-02` | `/site/proposal` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-03` | `/site/proposal/replaces` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-04` | `/site/proposal/roadmap` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |

## Routes that rendered another page

- `GB-02` /board/case -> /board/case/case_01

## A11y findings by rule

| Rule | Findings |
| --- | --- |
| control-name | 178 |
| target-size | 92 |
| heading-skip | 56 |

## A11y findings (unique per route)

| Code | Rule | Sev | Finding | Element | Cells |
| --- | --- | --- | --- | --- | --- |
| `P-01` | control-name | error | button without an accessible name | `div.st-video > div.st-video-top > a > button.btn.btn-secondary` | 168 |
| `P-01` | target-size | warn | target 2x2 px is under 24 px | `div.container > div.card.card-p-lg > div.st-boardcard > a.st-boardcard-poster` | 2 |
| `D-02` | heading-skip | warn | heading jumps from h2 to h4 | `section.live > header.live-head > div.grow > h4.live-title` | 14 |
| `D-02` | target-size | warn | target 56x16 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 8 |
| `D-02` | target-size | warn | target 323x21 px is under 24 px | `div.ordercard.is-late > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `D-02` | target-size | warn | target 347x21 px is under 24 px | `div.ordercard > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `D-02` | target-size | warn | target 64x17 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 2 |
| `D-02` | target-size | warn | target 343x22 px is under 24 px | `div.ordercard.is-late > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `D-02` | target-size | warn | target 368x22 px is under 24 px | `div.ordercard > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `D-02` | target-size | warn | target 73x22 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 2 |
| `S-21` | control-name | error | button without an accessible name | `thead.is-sticky > tr > th > button.datatable-sort` | 10 |
| `M-02` | heading-skip | warn | heading jumps from h2 to h4 | `section.live > header.live-head > div.grow > h4.live-title` | 14 |
| `M-02` | target-size | warn | target 94x21 px is under 24 px | `article.manual-body > figure.manual-shot > figcaption.xs.muted > a.xs` | 8 |
| `L-13` | target-size | warn | target 97x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 8 |
| `L-13` | target-size | warn | target 142x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 8 |
| `L-13` | target-size | warn | target 236x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `L-13` | target-size | warn | target 351x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 323x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 355x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 321x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 366x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 347x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 6 |
| `L-13` | target-size | warn | target 391x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 381x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 457x21 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `L-13` | target-size | warn | target 129x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 341x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 368x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `L-13` | target-size | warn | target 151x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 250x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `L-13` | target-size | warn | target 486x22 px is under 24 px | `div.ordercard.is-compact > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `S-13` | heading-skip | warn | heading jumps from h1 to h3 | `#main > div.stack > div.empty > h3.empty-title` | 14 |
| `F-14` | heading-skip | warn | heading jumps from h1 to h3 | `#main > div.stack > div.empty > h3.empty-title` | 14 |
