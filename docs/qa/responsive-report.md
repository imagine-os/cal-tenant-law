# Responsive QA report

generated: 2026-09-20T23:38:41.293Z
routes: 4
widths: 360, 390, 768, 1280, 1920, 2560, 3840
themes: light, dark
cells: 56
failing_cells: 6
a11y_findings: 106

_Written by `npm run qa:responsive` (scripts/qa-responsive.mjs). Fail = horizontal scroll (documentElement.scrollWidth > viewport), a console error, visible text under 12 px (under 16 px at >= 1920, P-01), a fixed element covering a sticky one, or a blank page. Client routes run as the client demo user, public routes as the visitor, staff routes as the super admin with dev mode off. A11y findings come from src/dev/a11yScan.ts._

## Matrix (light / dark)

| Code | Route | 360 | 390 | 768 | 1280 | 1920 | 2560 | 3840 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `D-02` | `/dev/components` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |
| `S-21` | `/assist/drafting` | ok / ok | ok / ok | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 | warn 1 / warn 1 |
| `S-22` | `/assist/drafting/:draftId` | ok / ok | ok / ok | ok / ok | ok / ok | FAIL overlap / FAIL overlap | FAIL overlap / FAIL overlap | FAIL overlap / FAIL overlap |
| `L-13` | `/counsel/pipeline` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |

## Failing cells

- `S-22` /assist/drafting/:draftId @ 1920-light:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (660px²)
- `S-22` /assist/drafting/:draftId @ 1920-dark:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (660px²)
- `S-22` /assist/drafting/:draftId @ 2560-light:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (5792px²)
- `S-22` /assist/drafting/:draftId @ 2560-dark:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (5792px²)
- `S-22` /assist/drafting/:draftId @ 3840-light:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (6680px²)
- `S-22` /assist/drafting/:draftId @ 3840-dark:  overlaps: #root > div.shell > button.feedbackbtn over #main > div.page.stack > div.drf-studio.mode-document > aside.drf-pane.drf-pane-right (6680px²)

## A11y findings by rule

| Rule | Findings |
| --- | --- |
| target-size | 82 |
| heading-skip | 14 |
| control-name | 10 |

## A11y findings (unique per route)

| Code | Rule | Sev | Finding | Element | Cells |
| --- | --- | --- | --- | --- | --- |
| `D-02` | heading-skip | warn | heading jumps from h2 to h4 | `section.live > header.live-head > div.grow > h4.live-title` | 14 |
| `D-02` | target-size | warn | target 56x16 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 8 |
| `D-02` | target-size | warn | target 323x21 px is under 24 px | `div.ordercard.is-late > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `D-02` | target-size | warn | target 347x21 px is under 24 px | `div.ordercard > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 4 |
| `D-02` | target-size | warn | target 64x17 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 2 |
| `D-02` | target-size | warn | target 343x22 px is under 24 px | `div.ordercard.is-late > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `D-02` | target-size | warn | target 368x22 px is under 24 px | `div.ordercard > div.ordercard-top > div.ordercard-head > button.ordercard-title` | 2 |
| `D-02` | target-size | warn | target 73x22 px is under 24 px | `div.fl-nodes > div.fl-node.fl-node-ghost > span.fl-node-add > button.btn.btn-secondary` | 2 |
| `S-21` | control-name | error | button without an accessible name | `thead.is-sticky > tr > th > button.datatable-sort` | 10 |
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
