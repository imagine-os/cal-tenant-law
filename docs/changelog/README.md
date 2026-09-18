# Changelog (format)

One file per change set, `NNNN-slug.md`, numbered append-only (never renumber; the counter is shared with nothing else, and `prompt:` points at the prompt file's number). Header lines first, exactly these, one per line:

```
version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: What was asked and why, in one or two sentences.
decision: What was decided and how it was built (D-nnn references).
rejected: The alternative(s) not taken and why.
files: comma-separated paths touched (globs fine)
codes: page codes touched (HUB-01, C-10, ...) or n/a
```

Then a markdown body: what was created or changed (by page code), findings worth carrying forward, verification (build, QA, screenshots), follow-ups (kanban / tasks.json ids). Before / after screenshots link to `docs/screenshots/<CODE>/`.

Module workers do not write numbered entries: they drop a draft in `_pending/<module>.md` with the same header lines, and the integrator merges drafts into the next numbered entry (see `_pending/README.md`). Release entries (`NNNN-release-x.y.z.md`) carry counts (routes, components, tables, rules, page docs, screenshots), deploy status and the open questions for Justin.

The docs viewer renders this folder at `/#/docs` (K-01) newest first; a changelog whose `prompt:` file is missing is flagged.

## Resumen en español

Una entrada por conjunto de cambios, numerada y solo se añade, con líneas de cabecera obligatorias (`version, date, prompt, intent, decision, rejected, files, codes`) y un cuerpo con lo que cambió por código de página, verificación y pendientes. Los módulos dejan borradores en `_pending/`; el integrador los fusiona en la siguiente entrada numerada.
