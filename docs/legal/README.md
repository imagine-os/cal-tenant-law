# Legal memory (docs/legal)

> **NOT VERIFIED LEGAL ADVICE.** Every row in this folder was written on 2026-09-18 from the firm's own indexed web copy and general knowledge of California landlord-tenant law, by a model, without access to the current codes. **No row is current until a licensed attorney sets `verified_on`.** The deadline engine, the cost model, the drafting assistant and every page that states a rule must show the row's verification state and must not present an unverified rule as current (D-019). Anything you read here can be out of date; California amends these statutes every session.

## What lives here

| File | What |
| --- | --- |
| `statute-index.md` | One row per statute or rule we rely on: citation, topic, one-line rule, `verified_on`, `source`, currency flag. The deadline engine (T-059) and the cost model (T-074) cite rows by citation. |
| `law-change-log.md` | Append-only log of changes to the law that affect a row (bill, effective date, what changed, which rows and which product surfaces are affected, who verified). **A law-change entry must be added whenever a rule changes**, before the rule changes in code. |
| `topics/<topic>.md` | One short file per practice area from the firm brief: what the firm covers, the statutes it relies on, the 2026 currency flags, and what CTL OS does with it (which pages, which rules). |

Rendered in the app at K-10 (legal memory viewer, T-049): index with verification state, change log newest first, topic pages, and a banner that cannot be dismissed while any row is unverified.

## Rules of the folder

1. **Citation is the key.** Code uses the exact `citation` string of a row (`CCP §1167`, `CC §1950.5(g)`) so a rename is a log entry, never a silent edit.
2. **`verified_on: null` means unverified.** Only a person with the `attorney` role (or Justin on the firm's behalf) sets it, with their initials in `verified_by`, after reading the current code section (leginfo.legislature.ca.gov) and the firm's own content.
3. **Change = log entry first.** When a statute changes (new bill, court decision, local ordinance), add a row to `law-change-log.md` naming the affected citations and product surfaces, then update the statute row (`rule`, `effective`, `superseded_by`), then change the code, in that order and in the same turn.
4. **Old rules stay visible.** A superseded rule keeps its row with `status: superseded` so an agent can tell an old process from the current one ("double-check that we're using the latest laws and not accidentally thinking that something is an older process", prompt 0001).
5. **Local law is a separate layer.** Rent-stabilisation ordinances (Los Angeles RSO, San Francisco, Oakland, ...) and local just-cause rules are tracked as their own rows with `jurisdiction`; statewide rows never assume a local rule.
6. **The firm's content is a source, not an authority.** Videos and articles state rules as of their recording date; the currency flags below exist precisely because several of them predate 2024-2026 amendments.
7. **Nothing here is advice to a client.** Client-facing pages translate rules into plain language only after verification and always with the "verified on <date>" line.

## Currency flags to clear first (from the firm brief, section 6)

| Flag | Why | Rows |
| --- | --- | --- |
| **AB 2347 (2024): unlawful detainer response period 5 days -> 10 court days** (effective 2025-01-01) | The board and site copy say "10 court days"; older videos may say 5 days; the deadline engine must use the current rule and cite it | `CCP §1167`, `CCP §1167.3` |
| **AB 12 (2023): security deposit cap of one month's rent** (effective 2024-07-01; small-landlord exception) | Deposit kit and articles predate it | `CC §1950.5(c)` |
| **Repair-and-deduct wording**: site says "up to two months' rent"; statute is up to one month's rent, no more than twice in 12 months | Client-facing habitability content | `CC §1942` |
| **Deposit bad-faith penalty multiple**: kit says "goal is 3x the deposit"; statute is up to 2x the deposit **plus** actual damages | Deposit recovery kit copy, cost model | `CC §1950.5(l)` |
| **AB 1482 (Tenant Protection Act) sunset and amendments** (originally 2030-01-01; SB 567 (2023) tightened no-fault rules 2024-04-01; check any 2025-2026 extension) | Just-cause and rent-cap rules on every no-fault page | `CC §1946.2`, `CC §1947.12` |
| Relocation assistance amounts (state one month vs local schedules "$5,000-$20,000") | Cost model must separate state minimum from local schedules | `CC §1946.2(d)`, local rows |
| COVID-era rules (CTRA / AB 3088, local moratoria) | Archival; must show as superseded, never as current | `CCP §1179.02` et seq. |

## Resumen en español

Memoria legal del sistema: índice de leyes (una fila por artículo, con `verified_on` vacío hasta que un abogado la verifique), registro de cambios de ley (solo se añade; toda modificación de una regla exige una entrada antes de cambiar el código) y un archivo por tema. Nada aquí es asesoría legal verificada; las banderas de actualidad 2026 (AB 2347 plazo de respuesta de 10 días hábiles judiciales, AB 12 tope de depósito, redacción de "reparar y deducir", múltiplo de la penalidad por depósito, vigencia de AB 1482) deben resolverse antes de que el motor de plazos trate una regla como vigente.
