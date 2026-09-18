---
title: The case, phase by phase on the game board
role: attorney, paralegal
part: III
version: 0.1.0
updated: 2026-09-18
summary: What the team actually does at each phase of the Unlawful Detainer Game Board, who moves, and which screen the work happens on.
---

# The case, phase by phase on the game board

The Unlawful Detainer Game Board is not a poster we hand out; it is the workflow. Every case sits on one node of it. "Where are we?" is answered by the node, "what comes next?" by the paths leaving it, "what do we file?" by the documents bound to it, "what will it cost?" by the cost bands on the paths, and "when is it due?" by the deadline engine — which cites a statute row for every date it produces.

> IN PERSON: Print the board once, put a case on it with a coin, and walk the coin through a case that finished last year with the attorney who ran it.

## The ten phases

The phases below are the board's own sections, in the board's own order. The labels are verbatim from the poster; the board data lives in `../../game-board/nodes.json` and the transcription in `../../game-board/README.md`.

| # | Phase | Who moves first | What the team does |
| --- | --- | --- | --- |
| 1 | START / service | landlord, then the process server | Read the notice and the complaint; evaluate service as good or bad; unnamed occupants file a prejudgment claim; foreclosure tenants consider removal |
| 2 | Motion To Quash | us | Bad service: file the motion, work the hearing, re-serve loop if granted, writ petition if denied |
| 3 | Removal to Federal Court / Petition | us | Foreclosure tenants only: removal, remand, or the federal court hears the case; the petition column holds the writ and transfer petitions |
| 4 | Demurrer | us | Attack the complaint itself; oppose an ex parte to shorten time; answer if overruled; dismissal or an amended complaint if sustained |
| 5 | Default | the court clerk | Four ways in (no service, no response, missed deadline, misled clerk); ex parte stay first, then vacate or relief from default |
| 6 | Discovery | us | Requests for admission, interrogatories, requests for production; meet and confer; motion to compel and postpone trial; compile for trial |
| 7 | Summary Judgment | landlord | Prepare, file and serve the opposition; hearing; on to trial if denied, to appeal if granted |
| 8 | TRIAL | the court | Request a jury; prepare papers, witnesses and evidence; pretrial conferences; trial; win, dismissal, settlement — or judgment, writ and lockout |
| 9 | APPEAL | us | Notice of appeal and record; stay pending appeal; briefs; hearing; writ of mandate if lost |
| 10 | Outcomes | — | The terminal squares: dismissed, settled on our terms, staying and suing the landlord, or moving |

## Who does what at every phase

The pattern repeats, and it is the same four steps whatever the phase:

1. **The attorney decides the move.** Which path off the node, and why. The decision is recorded on the case, not in someone's head.
2. **The paralegal prepares the document** from the template bound to that node, with the case data filled in and the deadline calculated by the engine.
3. **The attorney reviews and signs.** Nothing leaves the firm unreviewed; the drafting assistant never files anything by itself.
4. **The desk tells the client** what happened, in plain language, in their language, and what the next payment is for.

## In CTL OS

The attorneys' screens, read from the running app:

{{routes:counsel}}

[screenshot: GB-01 — The game board with a case placed on it]

Every rule we rely on carries its authority and whether it has been verified. Nothing below is verified legal advice until an attorney sets the verification date:

{{rules:ud_procedure}}

> IN CTL OS: Open the game board, place the demo case, and step it one node forward. Read the deadline it produces and click through to the statute row behind it.

> DECISION NEEDED: The board's edges were reconstructed from the poster layout; the firm should confirm the ambiguous ones before the deadline engine treats a path as a rule.

## Resumen en español

El tablero del desalojo es el flujo de trabajo: cada caso está en un nodo, y el nodo responde dónde estamos, qué sigue, qué se presenta, cuánto cuesta y cuándo vence. Esta página recorre las diez fases del tablero con lo que hace el equipo en cada una y repite el patrón de cuatro pasos: el abogado decide el movimiento, el asistente prepara el documento desde la plantilla del nodo, el abogado revisa y firma, y recepción informa al cliente en su idioma.
