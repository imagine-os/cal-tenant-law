# Pending changelog drafts

Module workers drop one file here per module (`<module>.md`, same header lines as a numbered entry: `version, date, prompt, intent, decision, rejected, files, codes`) in the same turn as their code. The integrator (Fable, at each pass's integration task) merges them into the next numbered `docs/changelog/NNNN-*.md`, resolves collisions (routes, components, tables, rules) and deletes the drafts. Never renumber existing entries; never edit another worker's draft. The foundation worker's draft for this turn is `foundation.md`.
