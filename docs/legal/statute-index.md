# Statute index

> **Not verified legal advice.** Every row below has `verified_on: null`. Source for every row: the firm's site (as indexed on 2026-09-18, then scraped live the same day; see `docs/reference/firm-site-digest.md` §7 and the last section below) plus general knowledge; **needs verification against the current code** before any product surface treats it as current. Flags: ⚠ currency check required (see `README.md`); ◆ not named on the firm's site (added because the procedure on the game board needs it).

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

## Cited on the firm's live site (scraped 2026-09-18; rows not already above)

Source for every row: the page named, scraped live on 2026-09-18 (`docs/data/articles.json` lists citations per page). The "rule" column is **as the site states it**, not checked against the current code. `verified_on: null` throughout. Rows above that the site also cites (CC §1942, §1946.1, §1950.5, §1954, §1671, §1942.4, §1942.5, §1951.2, §1927, §2924.8, §798 et seq., CCP §1161b, §1162, H&S §17920.3, AB 1482 / CC §1946.2 / §1947.12, PTFA) keep their rows; their `Source` should now read "firm site (live 2026-09-18)".

| Citation | Topic | Rule (as the site states it, unverified) | verified_on | verified_by | Source | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| CC §1511 | unlawful-detainer-procedure | "Excuses rent" when the landlord's breach (uninhabitable conditions) prevents performance; used as a nonpayment defense | null | | /unlawful-detainer/nonpayment-of-rent, /unlawful-detainer/winning | |
| CC §1940.8 | habitability-repairs | Landlord may not require tenants to pay for utilities serving areas outside the unit without disclosure (as cited under "Shared Utilities") | null | | /free-advice-articles/general-tenant-rights | ◆ verify scope |
| CC §1940.9 / §1940.9(b)(2) | habitability-repairs | Shared utility meters: landlord must disclose and agree how costs are split; remedies | null | | /free-advice-articles/general-tenant-rights | |
| CC §1941.4 | habitability-repairs | Landlord must provide a working telephone jack / wiring (as cited) | null | | /free-advice-articles/general-tenant-rights | ◆ |
| CC §1945 | unlawful-detainer-procedure | Holdover after a lease ends with rent accepted renews the tenancy on the same terms (month-to-month) | null | | /free-advice-articles/general-tenant-rights | |
| CC §1950.6 | security-deposits | Application screening fee cap and receipt / itemisation | null | | /free-advice-articles/security-deposits | ⚠ cap is indexed yearly; verify 2026 figure |
| CC §1950.8 | commercial | Commercial: "key money" / payments for entering a lease must be stated in the lease; penalties | null | | /free-advice-articles/commercial-tenancies | |
| CC §1953 | entry-notice | Lease clauses waiving the tenant's statutory rights (entry notice, habitability, etc.) are void | null | | /free-advice-articles/landlord-intrusions, /free-advice-articles/temporary-leave | |
| CC §1954.201 | entry-notice | Water submetering notice / entry (as cited in the intrusions article) | null | | /free-advice-articles/landlord-intrusions | ◆ verify cite |
| CC §1962 | unlawful-detainer-procedure | Landlord must disclose the owner / manager names and an address for service; a 3-day notice is defective if the required disclosures were not given (the "hide-and-seek landlord") | null | | /free-advice-articles/general-tenant-rights | |
| CC §3302 | late-fees | Damages for breach of an obligation to pay money = the amount due plus interest; the site: a late fee cannot exceed that | null | | /free-advice-articles/late-fees, /free-advice-articles/general-tenant-rights | |
| CC §1671(b) / §1671(d) | late-fees | Liquidated damages: valid unless unreasonable (b); void in residential leases unless actual damages are impracticable to fix (d) (the site's "Late Fees Are Illegal") | null | | /free-advice-articles/late-fees | ⚠ same flag as CC §1671 row |
| CC §2924 (series) | foreclosure-tenants | Non-judicial foreclosure process: Notice of Default (90 days to cure), Notice of Trustee's Sale, sale | null | | /unlawful-detainer/foreclosure-eviction | |
| CC §798.17, §798.23, §798.25, §798.28, §798.29, §798.37, §798.39, §798.41, §798.43, §798.50, §798.55, §798.56, §798.73, §798.74, §798.75, §798.76, §798.84 | mobilehome | Mobilehome Residency Law sections the article walks through (rent-control exemption for long leases, management rules, fees, utilities, termination grounds and 60-day notice, sale in place, abandonment, attorney fees) | null | | /free-advice-articles/mobilehome-disputes | ⚠ 26k-word article; date of writing unknown |
| CC §799.1, §799.2, §799.6, §799.8, §799.10, §799.20, §799.22, §799.29, §799.45, §799.79 | mobilehome | Recreational Vehicle Park Occupancy Law sections cited | null | | /free-advice-articles/mobilehome-disputes | ◆ |
| CCP §1159 | unlawful-detainer-procedure | Forcible entry (cited for mobilehome / self-help removals) | null | | /free-advice-articles/mobilehome-disputes, /self-help-research/find-the-statutes | |
| CCP §1161.1 | commercial | Commercial UD: notice may estimate the rent due (within 20 %) | null | | /free-advice-articles/commercial-tenancies | |
| CCP §116.220 | security-deposits | Small claims jurisdiction: the site says "up to $12,500" for an individual (deposit and other claims) | null | | /free-advice-articles/security-deposits, /self-help-research/just-the-forms | ⚠ the eviction-process page says "$10,000 maximum"; verify current limit |
| CCP §170.6 | unlawful-detainer-procedure | Peremptory challenge to one judge ("papering"); site: petition for writ within 10 days if an excluded judge rules anyway (SKU 901) | null | | store item 901, /unlawful-detainer/game-board | |
| Cal. Const. art. VI §21 | unlawful-detainer-procedure | Right to a judge rather than a commissioner / judge pro tem absent stipulation (SKU 901) | null | | store item 901 | |
| CCP §425.16 (anti-SLAPP, as "SLAPP motion") | unlawful-detainer-procedure | Landlord's lawyer files an anti-SLAPP motion against a malicious-prosecution suit; opposition needed (SKU 390) | null | | store item 390 | ◆ statute number not on the site |
| CCP §1161.2 (record masking, "the law changed in 2017") | unlawful-detainer-procedure | UD records stay masked unless the landlord wins within 60 days; motion to seal still needed after a judgment (SKU 505) | null | | store item 505 | ⚠ verify current text |
| Arrieta claim / CCP §1174.3 | unlawful-detainer-procedure | Post-judgment Claim of Right to Possession by unnamed occupants: file with the Sheriff then the clerk within 2 days; hearing; stops the lockout meanwhile | null | | /unlawful-detainer/game-board | ◆ section number not on the site |
| CCP §1174.25 / prejudgment claim timing | unlawful-detainer-procedure | Site: 10 days from service of the PJCRP to file it, then response due 5 days later | null | | /unlawful-detainer/game-board, store item 010 | ⚠ check AB 2347 interplay |
| CCP §2033.280 (deemed admitted) | unlawful-detainer-procedure | Requests for admission unanswered can be deemed admitted; cost of proof sanctions (SKU 251) | null | | store item 251 | ◆ |
| Form Interrogatories 17.1 | unlawful-detainer-procedure | Follow-up interrogatory to every RFA denial (facts, witnesses, documents) | null | | store items 250, 251 | |
| CACI jury instructions | unlawful-detainer-procedure | Standard instructions; unique instructions drafted per case (SKUs 460, 461, 465) | null | | store items 460-465 | |
| Cal. Rules of Court / Writ of Supersedeas | unlawful-detainer-procedure | Stay pending appeal: trial court first, then petition for writ of supersedeas in the appellate court; rent must be paid during the stay (SKU 610) | null | | store item 610, /unlawful-detainer/game-board | ◆ |
| 28 U.S.C. §1441 (removal, as "Notice of Removal") | unlawful-detainer-procedure | Removal on a federal question (PTFA, CARES Act, CDC order); UD stops until remand; 30 days after remand for the demurrer (SKU 155) | null | | store item 155 | ⚠ CARES / CDC text is stale |
| B&P §17918 | unlawful-detainer-procedure | A landlord doing business under an unregistered fictitious business name cannot sue (demurrer ground) | null | | /free-advice-articles/general-tenant-rights, store item 370 | |
| B&P §10130 / §10131 | unlawful-detainer-procedure | Off-site property managers must hold a real estate broker licence (the "unlicensed manager" Kraken point) | null | | /unlawful-detainer/eviction-process, /free-advice-articles/general-tenant-rights | |
| IWC Wage Order 5-2001 | unlawful-detainer-procedure | Resident managers: free apartment plus minimum wage for hours worked (Kraken point) | null | | /unlawful-detainer/eviction-process | ◆ |
| Penal Code §834-849.5 (esp. §837) | entry-notice | Citizen's arrest for trespass / disturbing the peace when the landlord enters illegally | null | | /free-advice-articles/landlord-intrusions | |
| Penal Code §602 (trespass, as cited by name) | entry-notice | Unauthorised landlord entry is trespass; police may be called | null | | /free-advice-articles/landlord-intrusions | ◆ |
| H&S §1597.40 | unlawful-detainer-procedure | Family day care homes: a landlord may not prohibit a licensed family day care in a rental | null | | /free-advice-articles/general-tenant-rights | |
| H&S §17973 | entry-notice | Inspection warrant / code enforcement entry rules (as cited) | null | | /free-advice-articles/landlord-intrusions | ◆ verify cite |
| H&S §26100-§26157 (Toxic Mold Protection Act of 2001) | habitability-repairs | Mold standards, disclosure to tenants (§26147, §26148) and remediation; the article reproduces the chapter | null | | /free-advice-articles/toxic-mold, /free-advice-articles/commercial-tenancies | ⚠ implementation status; CC §1941.7 row |
| H&S §18007-§18215 (Mobilehome-Manufactured Housing Act) | mobilehome | Definitions of mobilehome / manufactured home / RV and registration used by the MRL article | null | | /free-advice-articles/mobilehome-disputes | ◆ |
| Vehicle Code §22658 | mobilehome | Towing of vehicles from private property (cited in the mobilehome article) | null | | /free-advice-articles/mobilehome-disputes | ◆ |
| Gov. Code §65995 | mobilehome | School fees on mobilehome installations (cited) | null | | /free-advice-articles/mobilehome-disputes | ◆ |
| CC §3491 (nuisance) | mobilehome | Remedies against a nuisance (cited) | null | | /free-advice-articles/mobilehome-disputes | ◆ |
| CC §1102.6 / §2079 | habitability-repairs | Seller / agent disclosure duties cited in the mold article | null | | /free-advice-articles/toxic-mold | ◆ |
| Los Angeles RSO (full text PDF `/pdfs/larso.pdf`) | rent-control-ab1482 | Site hosts the LA RSO text and a San Diego "Tenants' Right to Know" PDF | null | | /self-help-research/get-useful-forms | (local layer, rule 5) |
| Judicial Council forms UD-105, UD-150, SC-100, MC-030, FW-001 | unlawful-detainer-procedure | Answer, stipulation for judgment, small claims, declaration, fee waiver; site: "You generally have 5 days to file" UD-105 | null | | /self-help-research/just-the-forms, /pre-consultation-videos | ⚠ AB 2347: 10 court days |

## Resumen en español

Índice de leyes: cada fila es una regla que el sistema cita (procedimiento de desalojo CCP §1161 y siguientes, avisos, depósitos CC §1950.5, cargos por mora CC §1671, entrada CC §1954, represalias CC §1942.5, habitabilidad CC §1941-1942, ejecución hipotecaria, casas móviles, comercial). Todas tienen `verified_on` vacío: no son asesoría legal verificada. Las filas con ⚠ requieren revisión de actualidad 2026; las filas con ◆ no aparecen en el sitio del bufete y se añadieron porque el tablero las necesita.
