---
title: Using CTL OS: roles, dev mode, annotations and languages
role: all staff
part: IX
version: 0.1.0
updated: 2026-09-18
summary: How to get into the system as yourself or as any role, what dev mode shows, how to report a bug or ask for a change from inside the product, and how the language toggle works.
---

# Using CTL OS: roles, dev mode, annotations and languages

CTL OS is one application with many surfaces. What you see is decided by your role, never by which link you clicked. This chapter is how to move around it, and how to tell us when something is wrong — from inside the product, on the screen where it went wrong.

> IN PERSON: Have someone open the hub on their screen and enter as three different roles while you watch the menu change.

## Who you are

Every role has a home, a menu filtered to what it may do, and a set of permissions. A page never asks "is this person an attorney"; it asks whether they may do the thing. That is why the same case screen can be safe for the front desk and complete for the attorney.

{{roles}}

Until real accounts exist, the hub lets a super admin **view as** any role with a fictional demo user. Guards stay real — only the identity is pretend. If a page says it is not available to your role, that is the guard working, not a bug.

## Dev mode

Dev mode (super admin only) turns the product into its own builder tool. With it on, every page shows a spec chip in the corner, `Ctrl + .` opens the inspector (spec, tables, rules, components, actions), and every control that is not wired yet shows a dashed outline and a badge. With it off you see exactly what the firm sees. Screenshots for the manual are taken with it on, so a capture may show markers you do not have.

## Annotations: how to report a bug or ask for a change

Use the feedback button on any staff page. Pick the element you mean, write what you noticed, and choose a kind:

- **comment** — an observation, no action expected
- **request** — please change this
- **bug** — this is broken

The record keeps who you are, your role, the page code, the route, the element, the viewport width, the theme and a capture, so nobody has to ask "where were you and how wide was your window". An agent then triages it and **records the decision on your row before changing anything** — so you can see whether it was accepted, and why. A legal-content note from an attorney is authoritative for the legal memory; a note from a client tester is signal, not instruction.

[screenshot: HUB-01 — The hub: choose a role, dev mode, language]

## Languages

English and Spanish are present from the start; the toggle sits on every surface and remembers your choice. A string with no Spanish yet falls back to English rather than breaking — a gap, never a blocker. The client app and the video captions get the first Spanish fill, because that is where the firm's Spanish-speaking clients meet us. Legal terms of art keep their English term in parentheses the first time they appear.

## Where the front desk works

As an example of one surface, these are the front-desk screens, read from the running app:

{{routes:frontdesk}}

> IN CTL OS: Turn dev mode on, open any page, press `Ctrl + .`, and read that page's actions. Those sentences are also what a voice controller will accept.

> DECISION NEEDED: Whether staff should be able to leave annotations while viewing as another role, or only as themselves.

## Resumen en español

Cómo usar CTL OS: el rol decide lo que ves (no el enlace), el centro permite entrar como cualquier rol con usuarios demo mientras no haya cuentas reales, el modo desarrollador convierte el producto en su propia herramienta de construcción (ficha de especificación, inspector con Ctrl+., marcadores de lo no conectado), las anotaciones se hacen sobre el producto mismo con elemento, página, ancho y tema, y el agente registra la decisión antes de cambiar nada. El interruptor de idioma está en todas las superficies y el español que falte cae a inglés.
