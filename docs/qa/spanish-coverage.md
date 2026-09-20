# Spanish string coverage — pass 2 wave A audit

version: 0.2.0-dev
date: 2026-09-20
prompt: 0006

Audit of every module `strings.ts` plus `src/i18n/coreStrings.ts` for entries that are a plain string or `{ en }` without `es`. Method: parse each file for top-level `'key':` markers and check the text between consecutive markers for an `es:` field (script discarded after the audit; not committed).

## Per-module counts (keys total / keys with `es`)

| Module | Before | After |
| --- | --- | --- |
| hub | 129 / 129 | 129 / 129 |
| showcase | 142 / 142 | 142 / 142 |
| pipeline | 269 / 269 | 269 / 269 |
| frontdesk | 212 / 212 | 212 / 212 |
| drafting | 156 / 156 | 156 / 156 |
| learning | 149 / 149 | 149 / 149 |
| binder | 158 / 158 | 158 / 158 |
| site | 188 / 188 | 188 / 188 |
| dev | 26 / 26 | 26 / 26 |
| board | 101 / 101 | 101 / 101 |
| plan | 114 / 114 | 114 / 114 |
| legal | 54 / 54 | 54 / 54 |
| docs | 65 / 65 | 65 / 65 |
| manual | 88 / 88 | 88 / 88 |
| admin | 41 / 41 | 41 / 41 |
| owner | 33 / 33 | 33 / 33 |
| counsel | 25 / 25 | 25 / 25 |
| assist | 21 / 21 | 21 / 21 |
| opposition | 25 / 25 | 25 / 25 |
| catalog | 175 / 175 | 175 / 175 |
| client | 46 / 46 | 46 / 46 |
| `src/i18n/coreStrings.ts` | 93 / 93 | 93 / 93 |
| **Total** | **2,310 / 2,310** | **2,310 / 2,310** |

## Spanish summary

Every UI string key across the 21 modules named for pass 2 wave A, and every shell/session/theme/lang/placeholder/feedback/stub/common/site key in `coreStrings.ts`, already carries a Latin American Spanish value alongside its English one — no plain-string-only entries and no `{ en }` objects missing `es` were found. Zero keys needed filling in this pass; no `strings.ts` file was edited. `docs/game-board/nodes.json` was not inspected for translation (square labels stay English by design, out of scope here).

Spot-checked for tone against `src/modules/catalog/strings.ts` and `src/modules/client/strings.ts`: usted register for client-facing copy, legal terms of art carry the English in parentheses on first use (e.g. "Demurrer (excepción previa / demurrer)"), `{variables}` are preserved untouched, and product names (CTL OS, "Tablero de juego") are kept consistent. No gaps to correct against that standard were found.
