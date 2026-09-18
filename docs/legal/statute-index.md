# Statute index

> **Not verified legal advice.** Every row below has `verified_on: null`. Source for every row: the firm's site as indexed (2026-09-18, see `docs/reference/firm-site-digest.md` §6) plus general knowledge; **needs verification against the current code** before any product surface treats it as current. Flags: ⚠ currency check required (see `README.md`); ◆ not named on the firm's site (added because the procedure on the game board needs it).

Columns: citation (the key used by code) · topic (matches `topics/<topic>.md`) · one-line rule (as understood, unverified) · verified_on · verified_by · source · flag.

## Unlawful detainer procedure (CCP = Code of Civil Procedure)

| Citation | Topic | Rule (unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| CCP §1161 | unlawful-detainer-procedure | Grounds for unlawful detainer; 3-day notice to pay rent or quit must state the exact amount and period; 3-day perform-covenant-or-quit; 3-day quit for incurable breaches | null | | firm site (as indexed) / needs verification | |
| CCP §1161a | unlawful-detainer-procedure | UD after foreclosure sale (former owner and tenants) | null | | firm site (as indexed) / needs verification | |
| CCP §1161b | foreclosure-tenants | Tenants in foreclosed property: 90-day notice; bona fide lease honoured to term | null | | firm site (as indexed) / needs verification | ⚠ interplay with federal PTFA |
| CCP §1162 | unlawful-detainer-procedure | Manner of service of the notice (personal, substituted, post-and-mail) | null | | firm site (as indexed) / needs verification | ◆ |
| CCP §1166 | unlawful-detainer-procedure | UD complaint requirements; verified; attach notice; summons form | null | | needs verification | ◆ |
| CCP §1167 | unlawful-detainer-procedure | Time to respond to the UD summons: **10 court days** after service (AB 2347, effective 2025-01-01; formerly 5 days) | null | | firm site (as indexed: "10 court days") / needs verification | ⚠ AB 2347 |
| CCP §1167.3 | unlawful-detainer-procedure | Time to respond after a motion to quash / demurrer is denied (5 days, verify AB 2347 change) | null | | needs verification | ⚠ AB 2347 |
| CCP §1167.4 | unlawful-detainer-procedure | Motion to quash service in UD: hearing set 3-7 days after filing; response period after denial | null | | firm site (as indexed, motion to quash) / needs verification | ⚠ |
| CCP §418.10 | unlawful-detainer-procedure | Motion to quash service of summons; petition for writ of mandate on denial | null | | firm site (as indexed) / needs verification | |
| CCP §430.10 et seq. | unlawful-detainer-procedure | Demurrer grounds and procedure (meet and confer requirement §430.41 may not apply in UD, verify) | null | | firm site (as indexed, demurrer) / needs verification | ◆ |
| CCP §1170 | unlawful-detainer-procedure | Answer or demurrer within the response period; contents of the answer (denials, affirmative defenses) | null | | firm site (as indexed, Answer) / needs verification | |
| CCP §1170.5 | unlawful-detainer-procedure | Trial set within 20 days of the request for trial after the answer | null | | firm site (as indexed) / needs verification | |
| CCP §1170.7 | unlawful-detainer-procedure | Summary judgment in UD on 5 days' notice | null | | firm site (as indexed, MSJ) / needs verification | |
| CCP §1170.8 | unlawful-detainer-procedure | Discovery in UD: shortened response times (5 days); discovery cut-off 5 days before trial | null | | firm site (as indexed: "cut-off five days prior to trial") / needs verification | ◆ |
| CCP §2024.020 | unlawful-detainer-procedure | General discovery cut-off (modified for UD by §1170.8) | null | | needs verification | ◆ |
| CCP §2030 / §2031 / §2033 | unlawful-detainer-procedure | Interrogatories, requests for production, requests for admission (the board's Discovery phase) | null | | firm site (as indexed) / needs verification | ◆ |
| CCP §2030.290 / §2031.300 | unlawful-detainer-procedure | Motion to compel when no response is served | null | | firm site (as indexed, motion to compel) / needs verification | ◆ |
| CCP §473(b) | unlawful-detainer-procedure | Relief from default for mistake, inadvertence, surprise or excusable neglect (the board's "Default was your fault") | null | | needs verification | ◆ |
| CCP §473.5 | unlawful-detainer-procedure | Motion to vacate default when service did not give actual notice (the board's "NOT your fault") | null | | needs verification | ◆ |
| CCP §473(d) | unlawful-detainer-procedure | Set aside a void judgment / clerical error (the board's "correct the Court Clerk's Mistakes") | null | | firm site (as indexed, SKU 200) / needs verification | ◆ |
| CCP §1174 | unlawful-detainer-procedure | Judgment for possession; writ of possession; sheriff's 5-day notice to vacate | null | | firm site (as indexed) / needs verification | |
| CCP §715.010 / §715.020 | unlawful-detainer-procedure | Writ of possession procedure; sheriff's notice to vacate (5 days) | null | | firm site (as indexed) / needs verification | |
| CCP §1176 | unlawful-detainer-procedure | Stay of execution pending appeal in UD; conditions (rent payment) | null | | firm site (as indexed) / needs verification | |
| CCP §1179 | unlawful-detainer-procedure | Relief from forfeiture after judgment (hardship) | null | | needs verification | ◆ |
| CCP §1174.2 | habitability-repairs | Habitability defense in nonpayment UD; court may reduce rent | null | | needs verification | ◆ |
| CCP §1013 / §12 / §12a | unlawful-detainer-procedure | Computation of time; extensions for service by mail; holidays and court days | null | | needs verification | ◆ (deadline engine) |
| CCP §1013 (court holidays, Gov. Code §6700) | unlawful-detainer-procedure | Judicial holidays for court-day counting | null | | needs verification | ◆ (deadline engine) |
| CCP §904.2 / Cal. Rules of Court 8.822 | unlawful-detainer-procedure | Appeal from a limited civil judgment: notice of appeal deadline (30 days after notice of entry, verify) | null | | firm site (as indexed, appeal) / needs verification | ◆ |
| 28 U.S.C. §1441 / §1446 / §1447 | unlawful-detainer-procedure | Removal to federal court and remand (the board's "Foreclosure Tenants only" path; federal-question basis via PTFA) | null | | game board (reference/game-board.pdf) / needs verification | ◆ |
| CCP §415.46 | unlawful-detainer-procedure | Prejudgment claim of right to possession for unnamed occupants (the board's "Unnamed Tenants file Prejudgement Claim") | null | | game board / needs verification | ◆ |
| CCP §1179.02 et seq. (CTRA / AB 3088) | unlawful-detainer-procedure | COVID-19 Tenant Relief Act: archival protections | null | | firm site (as indexed, COVID page) | superseded / archival |

## Notices and tenancy termination (CC = Civil Code)

| Citation | Topic | Rule (unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| CC §1946 | unlawful-detainer-procedure | 30-day notice to terminate a periodic tenancy (general) | null | | firm site (as indexed) / needs verification | |
| CC §1946.1 | unlawful-detainer-procedure | 60-day notice after one year of residency; 30 days if the owner has sold and buyer will occupy (conditions) | null | | firm site (as indexed) / needs verification | |
| CC §1946.2 | rent-control-ab1482 | Just cause for eviction after 12 months (AB 1482); at-fault vs no-fault; relocation assistance (one month) for no-fault; SB 567 owner move-in and substantial remodel tightening | null | | firm site (as indexed) / needs verification | ⚠ AB 1482 / SB 567 |
| CC §1947.12 | rent-control-ab1482 | Statewide rent cap: 5 % + CPI or 10 %, whichever is lower; exemptions; sunset 2030-01-01 (verify) | null | | firm site (as indexed) / needs verification | ⚠ sunset |
| CC §827 | rent-control-ab1482 | Rent increase notice: 30 days (<= 10 %), 90 days (> 10 %) | null | | firm site (as indexed) / needs verification | |
| CC §1954.50 et seq. (Costa-Hawkins) | rent-control-ab1482 | Vacancy decontrol; exemptions for post-1995 construction and single-family / condos from local rent control | null | | firm site (as indexed) / needs verification | ⚠ check 2026 changes |
| Gov. Code §7060 et seq. (Ellis Act) | rent-control-ab1482 | Withdrawal of units from the rental market; local implementation | null | | needs verification | ◆ |
| Los Angeles RSO (LAMC ch. XV) | rent-control-ab1482 | Local rent stabilisation and just cause in the City of Los Angeles; relocation schedules | null | | firm site (as indexed: "LA Rent Control Made Simple") / needs verification | ⚠ local layer |

## Security deposits, fees, entry, retaliation, self-help

| Citation | Topic | Rule (unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| CC §1950.5 | security-deposits | All deposits refundable; itemised statement and refund within 21 days of move-out; allowed deductions; pre-move-out inspection | null | | firm site (as indexed) / needs verification | |
| CC §1950.5(c) | security-deposits | Deposit cap: one month's rent (AB 12, effective 2024-07-01; small-landlord exception up to two months) | null | | needs verification | ⚠ AB 12 |
| CC §1950.5(l) | security-deposits | Bad-faith retention: statutory damages up to **twice** the deposit plus actual damages (firm kit says "3x") | null | | firm site (as indexed) / needs verification | ⚠ multiple |
| CC §1671 | late-fees | Liquidated damages: late fees must be a reasonable estimate; site: > 10 % presumed unreasonable; illegal fee credited against rent | null | | firm site (as indexed) / needs verification | ⚠ "10 %" is the firm's reading |
| CC §1954 | entry-notice | Landlord entry: reasonable written notice (24 hours presumed reasonable), enumerated purposes, business hours; no general inspections | null | | firm site (as indexed) / needs verification | |
| CC §1927 | entry-notice | Covenant of quiet enjoyment | null | | firm site (as indexed) / needs verification | |
| CC §1940.2 | retaliation | Landlord harassment / influencing a tenant to vacate: penalties | null | | needs verification | ◆ |
| CC §1942.5 | retaliation | Retaliatory eviction and rent increases prohibited after protected acts; statutory damages | null | | firm site (as indexed, Temporary Leave) / needs verification | |
| CC §789.3 | retaliation | Self-help eviction (lockout, utilities, removal of property): $100 per day minimum plus damages | null | | firm site (as indexed) / needs verification | |
| CC §1942.4 | habitability-repairs | Landlord may not demand rent while cited conditions remain unrepaired; damages | null | | needs verification | ◆ |

## Habitability, repairs, mold

| Citation | Topic | Rule (unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| CC §1941 / §1941.1 | habitability-repairs | Landlord's duty to maintain; list of untenantable conditions | null | | firm site (as indexed) / needs verification | |
| CC §1942 | habitability-repairs | Repair and deduct: up to **one month's** rent, not more than twice in any 12 months, after reasonable notice (firm site says "up to two months") | null | | firm site (as indexed) / needs verification | ⚠ wording |
| Green v. Superior Court (1974) 10 Cal.3d 616 | habitability-repairs | Implied warranty of habitability; rent withholding as a defense | null | | firm site (as indexed) / needs verification | |
| Health & Safety Code §17920.3 | habitability-repairs | Substandard building conditions (mold added 2016, SB 655) | null | | needs verification | ◆ |
| CC §1941.7 | habitability-repairs | Mold disclosure / landlord duties (verify scope) | null | | firm site (as indexed, Toxic Mold) / needs verification | ◆ |
| CC §1951.2 | habitability-repairs | Breaking a lease: landlord's duty to mitigate; tenant liable for rent minus what could be recovered | null | | firm site (as indexed, Breaking Your Lease) / needs verification | |

## Foreclosure, mobilehome, commercial

| Citation | Topic | Rule (unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| Protecting Tenants at Foreclosure Act (12 U.S.C. §5220 note; permanent 2018) | foreclosure-tenants | 90-day notice to bona fide tenants after foreclosure; lease honoured to term unless buyer occupies | null | | firm site (as indexed) / needs verification | |
| CC §2924.8 | foreclosure-tenants | Notice to tenants of foreclosure sale | null | | needs verification | ◆ |
| CC §798 et seq. (Mobilehome Residency Law) | mobilehome | Park management rules, rent and fee changes, sale of the home in place, termination grounds | null | | firm site (as indexed, Mobilehome Disputes) / needs verification | ◆ (section numbers) |
| CC §1995.010 et seq. | commercial | Commercial leases: assignment / sublet; commercial rent control banned statewide since 1987 (verify cite) | null | | firm site (as indexed) / needs verification | ◆ |
| CC §1938 / §1938.1 | commercial | Commercial property accessibility disclosure (CASp) | null | | needs verification | ◆ |
| SB 1103 (2024) | commercial | Protections for qualified commercial tenants (small businesses / nonprofits): notice of rent increases, fee disclosures, termination notice | null | | needs verification | ⚠ new 2025 |

## Resumen en español

Índice de leyes: cada fila es una regla que el sistema cita (procedimiento de desalojo CCP §1161 y siguientes, avisos, depósitos CC §1950.5, cargos por mora CC §1671, entrada CC §1954, represalias CC §1942.5, habitabilidad CC §1941-1942, ejecución hipotecaria, casas móviles, comercial). Todas tienen `verified_on` vacío: no son asesoría legal verificada. Las filas con ⚠ requieren revisión de actualidad 2026; las filas con ◆ no aparecen en el sitio del bufete y se añadieron porque el tablero las necesita.
