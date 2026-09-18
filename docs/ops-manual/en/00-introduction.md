---
title: Introduction: how California Tenant Law runs on CTL OS
role: all staff
part: I
version: 0.1.0
updated: 2026-09-18
summary: What CTL OS is, how this manual is organised in nine parts, how a lesson works (in person, then in the software), and how to practise safely as a demo user.
---

# Introduction: how California Tenant Law runs on CTL OS

California Tenant Law has represented tenants, and only tenants, since 1980, by phone and video across California, selling legal work by the piece so the client controls the cost, and teaching first with free videos and the Unlawful Detainer Game Board. CTL OS is the one piece of software that now runs all of it: the public site and store, the client's app, the front desk, the attorneys' and paralegals' workspaces, the owner's dashboards, the opposing-counsel portal, communications, documents and pleading paper, the learning system, and this manual.

You are reading the manual inside that software. Wherever a chapter shows a price, a deadline, a statute or an office, the blue **live** block is reading today's real value from the system, not a number somebody typed months ago. If a live block says "not verified", the rule behind it has not yet been checked by an attorney (see Part IX, chapter 91, and `docs/legal/README.md`).

## How the manual is organised

{{routes:manual}}

| Part | For | What you learn |
| --- | --- | --- |
| I Front desk | front desk, everyone | the day at the desk, phones and the hotline, payments |
| II Intake and consultations | front desk, attorneys | the intake form, scheduling, the consultation and its recording and summary, returning clients |
| III Case work by board stage | attorneys, paralegals | one chapter per phase of the game board, from service to appeal |
| IV Discovery | attorneys, paralegals | gathering documents, evidence from email and text, our and their discovery, motions to compel, the binder |
| V Documents and pleadings | paralegals, attorneys | templates by stage, assembly, pleading paper in CTL OS, co-editing, e-signatures |
| VI Client learning | everyone | the video curriculum, what a client has watched, dripping content |
| VII Owner and finance | owner | late-work radar, assignments, revenue, the attorney network, pricing and cost roadmaps |
| VIII Marketing | marketing, owner | leads, the content calendar, city pages, reviews |
| IX Using CTL OS | everyone | the hub, roles and dev mode, annotations, languages, the appliance |

## How a lesson works

Every chapter has two sections. **In person** is what a colleague shows you at the desk or on a call. **In CTL OS** is the same task in the software, with screenshots you can click to open the live page. When you have done both, press the two buttons in the chapter header; the system records your completion so the owner can see who has learned what.

> IN PERSON: Sit with the person who does this task today and watch one real instance before you read the software steps.

> IN CTL OS: Open the hub, choose your role, turn dev mode off, and follow the chapter with the live page open beside it.

## Practising safely

Until real accounts exist, the hub lets you enter as any **demo user**: a fictional front-desk person, attorney, paralegal, owner, marketing lead, client or opposing counsel. Nothing you do as a demo user touches a real case. Demo data reseeds itself; if you make a mess, the seed inspector in dev tools resets it.

{{demo-users}}

## The game board is the workflow

Every case in CTL OS sits on a node of the Unlawful Detainer Game Board. "Where are we?" is answered by the board, "what comes next?" by its edges, "what do we file?" by the documents bound to the node, "what does it cost?" by the cost bands, and "when is it due?" by the deadline engine, which cites the statute for every date. Part III walks the board phase by phase.

{{board:phase:start}}

> DECISION NEEDED: Who at the firm verifies legal rules (sets `verified_on`) so the deadline engine can treat them as current? Until then every deadline shows "not verified".

## Resumen en español

Introducción al manual: qué es CTL OS, cómo se organiza en nueve partes, cómo funciona una lección (en persona y luego en el software), cómo practicar con usuarios demo y por qué el tablero de juego del desalojo es el flujo de trabajo de cada caso. La versión en español de este capítulo es `es/00-introduccion.md`.
