# Responsive QA report

generated: 2026-09-18T22:05:10.366Z
routes: 1
widths: 360, 390, 768, 1280, 1920, 2560, 3840
themes: light, dark
cells: 14
failing_cells: 0
a11y_findings: 0

_Written by `npm run qa:responsive` (scripts/qa-responsive.mjs). Fail = horizontal scroll (documentElement.scrollWidth > viewport), a console error, visible text under 12 px (under 16 px at >= 1920, P-01), a fixed element covering a sticky one, or a blank page. Client routes run as the client demo user, public routes as the visitor, staff routes as the super admin with dev mode off. A11y findings come from src/dev/a11yScan.ts._

## Matrix (light / dark)

| Code | Route | 360 | 390 | 768 | 1280 | 1920 | 2560 | 3840 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `HUB-01` | `/` | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok | ok / ok |

## A11y findings by rule

| Rule | Findings |
| --- | --- |
| — | 0 |
