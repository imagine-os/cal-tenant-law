---
title: A day at the front desk
role: front desk, all staff
part: I
version: 0.1.0
updated: 2026-09-18
summary: The whole shift in order: opening the day, taking an intake from a frightened caller, booking the consultation, taking payment, and handing the case to an attorney.
---

# A day at the front desk

The front desk is where a tenant meets California Tenant Law. Almost everyone who calls is frightened and behind on information: a notice is taped to the door, a summons was handed to a neighbour, or a sheriff's notice says five days. Your job in the first two minutes is to make the person feel that this is a process with rules, that we know the rules, and that they are in the right place. Everything else on this page is procedure.

> IN PERSON: Sit beside whoever runs the desk today and take three calls with them before you take one alone. Listen for how they slow the caller down.

## In person

**Open the day.** Check what is waiting: new intake forms that arrived overnight, consultations booked for today, payments that did not complete, messages nobody has answered. Read the deadline strip before you read your email — a response deadline that runs out today outranks everything else on the desk.

**Take the call.** Get, in this order: the person's name and best callback number, the city the rental is in (it decides which office and which local ordinances matter), what piece of paper they are holding, and the date it was served or posted. Dates are the whole case. If the caller does not know the date, ask for the paper's own dates and write down which one it is.

**Never give legal advice.** You are not the attorney and you do not answer "do I have to move out". You say what we do, what a consultation costs, and how soon one is available. If the caller pushes, the honest answer is the useful one: "an attorney has to look at your papers before anyone tells you what your options are".

**Book the consultation.** Consultations are with a licensed attorney, by phone or video, prepaid and time-boxed. Tell the caller to watch the free videos first — it is not a brush-off, it is the reason our consultations are short and useful. Send the intake form link and confirm the slot in the same call.

**Take the money once.** One payment, one receipt, one record on the case. If a payment fails, do not re-run the card blindly; check whether the first attempt landed.

**Hand it over.** A consultation that is booked but not prepared is a wasted half hour. Before the attorney opens it, the case needs the papers uploaded, the dates typed in, and the city set.

## In CTL OS

These are the screens the desk lives in. The list is read from the running app, so it is never out of date:

{{routes:frontdesk}}

The city on the intake decides the office; the offices, their coverage and their timezone come from the system, not from a list on a wall:

{{offices}}

[screenshot: F-01 — Front desk today: intake queue, consultations and payments]

Prices are not written into this manual. A price lives in the catalog, and the desk reads it off the order screen:

{{pricing:consultations}}

> IN CTL OS: Enter as the front-desk demo user with dev mode off and walk one imaginary caller from intake to paid consultation. Nothing you do as a demo user touches a real case.

## What you never type

Deadlines, prices, statute numbers and office addresses are never typed into a chapter, a note or an email. Every one of them has one home in the system and the screen shows the current value with its verification state. A deadline the app cannot cite is a deadline nobody at this firm quotes out loud.

> DECISION NEEDED: Which payment surface the desk uses before Stripe is wired — the current store checkout link, or a manual receipt row in CTL OS?

> DECISION NEEDED: Who covers the desk for offices without their own front desk (network-wide coverage rules per office)?

## Resumen en español

El turno completo en recepción: abrir el día con la cola de admisión y los plazos, atender la llamada (nombre, teléfono, ciudad, qué papel tiene y de qué fecha), no dar asesoría legal, reservar la consulta con abogado, cobrar una sola vez y entregar el caso preparado al abogado. Las pantallas, las oficinas y los precios se leen del sistema; nunca se escriben a mano.
