# 0001 - CTL OS brief (California Tenant Law operations system)

- Source: Slack #cal-tenant-law thread https://playsetllc.slack.com/archives/C0C3RTXCCEL/p1789750827102799
- Date: 2026-09-18
- Requester: Justin Massion (owner)
- Attachment: `reference/game-board.pdf` ("Unlawful Detainer Game Board", caltenantlaw.com © 2021 Ken Carlson)
- Changelog: `docs/changelog/0001-discovery-and-plan.md`

## Prompt (verbatim)

caltenantlaw.com caltenantlaw.com/site-index caltenantlaw.com/pre-consultation-videos

This is an example of a target client that we can really do something amazing for as far as building them their whole operations system using our development methodology. As always this relates to:
• front desk
• owner experience
• customer experience
• marketing engine
• operations manual for the company
• the experience that the lawyers have
• their assistants have
• even the experience for opposition lawyers
• of course the customer experience
What's special about this company is they use a game board metaphor and actually have drawn a game board, which we can turn into something more three-dimensional and more complete. Where we can really help is in identifying document templates at every stage, tracking deadlines, cases, assignments, anything that's running late, and anything where the lawyers need help because they might be running late. Discovery in particular is a big issue that we can help to solve for. That includes:
• gathering documents from people, from customers
• connecting things like their email and their text messages for evidence
• helping the customers to keep track of all their documents and essentially their binder
• knowing what to pay for next
• being able to actually estimate the roadmap of costs over time and see a calendar of potential costs depending on what happens according to the game board experience (if this, then that, that type of scenario throughout legal procedure)
• building the timeline of events
• all the people involved
• all of that stuff
Of note, scheduling calls, video calls, recording those, and getting the AI summaries is all part of this. This also includes the learning management system behind knowing what a customer has and has not watched from the list of videos, list of educational materials, and so on (so that we're basically providing content to the customer throughout their journey and knowing what they have or have not learned)

Notice our list of best practices for setting up a new clinet and development system for full featured operations system design  our rules for development. imagine-os.github.io/claude-tag-portfolio

 we will redesign their frontend website and purchasing experience and all that: the aspect of what happens when they log in and all the project management, whether it's a front desk owner, lawyer, assistant, customer, opposition, etc

• Development documentation, change logs, memory context, etc.
• Legal documentation and memory for all related legal information that should be placed into context and be up to date, being very important for all California tenant law and related topics. It should also be clear on what changes to the laws have been made in order to double-check that we're using the latest laws and not accidentally thinking that something is an older process.
• Document management, document creation: right now they're using WordPerfect for pleading paper and it's terrible. We definitely need a better pleading paper system, multi-editor, like Google Docs or Google Drive.
• I'm going to need a really good way to present everything we build in a demo simulator for mobile and for desktop.
• Separately we'll also want a canvas where we can open all the individual pages and lay them out to see all the working software laid out. We can actually be able to zoom in and use any page from the dashboard or mobile experience from a canvas rather than only seeing one page at a time. That's a great feature.
• Of course we need to be able to, from the hub, choose who we're logging in as to see the experience from any individual that works within the platform.
• Turn on and off developer mode, for instance, so that if I'm in developer mode I can see the specs for every single individual page that I'm looking at and so on.
• Again, design system, component library, document templates, all that stuff needs to be really, really well managed here.
• Additionally assume that this could be installed on a Linux distro as an example and boot up directly into the software. This software has to be capable of doing every single thing that the company would need:
    ◦ video calls
    ◦ telephone calls
    ◦ emails
    ◦ text messages
    ◦ WhatsApp
    ◦ CRM
    ◦ project management
    ◦ contract signing
    ◦ drafting
    ◦ legal research
All those things, right? Soon we'll get into more advanced tools for that

imagine-os.github.io/claude-tag-portfolio  here is my portfolio with links to a bunch of different public repos that you can study off of, in particular looking at my rules and best practices on how I'm developing . Hoy os and petrock are good examples of how i'm using the hub that i mentioned for development and deliverable building for full system.

 use parallel agents smartly to speed up the development process and build very smart.

 build out your development plan with clarity on order of operations and more. You can even create a project management Kanban, a list view, and even something like a timeline view with dependencies. Keep in mind that we're not bound by normal days of development. It's only bound by how fast you finish each task and then start the next dependency, with clarity on what model you're using and anything else.

For each task of the entire process to finish it up: building a really really great project management viewer system based on all the different moving parts, deliverables, dependencies, order of operations, etc. (with the idea that we will need more passes in the future to make things better and better and then polish and make sure that everything is complete and done). and Wow.

 make this incredibly user-friendly. And a great experience for anyone who's using it

imagine-os.github.io/graph-gallery also in addtiion, the Objects 3D map, and other maps from this library can be useful. lanes skill-tree and radial tree are good too. I always like Objevt views so that its more clear what each node actually is based on its icon or preview of what it is.

In terms of the proposal to the customer on why they should work with us, and what we're building. This view will show just how deeply and fully we've thought through the full stack  Full service, multidepartment, multi feature system required that they literally could stop paying for every other piece of software and even service provider and use us instead to have their fully complete Operations System CTL OS

github.com/imagine-os/cal-tenant-law is a new repo for you to use. with source set to github actions for hsoting on pages.

Reference but dont actually use the company os repo github.com/Playset-LLC/Company-OS because eventually we will likely use that as our backend system. so you can see some best practices there related to DB and such.

Assume Supabase DB and Auth will be used later. Stripe for payments & Payroll, and the rest we can figure out later.
(attachment: game-board.pdf — "Unlawful Detainer Game Board", caltenantlaw.com ©2021 Ken Carlson)

## Response

Pass 0 (discovery and plan), Fable 5.1, 2026-09-18:

- Studied the reference repos (hoy, petrock, graph-gallery, portfolio; Company-OS through petrock's digest) and wrote the conventions we adopt into `docs/reference/hoy-petrock-patterns.md`, `graph-gallery-views.md`, `company-os.md`.
- Researched the firm from indexed copy (the site itself is unreachable from the build environment) into `docs/reference/firm-site-digest.md` and organised the brief in `docs/project-brief.md` with an explicit "unverified / needs Justin or the firm" list.
- Extracted the Unlawful Detainer Game Board into data: `docs/game-board/nodes.json` (10 phases, every node label from the PDF, edges typed by the board's five path types) and `docs/game-board/README.md`.
- Scaffolded the legal memory: `docs/legal/` with a statute index (every row `verified_on: null`), a law-change log and one topic file per practice area, with 2026 currency flags (AB 2347, AB 12, AB 1482 sunset, repair-and-deduct wording, deposit penalty multiple).
- Wrote the binding platform principles (P-01..P-15 adapted to a law firm), the decision log (D-001..), the order of operations in `docs/build-plan.md` (Passes 0-5) and the same tasks as `docs/plan/tasks.json` (the seed for the PM viewer at `/#/plan`), mirrored in `docs/kanban.md`.
- Started the ops manual (`docs/ops-manual/`, en/es, parts I-IX) and the changelog (`docs/changelog/0001-discovery-and-plan.md`).
- The foundation (Pass 1: scaffold, tokens, library, registry, actions bus, roles, data provider, i18n, Placeholder, annotations, dev tools, Pages CI) is being built by a parallel worker in the same turn.

(final reply appended at end of pass)
