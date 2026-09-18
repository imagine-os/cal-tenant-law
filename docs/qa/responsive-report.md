# Responsive QA report

generated: 2026-09-18T21:48:13.413Z
routes: 55
widths: 360, 390, 768, 1280, 1920, 2560, 3840
themes: light, dark
cells: 770
failing_cells: 0
a11y_findings: 1072

_Written by `npm run qa:responsive` (scripts/qa-responsive.mjs). Fail = horizontal scroll (documentElement.scrollWidth > viewport), a console error, visible text under 12 px (under 16 px at >= 1920, P-01), a fixed element covering a sticky one, or a blank page. Client routes run as the client demo user, public routes as the visitor, staff routes as the super admin with dev mode off. A11y findings come from src/dev/a11yScan.ts._

## Matrix (light / dark)

| Code | Route | 360 | 390 | 768 | 1280 | 1920 | 2560 | 3840 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `P-01` | `/site` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
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
| `GB-02` | `/board/case/:caseId` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-02` | `/board/case` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `GB-03` | `/board/overlay` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-10` | `/site/services` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-13` | `/site/services/outline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-11` | `/site/services/:sku` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-12` | `/site/how-it-works` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `A-10` | `/admin/catalog` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-02` | `/app/binder` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `C-03` | `/app/learn` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
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
| `K-02` | `/docs/search` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-03` | `/docs/plan-log` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `HUB-01` | `/` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `HUB-02` | `/no-access` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-10` | `/legal` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-11` | `/legal/statutes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-12` | `/legal/changes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `K-13` | `/legal/topics/:slug` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `M-03` | `/manual/decisions` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `M-02` | `/manual/:lang/:slug` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-02` | `/plan/list` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-03` | `/plan/timeline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-04` | `/plan/graph` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-05` | `/plan/passes` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `PM-05` | `/plan/task/:id` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-21` | `/dev/canvas` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `D-22` | `/dev/simulator` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-02` | `/site/proposal` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-03` | `/site/proposal/replaces` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `P-04` | `/site/proposal/roadmap` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |

## Routes that rendered another page

- `GB-02` /board/case -> /board/case/case_01

## A11y findings by rule

| Rule | Findings |
| --- | --- |
| target-size | 1030 |
| heading-skip | 42 |

## A11y findings (unique per route)

| Code | Rule | Sev | Finding | Element | Cells |
| --- | --- | --- | --- | --- | --- |
| `P-01` | target-size | warn | target 2x2 px is under 24 px | `div.container > div.card.card-p-lg > div.st-boardcard > a.st-boardcard-poster` | 2 |
| `C-02` | heading-skip | warn | heading jumps from h1 to h3 | `div.homes-phone > section > div.homes-stage-head > h3` | 14 |
| `D-02` | heading-skip | warn | heading jumps from h2 to h4 | `section.live > header.live-head > div.grow > h4.live-title` | 14 |
| `M-02` | heading-skip | warn | heading jumps from h2 to h4 | `section.live > header.live-head > div.grow > h4.live-title` | 14 |
| `M-02` | target-size | warn | target 94x21 px is under 24 px | `article.manual-body > figure.manual-shot > figcaption.xs.muted > a.xs` | 8 |
| `D-21` | target-size | warn | target 21x9 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-outline` | 204 |
| `D-21` | target-size | warn | target 22x9 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-ghost` | 204 |
| `D-21` | target-size | warn | target 23x10 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-outline` | 102 |
| `D-21` | target-size | warn | target 24x10 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-ghost` | 102 |
| `D-21` | target-size | warn | target 26x12 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-outline` | 102 |
| `D-21` | target-size | warn | target 28x12 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-ghost` | 102 |
| `D-21` | target-size | warn | target 31x16 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-outline` | 102 |
| `D-21` | target-size | warn | target 34x16 px is under 24 px | `div.cv-frame > div.cv-frame-head > span.cv-frame-btns > button.btn.btn-ghost` | 102 |
