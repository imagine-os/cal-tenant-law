# Law-change log (append-only)

Every change to a rule the product relies on gets a row **before** the statute row or the code changes (see `README.md`, rule 3). Newest first. Rows written on 2026-09-18 record changes we know happened but have **not verified** from the enacted text; they exist so nobody drafts against the pre-change rule.

Columns: id · logged · instrument (bill, decision, ordinance) · effective · what changed · affected citations · affected surfaces (page codes / engines) · verified_on · verified_by · note.

| Id | Logged | Instrument | Effective | What changed | Affected citations | Affected surfaces | verified_on | verified_by | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LC-007 | 2026-09-18 | SB 1103 (2024) | 2025-01-01 | New protections for "qualified commercial tenants" (notice periods for rent increases and termination, fee disclosures, translation of leases) | CC §1946.1, CC §827, CC §1632 (commercial rows) | topics/commercial, deadline engine (commercial variants) | null | | Not verified; the firm's commercial article predates it. |
| LC-006 | 2026-09-18 | AB 2347 (2024) | 2025-01-01 | Time to respond to an unlawful detainer summons extended from 5 days to **10 court days**; related timing after denial of a motion to quash / demurrer adjusted | CCP §1167, CCP §1167.3, CCP §1167.4 | Deadline engine (T-059), GB-01 edges from "Evaluate Service", L-20, C-10 plain-language deadlines, videos that say "5 days" (curriculum flag) | null | | The firm's board copy already says 10 court days; older videos may not. |
| LC-005 | 2026-09-18 | AB 12 (2023) | 2024-07-01 | Security deposit capped at one month's rent (two months for qualifying small landlords) | CC §1950.5(c) | topics/security-deposits, deposit recovery kit content (SKU 045), C-40 curriculum flag | null | | |
| LC-004 | 2026-09-18 | SB 567 (2023) | 2024-04-01 | Tenant Protection Act tightened: owner / relative move-in must occur within 90 days and last 12 months; substantial remodel defined; enforcement remedies added | CC §1946.2 | topics/rent-control-ab1482, no-fault eviction content, cost model (relocation) | null | | |
| LC-003 | 2026-09-18 | AB 1482 (2019) | 2020-01-01 (sunset 2030-01-01, verify any extension) | Statewide rent cap (5 % + CPI, max 10 %) and just-cause eviction after 12 months | CC §1946.2, CC §1947.12 | topics/rent-control-ab1482, K-10 banner until verified | null | | Check 2025-2026 sessions for amendments or extension before 2030. |
| LC-002 | 2026-09-18 | Protecting Tenants at Foreclosure Act (made permanent by the Economic Growth, Regulatory Relief, and Consumer Protection Act, 2018) | 2018-06-23 | The 2009 federal 90-day protection for tenants in foreclosed homes was made permanent after lapsing in 2014 | PTFA, CCP §1161b | topics/foreclosure-tenants, video "Part 5: Foreclosure Eviction" (currency flag) | null | | |
| LC-001 | 2026-09-18 | COVID-19 Tenant Relief Act (AB 3088, SB 91, AB 832) and local moratoria | 2020-2023 (expired) | Temporary protections for COVID-period rental debt and evictions; expired; some local ordinances kept longer tails | CCP §1179.02 et seq. | Archival: the COVID article and video must display as superseded, never as current | null | | Mark the firm's COVID content archival in the curriculum. |

## How to add a row

1. Next id `LC-nnn`, `logged` = today, instrument and effective date from the enacted text (cite the leginfo URL in the note).
2. Name **every** affected citation in `statute-index.md` and every product surface (page codes, engine functions, curriculum items).
3. Update the statute rows (`rule`, flag) in the same turn; set `verified_on` only if you actually read the current text.
4. Then change the code; the deadline / cost tests (`scripts/test-deadlines.mjs`, `scripts/test-costs.mjs`) read the citations and fail if a cited row is missing.
5. Changelog entry and kanban line as for any change (P-11).

## Resumen en español

Registro de cambios de ley, solo se añade, más reciente primero. Cada cambio de una regla que el producto usa exige una fila aquí antes de tocar el índice de leyes o el código. Las filas de 2026-09-18 registran cambios conocidos pero no verificados (AB 2347 plazo de 10 días hábiles judiciales, AB 12 tope de depósito, SB 567 y AB 1482 causa justa y tope de renta, PTFA permanente, SB 1103 comercial, reglas COVID expiradas) para que nadie redacte contra la regla anterior.
