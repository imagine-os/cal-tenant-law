# CTL OS project brief

Source: Justin Massion, Slack #cal-tenant-law, 2026-09-18 (prompt `docs/prompts/0001-ctl-os-brief.md`, verbatim) plus the firm research in `docs/reference/firm-site-digest.md`. This file organises everything said; decisions are logged with ids in `docs/decisions.md` (D-001..). Facts about the firm are **as indexed** (the site was unreachable from the build environment, D-025): `[v]` = seen verbatim in indexed text, `[u]` = inferred, confirm before relying on it. The last section lists what needs Justin or the firm.

## 1. The client

**California Tenant Law** (caltenantlaw.com, "CalTenantLaw") `[v]`: tenant-side-only landlord-tenant practice, "Renters' Rights Lawyers Since 1980", website since 1999, "serving all 58 counties by phone and video", "eight offices statewide" (seven found `[u]` for the eighth). Founder and principal attorney Kenneth H. Carlson, J.D. (CA Bar #93602, admitted 1980), based in Idyllwild (Riverside County); the other offices (Downtown LA, San Fernando Valley, Long Beach / Orange County, San Diego, Sacramento / Roseville, SF Bay Area) are independent practitioners operating under the CalTenantLaw banner `[v]`, so the system is a **network of attorneys**, not one office (hence `tenant_id` on every row, D-006).

**Positioning** `[v]`: unbundled, à-la-carte services "like a legal vending machine, so you control the costs"; "we do everything but go to court, though we can arrange a lawyer for court appearances"; consultations only with a licensed attorney, by phone or Microsoft Teams; educate-first ("watch the free legal videos before your consultation"); plain-English, wry, combative on behalf of tenants; the law is framed as a **game** with rules, powers and technical mistakes the tenant can exploit ("the time in eviction cases is spent addressing the mistakes made by the landlord, his lawyer, the court clerks and the judges").

**Signature asset**: the **Unlawful Detainer Game Board** (© 2021 Ken Carlson; poster and free PDF; store item 002; video "Part 7: The Game Board" and a 2025 refresh). See section 5 and `docs/game-board/`.

## 2. How the firm sells today (and what replaces it)

| Today `[v]` unless noted | Pain | CTL OS module (pass) |
| --- | --- | --- |
| WordPress site (+ `cms.` subdomain) and a still-live legacy `.htm` site: three URL schemes for the same content | Split SEO, duplicate content, no client state | Public site P-01.. (1), marketing engine MK (2), city landing generator MK-03 (2) |
| Free pre-consultation videos on YouTube with WordPress attachment pages; no progress, order or gating | The "curriculum" cannot be tracked | Learning C-40 / C-41 / L-40 (2) |
| Initial Consultation Form -> emailed copy -> Ecwid product 101 ($165 / 30 min) -> "online scheduling system" (vendor `[u]`) -> Teams or phone | Five tools, no single client record | Intake F-10, scheduling F-11, client app C-01, video C-60 (2-3) |
| Ecwid store, ~40 SKUs by eviction stage ($20-$1,500), 800-series top-up SKUs standing in for time tracking; card + PayPal | Prices scattered, minimums and top-ups instead of billing | Store P-10 by board stage, checkout C-50, time tracking, Stripe (2, 4) |
| Legal Hotline on VoiceStamps ($60 per 10 min), billed separately | Separate billing and telephony | Telephone F-21 through the comms seam (3) |
| Follow-up Consultation Form -> product 102 | Returning-client state by URL, no login | Client app with real case state (2) |
| Pleadings drafted in **WordPerfect** (per Justin) | "Terrible"; no templates tied to stage or SKU | Template catalog, template manager S-10, assembly S-11, pleading editor, multi-editor S-12 (2-3) |
| Microsoft Teams for video | Not recorded or summarised into the case | Video with recording + AI summary C-60 / L-50 (3) |
| No client portal, no CRM, no project management found `[u]` | Everything in the attorney's head | Cases L-10, CRM MK-01, PM viewer, radar O-10 (1-2) |

Headline prices as indexed: initial and follow-up consultation $165 / 30 min; ongoing work $330 / hour; hotline $60 per 10 minutes. Full SKU table in the firm digest. **Unverified for 2026-09-18.**

## 3. The nine role experiences

Each role has a home page, a shell, permissions, a demo user and a place on the hub (D-004, D-005). The public site is the tenth surface.

| Role | Code family | What they need (from the brief and the firm's model) |
| --- | --- | --- |
| **Client (tenant)** | C | Where my case is on the board and what comes next; my binder (every document, what is missing); what to watch next and what I have learned; what to pay next and the calendar of potential costs by scenario; my deadlines in plain language; my consultations and recordings; messages; sign documents; Spanish. |
| **Front desk** | F | Intake queue from the forms; scheduling phone / video consultations across the attorney network; call log with hotline minutes; client directory; unified comms inbox; payments pending; today at a glance on a wall screen. |
| **Attorney (lawyer)** | L | My cases with board position, parties, deadlines, documents, comms, costs; deadline calendar where every deadline explains its statute; discovery tracker; what is running late and where I need help; what my client has watched; video consultations with AI summaries; research; assignments to paralegals. |
| **Paralegal / assistant** | S | Assignments by case and stage; documents to prepare from templates per board node; document assembly and pleading paper; filings due; client uploads to file into the binder; e-sign sending; drafting assistant review. |
| **Owner** | O | Late-work radar across attorneys and offices ("anything that's running late, anything where the lawyers need help"); caseload; revenue by SKU / stage / attorney; conversion from videos to consultations; payroll / payouts to the network; annotations from testers. |
| **Admin (super admin)** | A, D | Users and roles, tables, rules, settings, feedback inbox, dev tools, view-as, dev mode. |
| **Marketing** | MK | Leads and funnel (visitor -> video -> intake -> consult -> client), content calendar (videos, shorts, articles), city landing pages from data, reviews and testimonials. |
| **Opposing counsel** | X | Documents served to them with acknowledgement, meet-and-confer log, strictly scoped to their case; "even the experience for opposition lawyers". |
| **Public** | P | The redesigned website and purchasing experience: educate-first funnel, game board, videos, store by stage, offices, proposal pages. |

## 4. Departments (the ops manual's parts)

Front desk; intake and consultations; case work by board stage; discovery; documents and pleadings; client learning; owner and finance (billing, payroll, network offices); marketing; using CTL OS. Every department gets chapters in `docs/ops-manual/` (en + es) with live blocks that read the system instead of typed numbers.

## 5. The game board

The board (transcribed in `docs/game-board/README.md`, data in `nodes.json`) has ten phases (Start / Service, Motion to Quash, Demurrer, Default, Discovery, Summary Judgment, Trial, Appeal, Removal to Federal Court / Petition, Outcomes), four node kinds (Document, Hearing / Decision, Outcome or Event, Start) and five path types (Normal, Positive, Negative, Neutral, Jump). Justin: "turn it into something more three-dimensional and more complete". In CTL OS the board is:

- **GB-01** the interactive 2D board (Pass 1), **GB-02** "where am I" for a case (position, visited path, possible next moves, the documents each move needs), **GB-03** the cost / if-then overlay, **GB-04** the 3D object view (Pass 2, D-020).
- **The spine of the data model**: every case has a board position; every document template binds to a board node; every SKU maps to a node or edge; every deadline rule attaches to an edge; the client's "what comes next", "what to pay next" and "what to watch next" are all functions of position.

## 6. Discovery ("a big issue that we can help to solve")

Gathering documents from clients and others (requests with reminders and phone uploads), connecting email and text messages as evidence (import seams, tagging, chain-of-custody fields), the client's **binder** (everything organised by stage, what is missing), our discovery (requests for admission, interrogatories, requests for production), their discovery to us, meet and confer, motion to compel, cut-offs from the deadline engine, and the opposing-counsel portal for service. Pass 2 (D-028).

## 7. Deadlines, cases, assignments, late work

Cases and matters with parties, people (clients, co-tenants, landlords, managers, opposing counsel, judges, courts) and an events timeline by actor; a **deadline engine** for California unlawful detainer rules (court days, holidays, service-method extensions) where **every rule cites a row in `docs/legal`**; assignments by person and stage; the owner's **late-work radar** and "needs help" escalation. Pass 2.

## 8. Costs: roadmap, calendar, what to pay next

"Estimate the roadmap of costs over time and see a calendar of potential costs depending on what happens according to the game board (if this, then that)". A cost model per node / edge from the SKU catalog, scenario switches, a dated range on a calendar, and the single next payment with its reason. Pass 2 (D-030).

## 9. Learning management

The firm's videos ("Winning Your Eviction" parts 1-7, the procedural "Eviction Series", the 2025 refresh, topic videos), articles (14 categories) and kits become a curriculum mapped to board nodes; watched state per client; content dripped along the journey; attorneys see completion before a consultation; the player works with a TV remote. Pass 2 (D-029). Video order and 2025 episodes `[u]`.

## 10. Communications

Scheduling calls and video calls, recording them, AI summaries into the case; telephone (replacing the pay-per-minute hotline vendor); email, SMS, WhatsApp; one `message_log` and `CommsProvider` seam (D-027); unified staff inbox; consent and recording rules from `docs/legal`. Pass 3.

## 11. Documents and pleading paper

Template catalog bound to board nodes and SKUs, template manager, assembly from case data, a browser pleading-paper editor with numbered-line ruler and PDF / DOCX export (D-018), then realtime multi-editor with presence, comments and revisions; e-sign for engagement letters and settlements; a drafting assistant that cites legal memory and never files without attorney approval. Passes 2-3.

## 12. Legal memory with law-change tracking

`docs/legal/`: statute index (`verified_on` per row), append-only law-change log, topic files (unlawful detainer procedure, security deposits, AB 1482 rent cap / just cause, habitability, retaliation, late fees, entry notice, foreclosure tenants, mobilehome, commercial). Currency flags to check before anything ships: AB 2347 (response period 10 court days), AB 12 (deposit cap), repair-and-deduct wording, deposit penalty multiple, AB 1482 sunset. Rendered at K-10; a research seam (L-60) proposes entries an attorney verifies. **Nothing in it is legal advice until verified** (D-019).

## 13. Hub, canvas, simulator, dev mode, PM viewer

- **HUB-01**: choose who you are (any role / demo user), open any surface, dev mode on / off, language, theme, counts.
- **Canvas D-21**: every page laid out on one zoomable surface, each live and usable, "rather than only seeing one page at a time".
- **Demo simulator D-22**: phone and desktop frames for presenting everything built.
- **Dev mode**: specs, inspector, actions, placeholders visible on every page (super admin only).
- **PM viewer PM-01..PM-05**: kanban, list, timeline with dependencies (ticks, D-013), dependency graph as an object view (icons / previews per node), task detail and passes, reading `docs/plan/tasks.json` (D-014). Also the proposal's evidence of how deeply the system was thought through (P-02..P-04: full-stack view, replacement map, roadmap).
- **Design system, component library, document templates and tables** managed in the product (P-07).

## 14. Appliance vision

"Assume this could be installed on a Linux distro and boot up directly into the software", capable of video calls, telephone, email, text, WhatsApp, CRM, project management, contract signing, drafting and legal research. Pass 5 builds the image; every earlier pass builds the seams so nothing is a rewrite (D-026).

## 15. Backend assumptions

- **Mock first** (`MockProvider`, localStorage), same interface for everything after (D-001).
- **Supabase** DB + Auth later; **Stripe** for payments and payroll (D-017), Pass 4.
- **Company-OS** (Playset-LLC) referenced for DB conventions, **not wired** until Justin says so (D-016); `CompanyOsProvider` seam.
- Graph views from imagine-os/graph-gallery (Objects 3D, lanes skill-tree, radial tree) for the board, the binder, the timeline and the map of the law (`docs/reference/graph-gallery-views.md`).

## 16. Development rules that apply (summary; binding text in `platform-principles.md` and `CLAUDE.md`)

Same-turn documentation (prompt verbatim, reply, changelog, decisions, kanban, tasks.json, page docs); git only (no PRs, no Slack posts from agents), Pages via Actions, build green before push; model routing stated in every reply; quality bar 360-3840 with 10-foot and up-close legibility; inputs keyboard / mouse / trackpad / touch / pen now, d-pad and voice soon; actions manifest on every page; library-only UI; annotations triaged from the store; placeholders announce themselves; surfaces recorded; en / es; multiplayer-ready rows.

## 17. Unverified / needs Justin or the firm

| # | Item | Why it matters | Where flagged |
| --- | --- | --- | --- |
| U-1 | The site itself (visuals, palette, typography, page order) could not be observed from the build environment | Public site and proposal styling; video order in the curriculum | D-025, `firm-site-digest.md` §1.6, §3.1 |
| U-2 | Prices and rates ($165, $330/h, $60/10 min, SKU table) are as last indexed | Store P-10, cost model, proposal | D-025, D-030 |
| U-3 | Scheduler vendor, forms vendor, theme / plugins | Replacement map P-03 | digest §5 |
| U-4 | Eighth office and the San Diego attorney | Offices page, network payroll | digest §1.3 |
| U-5 | Whether real attorney names may appear in the proposal and seed | D-023 | kanban Awaiting Justin |
| U-6 | Pages enabled on the repo (Settings > Pages > Source = GitHub Actions) | Deploy | D-024 |
| U-7 | Company-OS timing; Supabase interim or long-term | Pass 4 gate | D-016, D-017 |
| U-8 | Pleading-paper editor approach; 2D-first board order | D-018, D-020 | proposed rows |
| U-9 | Who at the firm verifies legal rows (`verified_on`) | Deadline engine cannot treat rules as current without it | D-019, `docs/legal/README.md` |
| U-10 | 2026 law currency: AB 2347 10-court-day response, AB 12 deposit cap, repair-and-deduct wording, deposit penalty multiple, AB 1482 sunset, local relocation figures | Every rule in the engine and every video / article that states the old rule | `docs/legal/law-change-log.md` |
| U-11 | The 2003 State Bar discipline note on the founder's Martindale profile | How bios address it, if at all | digest §1.2 |
| U-12 | "Non-profit" legacy positioning vs current for-profit copy | Public site copy | digest §1.1 |

## Resumen en español

CTL OS es el sistema operativo completo para California Tenant Law, un bufete que solo representa inquilinos en California, vende servicios por piezas ("máquina expendedora legal") por teléfono y video, educa primero con videos gratuitos y usa un tablero de juego del desalojo (Unlawful Detainer Game Board) como metáfora central. El sistema cubre nueve experiencias de rol (cliente, recepción, abogado, asistente, dueño, admin, marketing, abogado contrario, público), el tablero como datos y en 3D, discovery y la carpeta del cliente, plazos con cada regla citando la ley, costos "si esto, entonces aquello", aprendizaje con estado de visto, comunicaciones unificadas, documentos y papel de alegatos multi-editor, memoria legal con registro de cambios de ley, hub con canvas y simulador, y una visión de appliance Linux. Backend: Supabase y Stripe después; Company-OS solo como referencia. Los datos del bufete son "según el índice web" y están marcados como no verificados.
