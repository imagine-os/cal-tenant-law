# The Unlawful Detainer Game Board, as data

Source: `reference/game-board.pdf`, "Take the 'awful' out of Unlawful Detainer / Unlawful Detainer Game Board (any number can play)", www.caltenantlaw.com © 2021 Ken Carlson, shared with the CTL OS brief (prompt 0001). Extracted 2026-09-18 by Fable 5.1. Taglines on the poster: "Get out of victim mode. Learn what to do. Knowledge is power. Use it!" and "Beat the landlord at their own game. They asked for it." Footer: "This Game Board is designed to help you understand how the process works, where you are, and what comes next. It can be even more complex than can be shown here. Besides, there are a few more things that need to be a surprise!"

`nodes.json` is the source of truth for every game-board page (GB-01 2D board, GB-02 case mode, GB-03 cost / if-then overlay, GB-04 3D object view) and the spine of the case data model (a case has a `board_node_id`; templates, SKUs and deadline rules bind to nodes and edges). The app imports it at build time; nobody copies it into `src/`.

## Fidelity and what is reconstructed

- **Node labels are verbatim** from the PDF text layer (including the poster's own spellings such as "Prejudgement" and "witnesses's"). Nothing was added or renamed.
- **Phases** follow the section titles printed on the board (START, Motion To Quash, Demurrer, Default, Discovery, Summary Judgment, Trial, Appeal, Removal to Federal Court, Petition) plus an `outcomes` phase for terminal squares.
- **Edges are reconstructed from the poster layout** (the printed paths and arrows), typed with the board's own KEY: Normal, Positive, Negative, Neutral, Jump. Where an arrow's origin is ambiguous on the poster the edge carries `"reconstructed": true`. The firm should confirm the edges in a review pass (kanban "Awaiting Justin").
- **`kind`** uses the KEY's shapes: `document` (rectangles), `hearing` (Hearing / Decision circles), `outcome` (Outcome or Event, terminal), `event` (Outcome or Event, non-terminal), `start`.
- **`actor`** (who makes the move) is our reading of the label: `tenant` (you / we), `landlord`, `court` (judge, clerk, sheriff, process server acting for the court process), `both`.
- **`documents`, `typical_cost_band`, `deadline_rule` are null / empty on purpose.** Pass 2 fills them: `documents` from the template catalog (T-066), `typical_cost_band` from the cost model built on the store SKUs (T-074), `deadline_rule` from the deadline engine with a citation into `docs/legal/statute-index.md` (T-059). Filling them with guesses now would put unverified law and prices into the product (D-019, D-025).

## Shape

```
{
  "meta": { title, source, copyright, extracted_on, extracted_by, fidelity_note },
  "key": [ { path, label, meaning } x5 ],
  "phases": [ { id, label, order, description } ],
  "nodes": [ { id, phase, kind, label, actor, description?, documents: [], typical_cost_band: null, deadline_rule: null } ],
  "edges": [ { from, to, path, label?, reconstructed? } ]
}
```

## The phases in one paragraph each

1. **Start / service.** An eviction notice expires or the lease ends; the landlord files the Summons and Complaint; the clerk mails a Notice of Filing; a process server tries to serve you; unnamed occupants can file a Prejudgment Claim; you evaluate service as good or bad. Foreclosure tenants may remove the case to federal court from here.
2. **Motion to Quash.** Bad service: we file a Motion to Quash; the hearing can be taken off calendar and reset; granted means the landlord must re-serve (new service, new motion); denied leads to a Petition for Writ of Mandate, the Writ decision and possibly a Court Reversal Decision.
3. **Removal to Federal Court / Petition.** Foreclosure tenants only: removal considered by the federal court; denied and remanded to state court, or the federal court hears the entire case. The Petition column holds the writ and transfer petitions.
4. **Demurrer.** Evaluate the complaint; file the Demurrer; landlord opposes; we reply; hearing; sustained means the case is dismissed (or the landlord files a First Amended Complaint and the loop restarts); overruled means we answer. The landlord may try an ex parte application to shorten time, which we oppose.
5. **Default.** Four ways in: no service but the server lies; served but no response; a missed deadline; the landlord misleads the clerk. Remedies: ex parte stay to prevent lockout, Motion to Vacate (not your fault) or Motion for Relief from Default (your fault); opposition and reply; hearings; granted returns you to prior status, denied means you appeal.
6. **Discovery.** After the Answer: requests for admission, interrogatories and requests for production; good responses or no / evasive responses; meet and confer; Motion to Compel and Postpone Trial; opposition; hearing; denied or granted with more responses; compile everything for trial preparation.
7. **Summary Judgment.** The landlord files to avoid a jury trial; we prepare, file and serve the opposition; landlord replies; hearing; denied (on to trial) or granted (go to appeal).
8. **Trial.** Jury trial requested; trial set by clerk; prepare papers, witnesses, evidence, study the Trial Kit, find a trial lawyer; continuance / transfer for jury trial; pretrial conferences (MSC / TRC); TRIAL. You win (stay and sue the landlord and lawyer), the landlord dismisses, or the case settles on your terms; or you lose: judgment entered, writ issued, 5-day Notice to Vacate, sheriff lockout unless a stay is granted.
9. **Appeal.** Notice of Appeal with designation of record and statement on appeal; stay pending appeal requested from the trial court (granted: you stay and pay rent) or the appeals court; opening brief, landlord's responsive brief, reply brief, appeal hearing; win (return to wherever the judge directs) or lose (file a Writ of Mandate).
10. **Outcomes.** Terminal squares: Case dismissed, Federal court hears entire eviction case, You stay and sue the landlord & lawyer, Case dismissed by landlord, Settlement of case (you set the terms), Sheriff returns to perform lockout (you move).

## Resumen en español

El tablero de juego del desalojo (Unlawful Detainer Game Board, © 2021 Ken Carlson) transcrito a datos: fases, nodos (documentos, audiencias, resultados, eventos), aristas tipificadas con los cinco tipos de camino del propio tablero (normal, positivo, negativo, neutral, salto). Las etiquetas son literales del PDF; las aristas se reconstruyeron del diseño del póster y el bufete debe confirmarlas. Los campos de documentos, costos y plazos quedan vacíos hasta la Pasada 2, cuando se llenan desde el catálogo de plantillas, el modelo de costos y la memoria legal verificada.
