---
title: <Page name>
code: <CODE>
route: /<path>
roles: <role, role>
status: stub | built
module: <module folder>
---

# <CODE> · <Page name>

## Purpose

One paragraph: who uses this page and what they achieve.

## Screenshots

| 390 | 1280 |
| --- | --- |
| ![390](../screenshots/<CODE>/390.jpg) | ![1280](../screenshots/<CODE>/1280.jpg) |

Dark: `../screenshots/<CODE>/390-dark.jpg`, `../screenshots/<CODE>/1280-dark.jpg` (key pages). TV: `../screenshots/<CODE>/3840.jpg` (key pages).

## Sections (layout order)

1. Section name - what it shows / does
2. ...

## Data

| Table | Read / write | Notes |
| --- | --- | --- |
| `table` | read | |

## Rules

- `RULE-xxx-nn` - how the page implements or displays it

## Actions (manifest)

| Id | Intent | Permission | Params | Live |
| --- | --- | --- | --- | --- |
| `module.verb` | what a person would say | `area.verb` or none | `name: type` | yes / stub |

## Logic

- Calculations, transitions, validations in plain words.

## Components

Library components used (must exist in `/#/dev/components`).

## Placeholders

Controls wrapped in `Placeholder` and the module / pass that wires them.

## Real vs mock

What is real today, what is mocked, what changes when Supabase lands.

## Inputs and responsive check (P-01, P-03)

Checked at: 360, 390, 768, 1280, 1920, 2560, 3840. Keyboard order, focus, 44 px targets, nothing hover-only. Notes on degradation.

## Changelog

- `docs/changelog/NNNN-...md`

## Resumen en español

Dos frases sobre qué hace la página y para quién.
