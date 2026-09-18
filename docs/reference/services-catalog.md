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

Order = the `/store` category menu. Ecwid names differ slightly where noted. Each row: SKU, title as posted, price, unit, deliverable (our one-line reading of the product description; the full text is in the JSON).

### 1. Request a Consultation  
Consultations, evaluations and letters: the entry point for new clients and the check-in for returning ones. Ecwid name "Scheduled Consultation". Store page: `/store/schedule-a-consultation`; board phase: `start`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 101 | Initial Consultation with Attorney | $165 | flat | 30-minute initial consultation by phone or Teams with Ken Carlson or an associate attorney: where you are, your rights, your goal, the plan. | start, eviction-notice-or-lease-ends |
| 102 | Follow-up Consultation | $165 | flat | Follow-up consultation for existing clients on what happened since and what to do next. | — |
| 103 | I just got this paperwork. Now what? | $100 | flat | Attorney reads and evaluates the paperwork you just received and tells you what it is, what to do and by when (information only). | process-server-tries-to-serve-you, evaluate-service |
| 104 | Situation Evaluation | $200 | flat | Situation Evaluation: attorney thinking time on one part of the case (paperwork review, research), results given in a separate consultation or hotline call. | — |
| 105 | Case Evaluation | $400 | flat | Case Evaluation: full step-back review of where the case is, what must be done and the plan; may take more than one unit. | — |
| 106 | Quick Question | $50 | flat | 5-minute consultation on something that needs no document review. | — |
| 110 | Simple Letter to Landlord | $300 | flat | Attorney-written letter to a landlord who has no lawyer, sent under your name, on one issue (deposit refund, stop entering, repairs, rent increase, threatened eviction). | eviction-notice-or-lease-ends |
| 111 | Complex Letter to the Landlord | $600 | flat | Complex letter to the landlord after consultation, document review and research, setting out your position and demands. | eviction-notice-or-lease-ends |
| HOTLINE | Legal Hotline (existing clients) | $60 | per_10min | Phone call with Ken during business hours on the hotline number 213 340 1090 (reserve a time first). | — |

### 2. Changes to Prepared Paperwork  
Amendments the court clerk or a change in your plans require (the firm's own mistakes are corrected free). Store page: `/store/changes-to-prepared-paperwork`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 140 | Changes in Paperwork | $75 | flat | About 15 minutes of changes to paperwork already prepared, when the clerk or your circumstances require them; the firm's own mistakes are fixed free. | — |

### 3. Motion to Quash  
Attacking bad service, removal to federal court and the petitions for writ of mandate that follow a wrong ruling. Store page: `/store/motion-to-quash`; board phase: `quash`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 150 | Normal Motion to Quash | $250 | flat | Normal Motion to Quash based on improper physical service of the summons and complaint; no court appearance; "an extra 3 weeks up front". | service-bad-file-motion-to-quash |
| 151 | Delta Motion to Quash | $350 | flat | "Delta" Motion to Quash attacking technical defects in the complaint that make the 5-day summons improper, even if service was good. | service-bad-file-motion-to-quash |
| 155 | Removal to Federal Court | $600 | flat | Notice of Removal to Federal District Court (federal question, e.g. PTFA / CARES Act), filed after the motion to quash phase; stops the UD until remand. | foreclosure-tenants-remove-to-federal-court |
| 160 | Petition for Writ of Mandate [Quash-Limited] | $600 | flat | Petition for Writ of Mandate to the Appellate Department (limited civil case) after an improper motion-to-quash ruling; "at least another 3 weeks". | petition-for-writ-of-mandate |
| 161 | Reply to Opposition to Petition for Writ of Mandate | $300 | flat | Reply when the landlord opposes your writ petition (usually about an hour of work). | petition-for-writ-of-mandate, writ-of-mandate-decision |
| 170 | Petition for Writ of Mandate [Quash - Unlimited] | $900 | flat | Petition for Writ of Mandate to the District Court of Appeal (unlimited civil case); substantially more work than the limited-case form. | petition-for-writ-of-mandate |

### 4. Default  
Un-losing: clerk mistakes, relief from default, motion to vacate, ex parte stay of the lockout. Store page: `/store/default`; board phase: `default`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 200 | Trying to correct the Court Clerk's Mistakes | $200 | flat | Attorney phone call to the clerk supervisor or court manager to undo a clerk's mistake (premature default, rejected filing, wrong calendar) without filing papers; "works about half the time". | default-entered-by-clerk, landlord-misleads-court-clerk |
| 201 | Default Relief motion  and Stay | $500 | flat | Package: ex parte stay to stop the lockout plus either the motion for relief from default (your fault) or the motion to vacate (clerk's fault). | motion-for-relief-from-default, motion-to-vacate, ex-parte-stay-application |
| 205 | Ex Parte Application for Stay and Shortening Time | $175 | minimum | Ex Parte Application for Stay of execution and Shortening Time so your default motion is heard before the Sheriff locks you out. | ex-parte-stay-application |
| 206 | Motion for Relief from Default -minimum charge | $330 | minimum | Motion for Relief from Default when the default was your fault (missed deadline, late to trial); about an hour of standard work. | motion-for-relief-from-default |
| 207 | Motion to Vacate -minimum charge | $350 | minimum | Motion to Vacate a default or order the court entered by mistake (clerk or judge error). | motion-to-vacate |

### 5. Discovery – by Us  
Our discovery to the landlord and the motions to make them answer. Store page: `/store/discovery-by-us`; board phase: `discovery`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 250 | Discovery: Trio Package | $600 | flat | Discovery Trio: Requests for Admission, Requests for Production and General Form Interrogatories (incl. 17.1) in one package. | discovery-requests |
| 251 | Discovery: Requests for Admission and Follow-up General Form Interrogatories | $400 | flat | Requests for Admission tailored to your case plus follow-up General Form Interrogatories (17.1). | discovery-requests |
| 252 | Request for Production | $200 | flat | Request for Production of documents and evidence from the landlord (lease papers, ledger, communications, deed, permits, photos, footage). | discovery-requests |
| 253 | Discovery: UD Form Interrogatories | $100 | flat | UD Form Interrogatories prepared for you (the bare-bones discovery). | discovery-requests |
| 254 | Discovery: Special Interrogatories | $150 | flat | Special Interrogatories written to your case's dates, events and people. | discovery-requests |
| 270 | Reviewing and Advising on Discovery | $300 | flat | 2 hours reviewing the discovery we sent, their responses and the next step; not the meet-and-confer letter or motion to compel. | good-responses, no-response-or-mostly-objections |
| 280 | Discovery: Meet and Confer Letter - Evasive Responses | $500 | minimum | Written meet-and-confer letter answering evasive responses and objections item by item (about an hour; more if complex). | meet-and-confer-attempt |
| 290 | Discovery: Motion to Compel - No Response Received | $300 | per_item | Motion to Compel when no response at all was received: one motion per discovery item (trio with no answers = 3 motions, $900). | motion-to-compel-and-postpone-trial |
| 296 | Discovery: Our Reply to their Opposition to our Motion to Compel -minimum charge | $400 | minimum | Our Reply to the landlord's opposition to our motion to compel. | opposition-to-motion-to-compel, motion-to-compel-hearing |
| 299 | Discovery: Ex Parte Application to Continue the Trial and advance Motion to Compel | $200 | flat | Ex Parte Application to continue the trial and advance the motion to compel when trial is coming too fast. | motion-to-compel-and-postpone-trial, trial-set-by-clerk |
| 316 | Motion to Compel - Objections and Evasive Responses -minimum charge | $800 | per_item | Motion to Compel further responses when the landlord answered with objections and evasions; includes the Separate Statement; per motion ($800 each). | motion-to-compel-and-postpone-trial |

### 6. Discovery – by Them  
Responding to the landlord's discovery, meet-and-confer letters, motions to compel, deposition help. Store page: `/store/discovery-by-them`; board phase: `discovery`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 300 | Discovery: Responses to their Discovery | $400 | per_item | Responses to the landlord's discovery, per item: evaluate, object, gather your information, write the response under oath. | — |
| 311 | Discovery: Our Response to their Meet and Confer letter | $300 | flat | Our response to the landlord's meet-and-confer letter about your discovery responses. | — |
| 315 | Discovery: Opposition to their Motion to Compel | $400 | per_item | Opposition to the landlord's motion to compel your responses, per motion. | — |
| 330 | Deposition Preparation | $165 | flat | Half-hour preparation for your deposition: the process, how to answer, how to handle questions. | — |
| 340 | Lifeline Court or Deposition | $200 | flat | "Lifeline": your assigned lawyer on call by phone during a hearing, trial or deposition, up to 1/2 hour. | trial |

### 7. Demurrer  
Attacking the complaint itself; also the demurrer / motion-to-strike / SLAPP oppositions when the tenant is the plaintiff. Store page: `/store/demurrer`; board phase: `demurrer`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 370 | Demurrer to the Complaint | $500 | flat | Demurrer to the Complaint attacking its defects; hearing about a month out; "about 6 weeks more" of time; no attendance needed. | demurrer |
| 373 | Reply to Opposition to Demurrer | $300 | minimum | Reply to the landlord's opposition to your demurrer (optional but often helpful). | our-reply-to-opposition |
| 374 | Opposition to Shortening Time for Demurrer | $100 | flat | Emergency opposition to the landlord's ex parte application to shorten time on the demurrer hearing. | our-opposition-to-ex-parte-app, ex-parte-hearing |
| 376 | Demurrer Meet and Confer | $300 | flat | When you are the plaintiff: our reply to the landlord's pre-demurrer meet-and-confer letter. | you-stay-and-sue |
| 377 | Demurrer Opposition - Min. Charge | $500 | minimum | When you are the plaintiff: opposition to the landlord's demurrer to your complaint. | you-stay-and-sue |
| 380 | Motion to Strike | $330 | flat | Motion to Strike improper parts of the complaint, filed and heard with the demurrer. | demurrer |
| 385 | Motion to Strike Opposition | $400 | flat | When you are the plaintiff: opposition to the landlord's motion to strike (punitive damages, attorney fees). | you-stay-and-sue |
| 390 | Opposition to SLAPP Motion | $600 | flat | Opposition to the anti-SLAPP motion the landlord's lawyer files when you sue for malicious prosecution. | you-stay-and-sue |

### 8. Answer  
The Answer to the unlawful detainer complaint with affirmative defenses and the jury demand. Store page: `/store/answer`; board phase: `demurrer`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 400 | Answer to Unlawful Detainer Complaint | $250 | flat | Answer to the Unlawful Detainer Complaint with affirmative defenses, after a brief discussion with the attorney. | answer-to-complaint |

### 9. Trial Preparation  
Summary judgment, court appearance, jury trial documents, instructions, trial coaching, motion for new trial. Store page: `/store/trial-preparation`; board phase: `trial`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 425 | Motion for Summary Judgment [minimum] | $600 | minimum | Tenant's Motion for Summary Judgment after the Answer, when one defense is clear; also forces the landlord to show the evidence they hid in discovery. | summary-judgment-hearing |
| 450 | Court Appearance -minimum | $330 | minimum | Attorney appears for you at a hearing (substitutes in and out), billed at $330/hour with a one-hour minimum; not trials or depositions. | motion-to-quash-hearing, demurrer-hearing, ex-parte-and-motion-hearings, motion-to-compel-hearing, summary-judgment-hearing, pretrial-conferences |
| 460 | Trial: Initial Jury Trial Documents | $660 | flat | The four jury trial documents for the Final Status Conference: witness list, exhibit list, statement to the jury, proposed form jury instructions (plus existing special instructions). | prepare-jury-trial-papers, pretrial-conferences |
| 461 | Trial: Unique Jury Instructions - Per Instruction | $330 | per_item | Unique (non-CACI) jury instruction researched and drafted for your case, per instruction; not charged if one already exists. | pretrial-conferences |
| 465 | Trial: Formatting Jury Instructions | $600 | flat | Converting the CACI instructions into the format a judge requires (about 2 hours). | pretrial-conferences |
| 475 | Eviction Trial Preparation | $330 | flat | One-hour trial preparation consultation: what to say, what to do, how to present and handle questions. | prepare-jury-trial-papers |
| 490 | Trial: Your Opening Statement to the Jury | $330 | flat | Your opening statement to the jury, written for you to read. | trial |
| 520 | Motion for New Trial | $300 | flat | Motion for New Trial when something went badly wrong at trial, usually with an ex parte to stop the lockout. | you-lose |

### 10. Settling and Negotiation  
Talking to the other lawyer, drafting the settlement, sealing the case. Store page: `/store/settling-and-negotiation`; board phase: `outcomes`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 500 | Talk to the Other Lawyer | $165 | flat | Ken talks to the landlord's lawyer (settlement, meet and confer, vacating a default): 1/2 hour total including reporting back. | settlement-you-set-the-terms, meet-and-confer-attempt |
| 501 | Settlement Agreement Drafting | $200 | flat | Final drafting and review of the settlement agreement (day of trial or earlier). | settlement-you-set-the-terms |
| 505 | Motion to Seal Case | $165 | flat | Motion to Seal the eviction case record (less needed since the 2017 masking law, still needed after a judgment). | case-dismissed-by-landlord, settlement-you-set-the-terms |

### 11. Judgment  
After you win: costs and attorney fees. Store page: `/store/judgment`; board phase: `trial`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 510 | Cost Memorandum / Attorney Fees Motion | $165 | flat | Cost memorandum and motion for attorney fees after you win. | you-win |

### 12. Appeal  
Notice of appeal through reply brief, stay pending appeal, augmenting the record. Store page: `/store/appeal`; board phase: `appeal`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 600 | Appeal Package | $500 | flat | Appeal Package: Notice of Appeal, request for clerk's transcript, Statement on Appeal (or reporter's transcript request). | notice-of-appeal |
| 605 | Responses to Opposition or Order as to Statement on Appeal | $165 | flat | Response to the landlord's proposed changes or the judge's engrossed Statement on Appeal. | notice-of-appeal |
| 610 | Appeal: Stay Pending Appeal [minimum] | $600 | minimum | Two motions: petition for stay to the trial judge, then Petition for Writ of Supersedeas to the appellate court to stop the lockout pending appeal. | request-stay-pending-appeal-trial-court, request-stay-pending-appeal-appeals-court |
| 620 | Appeal: Motion to Augment Record | $330 | flat | Motion to Augment the record on appeal with documents the clerk left out. | notice-of-appeal |
| 630 | Opening Brief - Request for Extension of Time | $165 | flat | Request for extension of time to file the opening brief (usually 30 days granted). | your-opening-brief |
| 650 | Opening Brief on Appeal - Minimum Charge | $1,100 | minimum | Opening Brief on appeal: the "trial of the trial", with record and authority citations. | your-opening-brief |
| 660 | Review and Evaluate Responsive Brief | $500 | minimum | Review and evaluation of the landlord's responsive brief with a report to you on whether to reply. | landlords-responsive-brief-filed |
| 670 | Reply Brief on Appeal - Minimum Charge | $850 | minimum | Reply Brief on appeal. | your-reply-brief |

### 13. Suing the Landlord  
Drafting the complaint or cross-complaint against the landlord. Store page: `/store/suing-the-landlord`; board phase: `outcomes`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 705 | Drafting Complaint [simple] | $900 | flat | Complaint or cross-complaint against the landlord on pleading paper, up to 3 causes of action, with Summons and Civil Case Cover Sheet. | you-stay-and-sue |
| 706 | Drafting Complaint [complex] | $1,500 | flat | Complex complaint or cross-complaint (more than 3 causes of action) with Summons and Civil Case Cover Sheet. | you-stay-and-sue |

### 14. Miscellaneous / Supplemental  
Supplemental payments ($50 to $2,000) for work beyond a minimum charge. Store page: `/store/miscellaneous-supplemental`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 800 | Supplemental Payment - $50 | $50 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 801 | Supplemental Payment - $100 | $100 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 802 | Supplemental Payment - $200 | $200 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 803 | Supplemental Payment - $300 | $300 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 804 | Supplemental Payment - $400 | $400 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 805 | Supplemental Payment - $500 | $500 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 806 | Supplemental Payment - $600 | $600 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 807 | Supplemental Payment - $700 | $700 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 808 | Supplemental Payment - $800 | $800 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 809 | Supplemental Payment - $900 | $900 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 810 | Supplemental Payment - $1,000 | $1,000 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| 820 | Supplemental Payment - $2000 | $2,000 | deposit | Supplemental payment toward work beyond a minimum charge, as instructed by your attorney (e.g. "Letter to lawyer", "Review photos"). | — |
| HOURLY | Attorney time beyond a set price | $330 | per_hour | Attorney time at $330 per hour. | — |

### 15. Game Board  
The Unlawful Detainer Game Board: free PDF, mailed poster, 11x17 print. Ecwid name "Unlawful Detainer Game Board". Store page: `/store/game-board`; board phase: `start`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 002 | Eviction "Game Board" | free | free | The Unlawful Detainer Game Board as a free PDF download. | start |
| 0021 | Unlawful Detainer Game Board Poster | $20 | flat | Printed Unlawful Detainer Game Board poster, mailed. | start |
| 0022 | Unlawful Detainer Game Board  11X17 | $10 | flat | Unlawful Detainer Game Board printed at 11x17. | start |

### 16. Legal Kits  
Downloadable e-book kits: eviction defense, trial, deposit recovery, breaking a lease. Store page: `/store/legal-kits`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 040 | Basic Eviction Defense Kit | $20 | flat | 43-page e-book (PDF): step-by-step Answer, Answer form, proof of service, form interrogatories, fee waiver, habitability checklist, prejudgment claim. | answer-to-complaint, discovery-requests, unnamed-tenants-prejudgement-claim |
| 041 | Eviction Trial Kit | $100 | flat | Eviction Trial Kit (PDF): how to prepare and try a UD jury trial yourself: exhibits, witnesses, papers, presentation. | prepare-jury-trial-papers |
| 042 | Deluxe Eviction Defense Kit | $120 | flat | 74-page e-book (PDF) combining the Basic Eviction Defense Kit and the Eviction Trial Kit. | answer-to-complaint, discovery-requests, prepare-jury-trial-papers |
| 045 | Security Deposit Recovery Kit | $50 | flat | Security Deposit Recovery Kit (PDF): small claims form, instructions, the law, presentation and collection advice; goal "3 times the amount of the deposit". | — |
| 050 | Break Your Lease Kit | $100 | flat | Break Your Lease Kit (PDF): instructions, forms and sample letters to end a lease legally or minimise liability. | — |

### 17. Judges Gone Wild  
Petition for writ of mandate when a judge or commissioner rules after being excluded. Store page: `/store/judges-gone-wild`; board phase: `removal`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 901 | Petition for Writ of Mandate - Judge/Commissioner | $400 | flat | Petition for Writ of Mandate when a commissioner, judge pro tem or excluded judge (CCP 170.6) ruled anyway; usually granted; can delay the case 2-4 months. | petition-for-writ-of-mandate |

### 18. Extra Services  
Filing arrangement, email communications deposit, CMC statement. Store page: `/store/extra-services`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 065 | Fax filing, E-filing, and Process Service arranging | $125 | minimum | Attorney time to arrange fax filing, e-filing or a courier for your court papers (minimum charge; fees not included). | — |
| 75 | Email Mail Communications | $240 | deposit | Deposit for email communications: $60 per email, covers 4 paired emails (your question + the attorney's answer). | — |
| 80 | CMC Statement | $100 | flat | Case Management Conference Statement prepared by the firm; you file the original, we serve the lawyer. | you-stay-and-sue |

### 19. Free  
Free forms: habitability worksheet, prejudgment claim, UD form interrogatories, UD Answer form. Ecwid name "Free Resources". Store page: `/store/free-resources`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 001 | Habitability Worksheet | free | free | Habitability Worksheet (PDF checklist of defects) for repair-and-deduct, code complaints, lawsuits and eviction defenses. | answer-to-complaint, you-stay-and-sue |
| 010 | Prejudgment Claim of Right to Possession | free | free | Blank Prejudgment Claim of Right to Possession form for occupants not named in the complaint. | unnamed-tenants-prejudgement-claim |
| 015 | Unlawful Detainer Form Interrogatories | free | free | Blank Unlawful Detainer Form Interrogatories, pre-checked, to mail to the landlord's attorney. | discovery-requests |
| 020 | UD Answer - Just the Form | free | free | The official UD Answer form (Oct 2020 version) as a download; "NOT the form to file first" if you want time. | answer-to-complaint |

### 20. Legal Ethics  
Ken Carlson's Legal Ethics musical: double CD ($15) and free MP3 download. Ecwid name "Legal Ethics". Store page: `/store/legal-ethics-musical`; board phase: `None`.

| SKU | Item | Price | Unit | Deliverable | Board nodes |
| --- | --- | --- | --- | --- | --- |
| 900 | Legal Ethics Musical - Double CD | $15 | flat | Legal Ethics musical, 95-minute audio production on a double CD, mailed USPS first class. | — |

## The firm's own stage hierarchy (hidden Ecwid categories)

Products are still attached to an older, stage-based navigation that the `/store` menu no longer shows. It is the firm's own mapping of services to eviction stages and is kept in the JSON as `store_paths` / `legacy_store_hierarchy`:

- Answer
- Appeal
- Changes to Prepared Paperwork
- Default
- Demurrer
- Discovery - by Them
- Discovery - by Us
- Extra Services
- Free Resources
- Judges Gone Wild
- Judgment
- Legal Ethics
- Legal Kits
- Miscellaneous / Supplemental
- Motion to Quash
- Paid Legal Services > Consultation > Emergency Information Needed
- Paid Legal Services > Consultation > Scheduled Consultation
- Paid Legal Services > I'm Being Evicted... > Appeal
- Paid Legal Services > I'm Being Evicted... > Emergency! Emergency!
- Paid Legal Services > I'm Being Evicted... > Heading to Trial
- Paid Legal Services > I'm Being Evicted... > Start Here
- Paid Legal Services > I'm Being Evicted... > The Discovery Phase > Making Them Answer
- Paid Legal Services > I'm Being Evicted... > The Discovery Phase > The Basic Discovery Package
- Paid Legal Services > I'm Being Evicted... > The Discovery Phase > Their Discovery to You
- Paid Legal Services > I'm Being Evicted... > The Empire Strikes Back > If you filed a Demurrer...
- Paid Legal Services > I'm Being Evicted... > The Empire Strikes Back > If you filed a Motion to Quash...
- Paid Legal Services > I'm Being Evicted... > Undoing the Court's Mistakes
- Paid Legal Services > I'm Being Evicted... > Your First Papers to File
- Paid Legal Services > Legal Papers
- Paid Legal Services > Legal Papers > Eviction Defense
- Paid Legal Services > Legal Papers > Eviction Defense > Emergency Procedures
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction - Basic Papers
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction - Discovery Phase > Discovery by them
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction - Discovery Phase > Forcing them to Respond
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction - Discovery Phase > Our discovery sent to them
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction - Special Procedures
- Paid Legal Services > Legal Papers > Eviction Defense > Eviction Trial Preparation
- Paid Legal Services > Sue Your Landlord
- Scheduled Consultation
- Settling and Negotiation
- Suing the Landlord
- Trial Preparation
- Unlawful Detainer Game Board

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

## Resumen en español

Catálogo de servicios de California Tenant Law tomado en vivo del sitio el 2026-09-18: 96 productos de la tienda Ecwid (20 categorías en el orden del menú `/store`) más la línea directa ($60 por 10 minutos) y la tarifa por hora ($330). Cada fila tiene SKU, título, precio, unidad (fijo, mínimo, por pieza, depósito, gratis), entregable y nodos del tablero de desalojo. Ningún precio está verificado por un abogado todavía (`verified: false`).
