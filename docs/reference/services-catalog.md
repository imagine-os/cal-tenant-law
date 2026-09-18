# California Tenant Law: services catalog (scraped live 2026-09-18)

Source: `/all-services` (every SKU with price), the Ecwid storefront (store 1197002: categories, full product descriptions, order fields), `/store`, `/hotline`, `/about`, `/contact`, `/paid-legal-services-new-returning`. Machine-readable twin: `docs/data/services-catalog.json` (98 rows: 96 store products + the hotline and the hourly rate). Every price is as posted on 2026-09-18 and **`verified: false`** until an attorney at the firm confirms it (docs/legal/README.md rule 2; D-038). Prices are US dollars; "min." means the store item is a minimum charge with extra time billed at $330/hour and paid through the 800-series supplemental payments.

## How the menu works (from the site's own copy)

- **Tagline of the store**: "Pay-as-you-go legal services — like a legal vending machine." About page: "For almost all of the actual services, there is a set price. Like a vending machine, you pay for X and you get X, so that the total cost is entirely up to you. We work within your budget."
- **Funnel**: watch the free Legal Videos -> "Attention" gate (`/consultation`: "Consultations are not free. The Initial Consultation with Ken Carlson or one of his associate attorneys is $165 for 1/2 hour.") -> Initial Consultation Form (long intake; "After filling out the Initial Consultation Form, you will be redirected to the service page where you may submit your payment"; a PDF of the answers is emailed) -> buy **101 Initial Consultation with Attorney ($165)** -> 30 minutes by phone or Microsoft Teams ("no office visit, sorry"). "On your first consultation, you become a client."
- **Who you talk to**: "No paralegals. You speak only with a licensed attorney who specializes in landlord-tenant law." Consultations are "with Ken Carlson or one of his associate attorneys"; paperwork goes by email to "your assigned associate attorney" ("Please only scan to PDF; do not use your phone scanner").
- **Returning clients**: Follow-Up Consultation Form (`/consultation/follow-up`: what happened since, what to discuss, best days, deadline, who we talk to) -> **102 Follow-up Consultation ($165)**. Store quick links for existing clients: Follow-up Consultation, "I just got this paperwork. Now what?" (**103, $100**), Call the Legal Hotline.
- **Hotline** (`/hotline`, existing clients only, 213 340 1090, VoiceStamps): "$60 charge is accepted as a deposit towards your call, covering up to 10 minutes. If the call goes over that, another $60 charge is accepted for each new 10 minute session without interrupting the call ... only the minutes actually used will be charged, and your refund of the balance will be put back on your card in a few days." Billing is separate from consultations. "If you want to talk to Ken during normal business hours, you need to reserve a time for your call."
- **Email**: "Emailed communications except to correct mistakes in paperwork, arrange a consultation time, or request accounting information, are all billed as consultation time with a minimum of $75 payment required." Store item **75 Email Communications ($240)** is a deposit for 4 paired emails at $60 each.
- **Court appearance**: "We do everything but go to court, and for that we can arrange a lawyer for you if you wish." Item **450 Court Appearance (min. $330)**: "DO NOT pay for this service unless you have first gotten the associate attorney's commitment to be able to appear for you"; "We encourage our clients to make court appearances without an attorney wherever possible ... in most cases, you can 'submit on the papers'"; remote appearance via Zoom / CourtCall (about $100 extra); the lawyer substitutes in for the hearing and out afterwards; not for trials or depositions.
- **Self-representation with the firm behind you**: "You officially represent yourself, even though the judge and lawyers will know that we are behind you, writing all of your paperwork and advising you." "Some things you can do yourself, like filing court papers, or you can pay to have us do it for you." Item 65 covers arranging filing when the attorney agrees.
- **Payment and records**: "All payments are online by card or PayPal. ... Accounting is electronic through the shopping cart's optional registration and sign-in feature, as well as on request to CalTenantLaw.com. All documents are faxed or scanned to PDF format." Fax for paperwork: 888 764 1919 (in several order forms). Download links in confirmations expire after 72 hours.
- **Minimums and top-ups**: many litigation items are posted as a minimum ("Due to the complexities ... more time may be required than the expected hour"); the attorney advises the extra amount, paid through **Supplemental Payment** items 800-820 ($50 to $2,000, each asking "What exactly is this for?"). Per-item pricing applies to motions to compel (one per discovery item), discovery responses, jury instructions.
- **Changes**: **140 Changes in Paperwork ($75)** is for changes the clerk or you require; "This is NOT for MISTAKES that I may have made in your paperwork. Those changes are FREE."
- **Rates stated**: $165 / 30-minute consultation; $330 per hour ongoing ("transparent pricing with no hidden fees", contact FAQ); $60 per 10 minutes hotline; $75 minimum for a billed email.

## The menu, as the store presents it

Order = the `/store` category menu (the visible store tree is two levels deep: category, then products in the order the store lists them; there are no visible subcategories). Ecwid names differ slightly where noted; the italic line under each heading is the category's own description in the store. Each row: position in the category, SKU, title as posted, price, unit, deliverable format, deliverable (our one-line reading of the product description), time expectation, board nodes. Client inputs and "not included" caveats are in the JSON (`client_inputs`, `not_included`).

### 1. Request a Consultation  
Consultations, evaluations and letters: the entry point for new clients and the check-in for returning ones. Ecwid name "Scheduled Consultation". Store page: `/store/schedule-a-consultation`; Ecwid name "Scheduled Consultation"; board phase: `start`.  
_All consultations with the attorney other than Hotline calls,_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 101 | Initial Consultation with Attorney | $165 | flat | call | 30-minute initial consultation by phone or Teams with Ken Carlson or an associate attorney: where you are, your rights, your goal, the plan. | 30 minutes (1/2 hour). | start, eviction-notice-or-lease-ends |
| 2 | 102 | Follow-up Consultation | $165 | flat | call | Follow-up consultation for existing clients on what happened since and what to do next. | Follow-up consultation (30-minute unit implied by the price); download links expire in 72 hours. | — |
| 3 | 103 | I just got this paperwork. Now what? | $100 | flat | review | Attorney reads and evaluates the paperwork you just received and tells you what it is, what to do and by when (information only). | Consultation after the attorney reads the paperwork; deadline field on the order. | process-server-tries-to-serve-you, evaluate-service |
| 4 | 104 | Situation Evaluation | $200 | flat | review | Situation Evaluation: attorney thinking time on one part of the case (paperwork review, research), results given in a separate consultation or hotline call. | Attorney "quiet time"; results go over in a separate consultation or hotline call. | — |
| 5 | 105 | Case Evaluation | $400 | flat | review | Case Evaluation: full step-back review of where the case is, what must be done and the plan; may take more than one unit. | May need more than one unit; results go over in a separate consultation or hotline call. | — |
| 6 | 106 | Quick Question | $50 | flat | call | 5-minute consultation on something that needs no document review. | 5 minutes. | — |
| 7 | 110 | Simple Letter to Landlord | $300 | flat | letter | Attorney-written letter to a landlord who has no lawyer, sent under your name, on one issue (deposit refund, stop entering, repairs, rent increase, threatened eviction). | — | eviction-notice-or-lease-ends |
| 8 | 111 | Complex Letter to the Landlord | $600 | flat | letter | Complex letter to the landlord after consultation, document review and research, setting out your position and demands. | After consultation, document review, research and careful drafting. | eviction-notice-or-lease-ends |
| — | HOTLINE | Legal Hotline (existing clients) | $60 | per_10min | call | Phone call with Ken during business hours on the hotline number 213 340 1090 (reserve a time first). | Per 10-minute block, live call during business hours (reserve a time). | — |

### 2. Changes to Prepared Paperwork  
Amendments the court clerk or a change in your plans require (the firm's own mistakes are corrected free). Store page: `/store/changes-to-prepared-paperwork`; Ecwid name "Changes to Prepared Paperwork"; board phase: `None`.  
_Where paperwork has already been properly prepared by the lawyer, but you want some changes made other than corrections of errors, this section covers those amendments._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 140 | Changes in Paperwork | $75 | flat | pdf | About 15 minutes of changes to paperwork already prepared, when the clerk or your circumstances require them; the firm's own mistakes are fixed free. | About 15 minutes of work; amended paperwork or Amended Notice sent back to you. | — |

### 3. Motion to Quash  
Attacking bad service, removal to federal court and the petitions for writ of mandate that follow a wrong ruling. Store page: `/store/motion-to-quash`; Ecwid name "Motion to Quash"; board phase: `quash`.  
_This section deal with the Motion to Quash service of Summons, ranging from the initial motion filed to the appellate court review of the decisions made by the judges._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 150 | Normal Motion to Quash | $250 | flat | pdf | Normal Motion to Quash based on improper physical service of the summons and complaint; no court appearance; "an extra 3 weeks up front". | "Gets you an extra 3 weeks up front"; no court appearance needed. | service-bad-file-motion-to-quash |
| 2 | 151 | Delta Motion to Quash | $350 | flat | pdf | "Delta" Motion to Quash attacking technical defects in the complaint that make the 5-day summons improper, even if service was good. | "At least the 3 weeks from filing, and probably more time" via the writ petition. | service-bad-file-motion-to-quash |
| 3 | 155 | Removal to Federal Court | $600 | flat | filing | Notice of Removal to Federal District Court (federal question, e.g. PTFA / CARES Act), filed after the motion to quash phase; stops the UD until remand. | Stops the eviction until remand; at least 30 days after remand for the demurrer; "can add at least 45 days, and perhaps months" (Game Board page). | foreclosure-tenants-remove-to-federal-court |
| 4 | 160 | Petition for Writ of Mandate [Quash-Limited] | $600 | flat | pdf | Petition for Writ of Mandate to the Appellate Department (limited civil case) after an improper motion-to-quash ruling; "at least another 3 weeks". | "At least another 3 weeks" on top of the motion to quash; sometimes months. | petition-for-writ-of-mandate |
| 5 | 161 | Reply to Opposition to Petition for Writ of Mandate | $300 | flat | pdf | Reply when the landlord opposes your writ petition (usually about an hour of work). | "Usually done within an hour's time". | petition-for-writ-of-mandate, writ-of-mandate-decision |
| 6 | 170 | Petition for Writ of Mandate [Quash - Unlimited] | $900 | flat | pdf | Petition for Writ of Mandate to the District Court of Appeal (unlimited civil case); substantially more work than the limited-case form. | "At least another 3 weeks"; sometimes months. | petition-for-writ-of-mandate |

### 4. Default  
Un-losing: clerk mistakes, relief from default, motion to vacate, ex parte stay of the lockout. Store page: `/store/default`; Ecwid name "Default"; board phase: `default`.  
_This section concerns all of the different aspects of a "default", where you have officially "lost" the case and want to "un-lose" ;the case to get back on track and have your day in court._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 200 | Trying to correct the Court Clerk's Mistakes | $200 | flat | call | Attorney phone call to the clerk supervisor or court manager to undo a clerk's mistake (premature default, rejected filing, wrong calendar) without filing papers; "works about half the time". | One phone call to the clerk supervisor / court manager; "works about half the time". | default-entered-by-clerk, landlord-misleads-court-clerk |
| 2 | 201 | Default Relief motion  and Stay | $500 | flat | pdf | Package: ex parte stay to stop the lockout plus either the motion for relief from default (your fault) or the motion to vacate (clerk's fault). | Ex parte stay stops the lockout so the motion can be heard early. | motion-for-relief-from-default, motion-to-vacate, ex-parte-stay-application |
| 3 | 205 | Ex Parte Application for Stay and Shortening Time | $175 | minimum | pdf | Ex Parte Application for Stay of execution and Shortening Time so your default motion is heard before the Sheriff locks you out. | Shortens time so the motion is heard "quickly ... and not a month from now". | ex-parte-stay-application |
| 4 | 206 | Motion for Relief from Default -minimum charge | $330 | minimum | pdf | Motion for Relief from Default when the default was your fault (missed deadline, late to trial); about an hour of standard work. | About an hour of standard drafting (minimum). | motion-for-relief-from-default |
| 5 | 207 | Motion to Vacate -minimum charge | $350 | minimum | pdf | Motion to Vacate a default or order the court entered by mistake (clerk or judge error). | About an hour of standard drafting (minimum). | motion-to-vacate |

### 5. Discovery – by Us  
Our discovery to the landlord and the motions to make them answer. Store page: `/store/discovery-by-us`; Ecwid name "Discovery - by Us"; board phase: `discovery`.  
_This section concerns your attempt to get information from which to prepare your case for trial._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 250 | Discovery: Trio Package | $600 | flat | pdf | Discovery Trio: Requests for Admission, Requests for Production and General Form Interrogatories (incl. 17.1) in one package. | Serve as early as possible after the motion to quash is decided (cut-offs apply). | discovery-requests |
| 2 | 251 | Discovery: Requests for Admission and Follow-up General Form Interrogatories | $400 | flat | pdf | Requests for Admission tailored to your case plus follow-up General Form Interrogatories (17.1). | Serve at the earliest opportunity after the motion to quash is decided. | discovery-requests |
| 3 | 252 | Request for Production | $200 | flat | pdf | Request for Production of documents and evidence from the landlord (lease papers, ledger, communications, deed, permits, photos, footage). | — | discovery-requests |
| 4 | 253 | Discovery: UD Form Interrogatories | $100 | flat | pdf | UD Form Interrogatories prepared for you (the bare-bones discovery). | Serve at the earliest opportunity after the motion to quash is decided. | discovery-requests |
| 5 | 254 | Discovery: Special Interrogatories | $150 | flat | pdf | Special Interrogatories written to your case's dates, events and people. | Serve at the earliest opportunity after the motion to quash is decided. | discovery-requests |
| 6 | 270 | Reviewing and Advising on Discovery | $300 | flat | review | 2 hours reviewing the discovery we sent, their responses and the next step; not the meet-and-confer letter or motion to compel. | 2 hours of review. | good-responses, no-response-or-mostly-objections |
| 7 | 280 | Discovery: Meet and Confer Letter - Evasive Responses | $500 | minimum | letter | Written meet-and-confer letter answering evasive responses and objections item by item (about an hour; more if complex). | About an hour (estimate); "give them some time to respond before you then file your motion to compel". | meet-and-confer-attempt |
| 8 | 290 | Discovery: Motion to Compel - No Response Received | $300 | per_item | pdf | Motion to Compel when no response at all was received: one motion per discovery item (trio with no answers = 3 motions, $900). | One motion per discovery item (trio with no responses = 3 motions, $900). | motion-to-compel-and-postpone-trial |
| 9 | 296 | Discovery: Our Reply to their Opposition to our Motion to Compel -minimum charge | $400 | minimum | pdf | Our Reply to the landlord's opposition to our motion to compel. | About an hour (minimum). | opposition-to-motion-to-compel, motion-to-compel-hearing |
| 10 | 299 | Discovery: Ex Parte Application to Continue the Trial and advance Motion to Compel | $200 | flat | filing | Ex Parte Application to continue the trial and advance the motion to compel when trial is coming too fast. | Ex parte hearing you must attend. | motion-to-compel-and-postpone-trial, trial-set-by-clerk |
| — | 316 | Motion to Compel - Objections and Evasive Responses -minimum charge | $800 | per_item | pdf | Motion to Compel further responses when the landlord answered with objections and evasions; includes the Separate Statement; per motion ($800 each). | Per motion, more than an hour each (separate statement required). | motion-to-compel-and-postpone-trial |

### 6. Discovery – by Them  
Responding to the landlord's discovery, meet-and-confer letters, motions to compel, deposition help. Store page: `/store/discovery-by-them`; Ecwid name "Discovery - by Them"; board phase: `discovery`.  
_This section concerns the landlord's attempts to get information from you._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 300 | Discovery: Responses to their Discovery | $400 | per_item | pdf | Responses to the landlord's discovery, per item: evaluate, object, gather your information, write the response under oath. | Per discovery item; responses in proper format under oath. | — |
| 2 | 311 | Discovery: Our Response to their Meet and Confer letter | $300 | flat | letter | Our response to the landlord's meet-and-confer letter about your discovery responses. | — | — |
| 3 | 315 | Discovery: Opposition to their Motion to Compel | $400 | per_item | pdf | Opposition to the landlord's motion to compel your responses, per motion. | Per motion. | — |
| 4 | 330 | Deposition Preparation | $165 | flat | call | Half-hour preparation for your deposition: the process, how to answer, how to handle questions. | 1/2 hour. | — |
| 5 | 340 | Lifeline Court or Deposition | $200 | flat | call | "Lifeline": your assigned lawyer on call by phone during a hearing, trial or deposition, up to 1/2 hour. | Up to 1/2 hour of calls during the hearing, trial or deposition. | trial |

### 7. Demurrer  
Attacking the complaint itself; also the demurrer / motion-to-strike / SLAPP oppositions when the tenant is the plaintiff. Store page: `/store/demurrer`; Ecwid name "Demurrer"; board phase: `demurrer`.  
_This section concerns a Demurrer to the Complaint or Cross-complaint, and a Motion to Strike the Complaint, or Cross-complaint._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 370 | Demurrer to the Complaint | $500 | flat | pdf | Demurrer to the Complaint attacking its defects; hearing about a month out; "about 6 weeks more" of time; no attendance needed. | Hearing set about a month out; "you can get about 6 weeks more"; no attendance needed. | demurrer |
| 2 | 373 | Reply to Opposition to Demurrer | $300 | minimum | pdf | Reply to the landlord's opposition to your demurrer (optional but often helpful). | — | our-reply-to-opposition |
| 3 | 374 | Opposition to Shortening Time for Demurrer | $100 | flat | pdf | Emergency opposition to the landlord's ex parte application to shorten time on the demurrer hearing. | Drafted on an emergency basis for the next-day hearing; you should attend. | our-opposition-to-ex-parte-app, ex-parte-hearing |
| 4 | 376 | Demurrer Meet and Confer | $300 | flat | letter | When you are the plaintiff: our reply to the landlord's pre-demurrer meet-and-confer letter. | Their letter arrives within 30 days of service of your complaint. | you-stay-and-sue |
| 5 | 377 | Demurrer Opposition - Min. Charge | $500 | minimum | pdf | When you are the plaintiff: opposition to the landlord's demurrer to your complaint. | — | you-stay-and-sue |
| 6 | 380 | Motion to Strike | $330 | flat | pdf | Motion to Strike improper parts of the complaint, filed and heard with the demurrer. | Filed and heard with the demurrer; "generally it does not result in more time". | demurrer |
| 7 | 385 | Motion to Strike Opposition | $400 | flat | pdf | When you are the plaintiff: opposition to the landlord's motion to strike (punitive damages, attorney fees). | — | you-stay-and-sue |
| 8 | 390 | Opposition to SLAPP Motion | $600 | flat | pdf | Opposition to the anti-SLAPP motion the landlord's lawyer files when you sue for malicious prosecution. | — | you-stay-and-sue |

### 8. Answer  
The Answer to the unlawful detainer complaint with affirmative defenses and the jury demand. Store page: `/store/answer`; Ecwid name "Answer"; board phase: `demurrer`.  
_This section concerns preparing your Answer to the Complaint, and related paperwork._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 400 | Answer to Unlawful Detainer Complaint | $250 | flat | pdf | Answer to the Unlawful Detainer Complaint with affirmative defenses, after a brief discussion with the attorney. | Prepared after a brief discussion with the attorney. | answer-to-complaint |

### 9. Trial Preparation  
Summary judgment, court appearance, jury trial documents, instructions, trial coaching, motion for new trial. Store page: `/store/trial-preparation`; Ecwid name "Trial Preparation"; board phase: `trial`.  
_This section concerns helping you get ready for trial with jury instructions and other papers you will need to file, help making your presentation effective, and other trial-related services._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 425 | Motion for Summary Judgment [minimum] | $600 | minimum | pdf | Tenant's Motion for Summary Judgment after the Answer, when one defense is clear; also forces the landlord to show the evidence they hid in discovery. | — | summary-judgment-hearing |
| 2 | 450 | Court Appearance -minimum | $330 | minimum | call | Attorney appears for you at a hearing (substitutes in and out), billed at $330/hour with a one-hour minimum; not trials or depositions. | Minimum one hour; waiting time at the courthouse (up to 2 hours) is billed. | motion-to-quash-hearing, demurrer-hearing, ex-parte-and-motion-hearings, motion-to-compel-hearing, summary-judgment-hearing, pretrial-conferences |
| 3 | 460 | Trial: Initial Jury Trial Documents | $660 | flat | pdf | The four jury trial documents for the Final Status Conference: witness list, exhibit list, statement to the jury, proposed form jury instructions (plus existing special instructions). | For the Final Status Conference. | prepare-jury-trial-papers, pretrial-conferences |
| 4 | 461 | Trial: Unique Jury Instructions - Per Instruction | $330 | per_item | pdf | Unique (non-CACI) jury instruction researched and drafted for your case, per instruction; not charged if one already exists. | Per instruction; you are told how many units after they are done. | pretrial-conferences |
| 5 | 465 | Trial: Formatting Jury Instructions | $600 | flat | pdf | Converting the CACI instructions into the format a judge requires (about 2 hours). | About 2 hours. | pretrial-conferences |
| 6 | 475 | Eviction Trial Preparation | $330 | flat | call | One-hour trial preparation consultation: what to say, what to do, how to present and handle questions. | One-hour trial preparation consultation. | prepare-jury-trial-papers |
| 7 | 490 | Trial: Your Opening Statement to the Jury | $330 | flat | pdf | Your opening statement to the jury, written for you to read. | — | trial |
| 8 | 520 | Motion for New Trial | $300 | flat | pdf | Motion for New Trial when something went badly wrong at trial, usually with an ex parte to stop the lockout. | Usually presented with an ex parte to stop the lockout. | you-lose |

### 10. Settling and Negotiation  
Talking to the other lawyer, drafting the settlement, sealing the case. Store page: `/store/settling-and-negotiation`; Ecwid name "Settling and Negotiation"; board phase: `outcomes`.  
_This section concerns your negotiation for a settlement, settlement terms, the agreement, and enforcement._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 500 | Talk to the Other Lawyer | $165 | flat | call | Ken talks to the landlord's lawyer (settlement, meet and confer, vacating a default): 1/2 hour total including reporting back. | 1/2 hour total (talking to you, the other lawyer, reporting back). | settlement-you-set-the-terms, meet-and-confer-attempt |
| 2 | 501 | Settlement Agreement Drafting | $200 | flat | pdf | Final drafting and review of the settlement agreement (day of trial or earlier). | Final drafting and review, on the day of trial or earlier. | settlement-you-set-the-terms |
| 3 | 505 | Motion to Seal Case | $165 | flat | pdf | Motion to Seal the eviction case record (less needed since the 2017 masking law, still needed after a judgment). | — | case-dismissed-by-landlord, settlement-you-set-the-terms |

### 11. Judgment  
After you win: costs and attorney fees. Store page: `/store/judgment`; Ecwid name "Judgment"; board phase: `trial`.  
_This section concerns the judgment in a case, including document preparation and advice._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 510 | Cost Memorandum / Attorney Fees Motion | $165 | flat | pdf | Cost memorandum and motion for attorney fees after you win. | Filed together after you win; order made at the motion hearing. | you-win |

### 12. Appeal  
Notice of appeal through reply brief, stay pending appeal, augmenting the record. Store page: `/store/appeal`; Ecwid name "Appeal"; board phase: `appeal`.  
_This section concerns your appeal of the judgment if your default was improperly taken or the judgment was illegal or improper._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 600 | Appeal Package | $500 | flat | filing | Appeal Package: Notice of Appeal, request for clerk's transcript, Statement on Appeal (or reporter's transcript request). | — | notice-of-appeal |
| 2 | 605 | Responses to Opposition or Order as to Statement on Appeal | $165 | flat | pdf | Response to the landlord's proposed changes or the judge's engrossed Statement on Appeal. | — | notice-of-appeal |
| 3 | 610 | Appeal: Stay Pending Appeal [minimum] | $600 | minimum | pdf | Two motions: petition for stay to the trial judge, then Petition for Writ of Supersedeas to the appellate court to stop the lockout pending appeal. | Two motions (trial court petition, then writ of supersedeas with a voluminous Bates-stamped record). | request-stay-pending-appeal-trial-court, request-stay-pending-appeal-appeals-court |
| 4 | 620 | Appeal: Motion to Augment Record | $330 | flat | pdf | Motion to Augment the record on appeal with documents the clerk left out. | — | notice-of-appeal |
| 5 | 630 | Opening Brief - Request for Extension of Time | $165 | flat | pdf | Request for extension of time to file the opening brief (usually 30 days granted). | Usually about 30 more days granted; must be filed by the briefing deadline. | your-opening-brief |
| 6 | 650 | Opening Brief on Appeal - Minimum Charge | $1,100 | minimum | pdf | Opening Brief on appeal: the "trial of the trial", with record and authority citations. | Minimum; additional amount advised when done. | your-opening-brief |
| 7 | 660 | Review and Evaluate Responsive Brief | $500 | minimum | review | Review and evaluation of the landlord's responsive brief with a report to you on whether to reply. | Minimum; you are advised of any extra and then decide on a reply brief. | landlords-responsive-brief-filed |
| 8 | 670 | Reply Brief on Appeal - Minimum Charge | $850 | minimum | pdf | Reply Brief on appeal. | Minimum; additional cost advised after completion. | your-reply-brief |

### 13. Suing the Landlord  
Drafting the complaint or cross-complaint against the landlord. Store page: `/store/suing-the-landlord`; Ecwid name "Suing the Landlord"; board phase: `outcomes`.  
_This section concerns all aspects of suing the landlord, whether in small claims court, a counter-suit in an eviction case, or your separate lawsuit as the Plaintiff._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 705 | Drafting Complaint [simple] | $900 | flat | pdf | Complaint or cross-complaint against the landlord on pleading paper, up to 3 causes of action, with Summons and Civil Case Cover Sheet. | Cannot start until the Complaint Info form is submitted. | you-stay-and-sue |
| 2 | 706 | Drafting Complaint [complex] | $1,500 | flat | pdf | Complex complaint or cross-complaint (more than 3 causes of action) with Summons and Civil Case Cover Sheet. | Cannot start until the Complaint Info form is submitted. | you-stay-and-sue |

### 14. Miscellaneous / Supplemental  
Supplemental payments ($50 to $2,000) for work beyond a minimum charge. Store page: `/store/miscellaneous-supplemental`; Ecwid name "Miscellaneous / Supplemental"; board phase: `None`.  
_This section provides for supplemental payments, advance posting, and overtime payments. PLEASE DO NOT USE THIS OPTION UNLESS EXPRESSLY INSTRUCTED TO DO SO._

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 800 | Supplemental Payment - $50 | $50 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 2 | 801 | Supplemental Payment - $100 | $100 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 3 | 802 | Supplemental Payment - $200 | $200 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 4 | 803 | Supplemental Payment - $300 | $300 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 5 | 804 | Supplemental Payment - $400 | $400 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 6 | 805 | Supplemental Payment - $500 | $500 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 7 | 806 | Supplemental Payment - $600 | $600 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 8 | 807 | Supplemental Payment - $700 | $700 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 9 | 808 | Supplemental Payment - $800 | $800 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 10 | 809 | Supplemental Payment - $900 | $900 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 11 | 810 | Supplemental Payment - $1,000 | $1,000 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| 12 | 820 | Supplemental Payment - $2000 | $2,000 | deposit | review | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — | — |
| — | HOURLY | Attorney time beyond a set price | $330 | per_hour | review | Attorney time at $330 per hour. | Hourly. | — |

### 15. Game Board  
The Unlawful Detainer Game Board: free PDF, mailed poster, 11x17 print. Ecwid name "Unlawful Detainer Game Board". Store page: `/store/game-board`; Ecwid name "Unlawful Detainer Game Board"; board phase: `start`.  
_For the judges and plaintiff's lawyers who want to talk about your "playing games," this Game Board poster shown in a smaller version on the website is their focus. What they're missing is that law is a game, with rules of evidence, special procedures, powers that some have, rolling the dice, and lots of surprises. If they can't see it as a game, they've been watching too much TV. Law is not about_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 002 | Eviction "Game Board" | free | free | pdf | The Unlawful Detainer Game Board as a free PDF download. | — | start |
| 2 | 0021 | Unlawful Detainer Game Board Poster | $20 | flat | kit | Printed Unlawful Detainer Game Board poster, mailed. | Mailed poster. | start |
| 3 | 0022 | Unlawful Detainer Game Board  11X17 | $10 | flat | kit | Unlawful Detainer Game Board printed at 11x17. | Mailed print. | start |

### 16. Legal Kits  
Downloadable e-book kits: eviction defense, trial, deposit recovery, breaking a lease. Store page: `/store/legal-kits`; Ecwid name "Legal Kits"; board phase: `None`.  
_Doing the Best you Can with What you've Got
Low on funds? No problem. These inexpensive, easy-to-use legal kits give you hundreds of dollars worth of legal advice for a fraction of the normal cost. You also get the legal forms to use, step-by-step instructions on what to do, strategy, preparation, what to expect in court, and more.
Granted these are not as good as having full legal advice, but for_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 040 | Basic Eviction Defense Kit | $20 | flat | kit | 43-page e-book (PDF): step-by-step Answer, Answer form, proof of service, form interrogatories, fee waiver, habitability checklist, prejudgment claim. | Immediate download after payment. | answer-to-complaint, discovery-requests, unnamed-tenants-prejudgement-claim |
| 2 | 041 | Eviction Trial Kit | $100 | flat | kit | Eviction Trial Kit (PDF): how to prepare and try a UD jury trial yourself: exhibits, witnesses, papers, presentation. | Immediate download after payment. | prepare-jury-trial-papers |
| 3 | 042 | Deluxe Eviction Defense Kit | $120 | flat | kit | 74-page e-book (PDF) combining the Basic Eviction Defense Kit and the Eviction Trial Kit. | Immediate download after payment. | answer-to-complaint, discovery-requests, prepare-jury-trial-papers |
| 4 | 045 | Security Deposit Recovery Kit | $50 | flat | kit | Security Deposit Recovery Kit (PDF): small claims form, instructions, the law, presentation and collection advice; goal "3 times the amount of the deposit". | Immediate download after payment. | — |
| 5 | 050 | Break Your Lease Kit | $100 | flat | kit | Break Your Lease Kit (PDF): instructions, forms and sample letters to end a lease legally or minimise liability. | Immediate download after payment. | — |

### 17. Judges Gone Wild  
Petition for writ of mandate when a judge or commissioner rules after being excluded. Store page: `/store/judges-gone-wild`; Ecwid name "Judges Gone Wild"; board phase: `removal`.  
_Sadly, so many judges and commissioners in California courts have prostituted themselves to the landlords, abandoning their oath of office, to become the point man for the landlords. They even order the clerks to take illegal actions, and hold secret meetings to help the landlords win. Judges have absolute immunity, which they gave to themselves, so that even if they intentionally violate the law _

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 901 | Petition for Writ of Mandate - Judge/Commissioner | $400 | flat | pdf | Petition for Writ of Mandate when a commissioner, judge pro tem or excluded judge (CCP 170.6) ruled anyway; usually granted; can delay the case 2-4 months. | Must be filed within 10 days of the ruling; "might delay the eviction case for 2-4 months". | petition-for-writ-of-mandate |

### 18. Extra Services  
Filing arrangement, email communications deposit, CMC statement. Store page: `/store/extra-services`; Ecwid name "Extra Services"; board phase: `None`.  
_(no store description)_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 065 | Fax filing, E-filing, and Process Service arranging | $125 | minimum | filing | Attorney time to arrange fax filing, e-filing or a courier for your court papers (minimum charge; fees not included). | "Tripled the time now required to file a simple paper" (no fixed turnaround). | — |
| 2 | 75 | Email Mail Communications | $240 | deposit | review | Deposit for email communications: $60 per email, covers 4 paired emails (your question + the attorney's answer). | 4 paired emails per deposit. | — |
| 3 | 80 | CMC Statement | $100 | flat | pdf | Case Management Conference Statement prepared by the firm; you file the original, we serve the lawyer. | Due 15 days before the CMC hearing; "usually no harm if it is late". | you-stay-and-sue |

### 19. Free  
Free forms: habitability worksheet, prejudgment claim, UD form interrogatories, UD Answer form. Ecwid name "Free Resources". Store page: `/store/free-resources`; Ecwid name "Free Resources"; board phase: `None`.  
_These are publicly available forms that you could eventually find, but which are provided here for your convenience, for free. These forms DO NOT include instructions on how to fill them out, what to do with them, when they apply, or any other information that you really need an attorney's advice to so. If you know what to do, then this just saves you the time looking for them. If you don't know w_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 001 | Habitability Worksheet | free | free | pdf | Habitability Worksheet (PDF checklist of defects) for repair-and-deduct, code complaints, lawsuits and eviction defenses. | — | answer-to-complaint, you-stay-and-sue |
| 2 | 010 | Prejudgment Claim of Right to Possession | free | free | pdf | Blank Prejudgment Claim of Right to Possession form for occupants not named in the complaint. | — | unnamed-tenants-prejudgement-claim |
| 3 | 015 | Unlawful Detainer Form Interrogatories | free | free | pdf | Blank Unlawful Detainer Form Interrogatories, pre-checked, to mail to the landlord's attorney. | Responses due 10 days after you mail it and at least 5 days before trial (as stated). | discovery-requests |
| 4 | 020 | UD Answer - Just the Form | free | free | pdf | The official UD Answer form (Oct 2020 version) as a download; "NOT the form to file first" if you want time. | — | answer-to-complaint |

### 20. Legal Ethics  
Ken Carlson's Legal Ethics musical: double CD ($15) and free MP3 download. Ecwid name "Legal Ethics". Store page: `/store/legal-ethics-musical`; Ecwid name "Legal Ethics"; board phase: `None`.  
_The new musical comedy audioplay by Ken Carlson, the attorney who hosts this California Tenant Law website. This 95 minute production lampoons the legal system through the eyes of an idealistic new lawyer wanting to do good as a lawyer. The MP3 download is 230 Megs, so be patient!_

| # | SKU | Item | Price | Unit | Format | Deliverable | Time expectation | Board nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 900 | Legal Ethics Musical - Double CD | $15 | flat | kit | Legal Ethics musical, 95-minute audio production on a double CD, mailed USPS first class. | USPS first class, ETA 3 business days. | — |

## The firm's own stage hierarchy (hidden Ecwid categories)

Products are still attached to an older, stage-based navigation that the `/store` menu no longer shows (Ecwid keeps them as hidden categories under the store root, which the API names "Paid Legal Services"). It is the firm's own mapping of services to eviction stages: four levels deep at most. In the JSON these are categories with `visible: false` and `parent_id`; each service carries `legacy_category_id` / `legacy_category_path` (its default Ecwid path) and `store_paths` (every path).

- **Consultation** (`legacy-consultation`, 0 products): _Consult Ken Carlson directly either by phone or video SKype. No need to travel through traffic to a high-rise office, pay for parking and wait in the lobby. Dis_
  - **Emergency Information Needed** (`legacy-emergency-information-needed`, 2 products)
  - **Scheduled Consultation** (`legacy-scheduled-consultation`, 6 products): _When in doubt, start here. If this is your first time, you MUST selection this option and choose the Initial Consultation. Most of these consultations involve f_
- **I'm Being Evicted...** (`legacy-i-m-being-evicted`, 0 products): _Oh, No! The wolf is at your door, but has he got a surprise coming! The landlord wants you to run away scared, but once you realize what you can do to turn the _
  - **Appeal** (`legacy-appeal`, 7 products): _It may happen that, for whatever reasons, you lose the case and the judge will not help. It could happen because you responded too late, by landlord dirty trick_
  - **Emergency! Emergency!** (`legacy-emergency-emergency`, 4 products): _Just in case you are in an emergency situation, there is a special process. There is a Hotline you can call to talk to the lawyer at $5/minute, paid in advance _
  - **Heading to Trial** (`legacy-heading-to-trial`, 16 products): _At long last, the trial in your case approaches. Your landlord has been worn down and frustrated by all that you have done to this point, and he thinks it will _
  - **Start Here** (`legacy-start-here`, 4 products): _You don't walk or drive with your eyes closed. You don't take any legal steps, either, without knowing what you are, where you are going, what you want to avoid_
  - **The Discovery Phase** (`legacy-the-discovery-phase`, 0 products): _Discovery is the part of a lawsuit where you get information together to be able to prove your case at trial. The landlord and his staff will lie, almost withou_
    - **Making Them Answer** (`legacy-making-them-answer`, 9 products): _In most instances, the landlord either fails to respond to your discovery at all or poses multiple objections with evasive responses, solely to frustrate your e_
    - **The Basic Discovery Package** (`legacy-the-basic-discovery-package`, 4 products): _These are the basic documents you would probably use to get the information from the landlord. The UD form interrogatories are the easiest to fill out, but you _
    - **Their Discovery to You** (`legacy-their-discovery-to-you`, 8 products): _Usually, the landlord will not submit discovery to you unless you first send it to him. The reason is that discovery is an additional expense, and can result in_
  - **The Empire Strikes Back** (`legacy-the-empire-strikes-back`, 0 products): _How dare you! I couldn't resist the Star Wars analogy, because that's how it feels: you dare challenge the power, money and majesty of your landLORD and all the_
    - **If you filed a Demurrer...** (`legacy-if-you-filed-a-demurrer`, 2 products): _If you filed a Demurrer to the Complaint, there are two kinds of responses you would get. If the main one is their Opposition to the Demurrer, to which you woul_
    - **If you filed a Motion to Quash...** (`legacy-if-you-filed-a-motion-to-quash`, 4 products): _If you filed a motion to quash, or a Prejudgment Claim followed by a Motion to Quash, the landlord MIGHT file an opposition to it. Usually, they don't. The Moti_
  - **Undoing the Court's Mistakes** (`legacy-undoing-the-court-s-mistakes`, 10 products): _While we could like to believe that the Court is infallible, it is not. The machine entrusted with solving the problems of the rest of society is itself one of _
  - **Your First Papers to File** (`legacy-your-first-papers-to-file`, 7 products): _The Summons says that you have 5 calendar days from the date of service of it within which to file your "response." You may not have been served, but that doesn_
- **Legal Papers** (`legacy-legal-papers`, 32 products): _Save thousands in attorney fees while getting the best in professional legal help. This is no sloppy paralegal document service. These are attorney-drafted lega_
  - **Eviction Defense** (`legacy-eviction-defense`, 1 products): _Most caltenantlaw.com clients need help with an eviction. Through this system, you can get professionally prepared, legally correct paperwork at a fraction of t_
    - **Emergency Procedures** (`legacy-emergency-procedures`, 6 products): _Much as we'd like the judges and clerks to follow the law they are supposed to enforce, and much as we'd like the landlord's lawyers to act ethically and not at_
    - **Eviction - Basic Papers** (`legacy-eviction-basic-papers`, 8 products)
    - **Eviction - Discovery Phase** (`legacy-eviction-discovery-phase`, 0 products): _By the time you get to trial, your landlord will be so frustrated with how long this has taken and how expensive it has been, that he will be inclined to lie on_
      - **Discovery by them** (`legacy-discovery-by-them`, 3 products): _Since the landlord wants to speed the case along to trial, and minimize his expenses in doing so, it is unusual that the landlord conducts discovery, which can _
      - **Forcing them to Respond** (`legacy-forcing-them-to-respond`, 4 products): _Usually, the landlord does not just answer as they should, but makes multiple, repeated objections to each and every question and request that you make, just to_
      - **Our discovery sent to them** (`legacy-our-discovery-sent-to-them`, 5 products): _Here is the basic set of our discovery sent to them.  The basic kinds of discovery are form interrogatories and special interrogatories [questions you ask them _
    - **Eviction - Special Procedures** (`legacy-eviction-special-procedures`, 3 products): _There are special procedures which may be available in your case, depending on the circumstances.  Included in this categor are the Petition for Writ of Mandate_
    - **Eviction Trial Preparation** (`legacy-eviction-trial-preparation`, 8 products): _You've never done this before, and it all looks a bit scary. Relax. You just need to know what happens, and what to do. Your landlord is expecting you to be int_
- **Sue Your Landlord** (`legacy-sue-your-landlord`, 10 products): _You tried to be nice, fair, and reasonable, but noooo, the landlord was not on that page. He sees himself as the landLORD, and you'd just better do what he says_

## Changes vs the indexed reconstruction (docs/reference/firm-site-digest.md of 2026-09-18, pre-scrape)

The reconstruction listed 34 SKUs from search snippets, 10 of them with no price. The live store has 96 products (95 visible + item 316 in a hidden category) and every one has a price or is free.

**Repriced / corrected**
- 040 Basic Eviction Defense Kit: "~$20 [u]" -> **$20** confirmed.
- 045 Security Deposit Recovery Kit: n/a -> **$50**.
- 110 Simple Letter to Landlord: n/a -> **$300** (and a new 111 Complex Letter, $600).
- 206 Motion for Relief from Default: n/a -> **$330 minimum**; 207 Motion to Vacate (new to us) **$350 minimum**.
- 252 Request for Production: n/a -> **$200**.
- 270 Reviewing and Advising on Discovery: n/a -> **$300** (2 hours).
- 299 Ex Parte to Continue Trial: n/a -> **$200**.
- 300 Responses to their Discovery: n/a -> **$400 per item, minimum**.
- 501 Settlement Agreement Drafting: n/a -> **$200**.
- 520 Motion for New Trial: n/a -> **$300** (it sits in Trial Preparation, not Judgment).
- 610 Stay Pending Appeal: n/a -> **$600 minimum**.
- 705 Drafting Complaint: "$900 (> 3 causes $1,500)" -> **$900 simple**, separate **706 complex $1,500**.
- 002 Game Board: "PDF free; poster mailed" -> **002 free PDF**, **21 poster $20**, **22 11x17 $10** (new SKUs).
- 800-806 "top-ups $50-$500" -> **800-810 and 820: $50, $100, $200, $300, $400, $500, $600, $700, $800, $900, $1,000, $2,000**.
- Game Board SKU listed as "002" and poster as one item; the store separates them (above).

**Added (not in the reconstruction)**: free items 001 Habitability Worksheet, 010 Prejudgment Claim, 015 UD Form Interrogatories, 020 UD Answer form; Extra Services 65 Fax/E-filing/Process Service arranging ($125 min.), 75 Email Communications ($240 deposit), 80 CMC Statement ($100); consultations 103 "I just got this paperwork. Now what?" ($100), 104 Situation Evaluation ($200), 105 Case Evaluation ($400), 106 Quick Question ($50), 111 Complex Letter ($600); 140 Changes in Paperwork ($75); 155 Removal to Federal Court ($600); 161 Reply to Opposition to Writ Petition ($300); 207 Motion to Vacate ($350 min.); discovery 250 Trio Package ($600), 251 RFAs + Form Interrogatories ($400), 253 UD Form Interrogatories ($100), 254 Special Interrogatories ($150), 280 Meet and Confer Letter ($500), 290 Motion to Compel, no response ($300 per item), 296 Reply on Motion to Compel ($400 min.), 311 Response to their Meet and Confer ($300), 315 Opposition to their Motion to Compel ($400 per motion), 316 Motion to Compel, evasive responses ($800 per motion, hidden category), 330 Deposition Preparation ($165), 340 Lifeline Court or Deposition ($200); demurrer family 373 Reply to Opposition ($300), 374 Opposition to Shortening Time ($100), 376 Demurrer Meet and Confer ($300), 377 Demurrer Opposition ($500 min.), 380 Motion to Strike ($330), 385 Motion to Strike Opposition ($400), 390 Opposition to SLAPP Motion ($600); trial 465 Formatting Jury Instructions ($600), 475 Eviction Trial Preparation ($330), 490 Opening Statement ($330); 500 Talk to the Other Lawyer ($165), 505 Motion to Seal Case ($165); appeal 600 Appeal Package ($500), 605 Statement on Appeal responses ($165), 620 Motion to Augment Record ($330), 630 Opening Brief extension ($165), 650 Opening Brief ($1,100 min.), 660 Review Responsive Brief ($500 min.), 670 Reply Brief ($850 min.); 901 Petition for Writ of Mandate, Judge/Commissioner ($400); Legal Ethics Musical double CD ($15) and free MP3.

**Removed / not found**: nothing the reconstruction priced is missing; the reconstruction's "Their Discovery to You" category is the store's "Discovery – by Them"; "Schedule a Consultation" is "Request a Consultation" (Ecwid: "Scheduled Consultation"); the legacy `/LegalServices.htm` entry is gone (404).

**Unchanged and confirmed**: 041 $100, 042 $120, 050 $100, 101 $165, 102 $165, 150 $250, 151 $350, 160 $600, 170 $900, 200 $200, 201 $500, 205 $175 (min.), 370 $500, 400 $250, 425 $600 (min.), 450 $330 (min.), 460 $660, 461 $330 per instruction, 510 $165; rates $165 / 30 min, $330 / h, $60 per 10 min hotline.

**Wording to confirm with the firm**: 373 says "the minimum for the Reply is $200" but is posted at $300; 400 and the free UD Answer copy still say the Answer is due "within 5 days" (AB 2347 made it 10 court days from 2025-01-01; the Game Board page says 10 days); 206 says "within 5 days of when the process server CLAIMS"; 505 refers to "the law changed in 2017" (masking); 155 still describes the CARES Act / CDC moratorium as if live.

## How CTL OS reads this file (0.1.1, D-040..D-042)

`src/data/seed/catalog.ts` seeds `service_categories` and `services` straight from `docs/data/services-catalog.json`; nothing is retyped. Field by field: `categories[]` -> one row each, the 20 `visible: true` rows as the `/store` menu (`sort_order` = `order`, `store_description`, `ecwid_name`, `store_url`, `ecwid_category_id`) and the 28 `visible: false` rows as the hidden legacy stage tree (`hidden: true`, `parent_id`, `path` built from the labels, `sort_order` in the order the old navigation used); `services[]` -> one row each keyed by `sku` (`title`, `store_title`, `store_order` = `order`, `stage_node_ids`, `phase` (already a board phase id), `price_cents` / `price_note` / `unit`, `deliverable`, `what_you_get`, `prerequisites`, `turnaround_note`, `not_included`, `time_expectation`, `client_inputs` (the scrape's sentence as a one-item list; `[]` for a free download; null when the description says nothing), `deliverable_format`, `source_urls`, `image` -> `image_url`, `ecwid_product_id`, `scraped_at`, `evidence: scraped-live`, `verified: false`); `store_paths` are kept and every multi-segment path's last label resolves to a hidden category, giving `legacy_category_ids` (57 products sit in the stage tree, 41 only in the menu). The firm's own product and category icons come from `docs/data/illustrations.json` (`service:<sku>`, `store-category:<slug>` or the Ecwid name's slug): 93 of 98 services and all 20 menu categories have one. The board cost bands (`board_node_meta.typical_cost_band`) are the min-max of the posted prices of the SKUs on each square: 45 of 88 squares. Every price badge reads "as listed on caltenantlaw.com on 2026-09-18 · unverified" until an attorney toggles `verified` in A-10; A-10's "reset from repo JSON" patches the editable fields back from this file (RULE-CATALOG-04). P-13 shows the menu tree by default and the hidden stage tree behind one switch (D-041).

## Resumen en español

Catálogo de servicios de California Tenant Law tomado en vivo del sitio el 2026-09-18: 96 productos de la tienda Ecwid (20 categorías en el orden del menú `/store`) más la línea directa ($60 por 10 minutos) y la tarifa por hora ($330). Cada fila tiene SKU, título, precio, unidad (fijo, mínimo, por pieza, depósito, gratis), entregable y nodos del tablero de desalojo. Ningún precio está verificado por un abogado todavía (`verified: false`).
