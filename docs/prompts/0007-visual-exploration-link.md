# 0007 - add an external visual exploration to the hub

Source: Slack #cal-tenant-law, thread ts 1789937112.066769 (the pass-two thread)
Date: 2026-09-20 23:21 UTC (18:21 CDT)
Requester: Justin Massion (owner)

## Prompt (verbatim)

https://cloudbreak-rights-command.jmassion.chatgpt.site add this as an item from the hub, for "visual exploration".

## Response

Model: **Fable 5.1** (shared hub code, data file, decision, docs; shipped inside release 0.2.0).

Done, on the hub (HUB-01) as a new **Visual explorations** group right after Build & review (commit `feat(hub): HUB-01 visual exploration links (prompt 0007)`, release 0.2.0):

- **Data, not code**: the link is a row in `docs/data/visual-explorations.json` (`id: cloudbreak-rights-command`, title "Cloudbreak Rights Command", the URL, author "Justin Massion (ChatGPT site)", `added_on: 2026-09-20`, `note: "Visual exploration; external concept site, not part of the CTL OS build"`, `kind: external`). The hub imports the file at build time, so the next exploration is one appended row, no code change; retiring one is `retired_on`, never a delete.
- **The card**: title, an **External** chip, the note with author and date, and a link showing the host (`cloudbreak-rights-command.jmassion.chatgpt.site`) with an external-link icon and "Opens in a new tab". The anchor is `target="_blank" rel="noopener noreferrer"`; the site is never embedded in a frame on the hub and nothing from it is copied into the repo. English and Spanish (`hub.group.explore*`, `hub.explore.*`).
- **Action** `hub.openVisualExploration(id)` on the HUB-01 spec (so the WebMCP / voice surface can open it too); `docs/reference/surfaces.md` updated; `docs/pages/HUB-01.md` has the new section and action row.
- **Decision D-053** (binding, Justin 2026-09-20): hub links to external visual explorations open in a new tab and are labelled external; items live in `docs/data/visual-explorations.json`.
- **Plan**: task T-138 "HUB-01 Visual exploration links from the hub (prompt 0007)", done, Fable.
- Checked at 360 / 390 / 768 / 1280 / 1920 / 2560 / 3840, light and dark (`npm run qa:responsive -- --codes=HUB-01`: 14 cells, 0 failing); keyboard: the link is a 44 px target with a visible focus ring; the hub screenshot set was refreshed.

Open for Justin: whether this exploration (or later ones) should steer the styling pass, which still waits on the visual-direction pick (D-039); listed under "Awaiting Justin" in `docs/kanban.md`.

## Resumen en español

Justin pidió enlazar desde el hub un sitio de concepto externo como "exploración visual". El hub ahora tiene un grupo **Exploraciones visuales** después de Construir y revisar, leído de `docs/data/visual-explorations.json`: cada tarjeta lleva la etiqueta **Externo**, el autor y la fecha, y un enlace que se abre en una pestaña nueva (`noopener noreferrer`); nada de esos sitios forma parte de la construcción de CTL OS (decisión D-053, tarea T-138). Modelo: Fable 5.1.
