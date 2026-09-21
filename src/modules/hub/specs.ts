import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

export const hubSpec = defineSpec({
  code: 'HUB-01', name: 'Testing hub',
  purpose: 'First screen for the team: open any surface family as the right demo role, switch demo user and view-as, toggle language, brand, theme and the builder tool; see the counts of what the system holds. Not customer-facing.',
  layout: ['HubHeader (BrandMark lockup, LangToggle, visual-direction SegmentedControl Clear sky / Board game / Courthouse, theme, dev mode) on the hero band', 'Hero (eyebrow, display title, promise, tagline, clearing-sky art, floating session bar with RoleSwitcher)', 'Start here: three primary buttons (attorney -> the document pipeline, front desk -> take a call, client -> my orders), each entering as that role', 'Run the firm: attorneys, paralegals & assistants, front desk, owner, admin & settings', 'Clients: client app (phone preview, feature card), public site & store, game board, learning', 'Build & review: plan, proposal, canvas, demo simulator, docs, ops manual, legal memory, dev tools, role matrix', 'Visual explorations (prompt 0007): external concept sites from docs/data/visual-explorations.json, each opening in a new tab with an External chip', 'Outside parties & marketing: opposing-counsel portal, marketing engine', 'Footer stat strip (routes, built, tables, rules, components, actions, plan tasks done)'],
  data: ['users', 'tenants', 'orders', 'calls', 'follow_ups', 'client_requests'], roles: EVERYONE,
  logic: ['Order of the page is what the firm owner cares about (prompt 0006): run the firm, then clients, then build & review, then outside parties. The opposing-counsel portal is last, not near the top.',
    'Entering a surface calls switchUser(role) then navigates to ROLE_HOME[role] or the family home path.',
    'A card only advertises pages its role can open: the entry list is getRoutes() filtered by roles.includes(role) and a nav entry, the family\'s own surface first, then the other menu groups in menu order, six shown and "+N more" opening the shell (parameterised routes stay out; they are reached from a list).',
    'Each card carries a one-line "what this role does" and, where the pipeline tables make it cheap, a live count: attorneys see orders waiting on a client, paralegals orders on them, the front desk calls to return and open follow-ups, the client app the requests waiting on the demo tenant. Counts come through useTable, so they move with the data.',
    'Start here links to /counsel/pipeline, /desk/calls and /app/orders as attorney, front desk and client. A path with no route yet is a Placeholder with the module that will build it, and becomes a live button the moment that module registers the route.', 'Each card carries a live preview of its home page running as that family’s demo role: an iframe whose hash carries ?as=&dev=&lang=&theme= (src/modules/showcase/frameSession.ts applies it inside the frame only, so the preview never changes your own session).', 'Previews load only when they scroll into view (IntersectionObserver) and at most six are live at once; inside a frame the hub shows the drawn phone / a static icon instead, so frames never nest.', 'Status chips (built / in progress / planned) come from the route manifest: a path with no route yet is a Placeholder, not a dead link.', 'Dev toggle renders only for super_admin; theme, brand and language persist in localStorage (ctl.theme carries theme and brand, ctl.lang the language); `?brand=clearsky|boardgame|courthouse` on the hash sets the direction on load (same seam as ?theme=). The hero art follows the direction (sky / board / ledger). Developer codes render only in dev mode.', 'Counts come from getRoutes(), tables, rules, componentLibrary, listActions() and docs/plan/tasks.json (imported as JSON).', 'Visual explorations (D-053) are rows of docs/data/visual-explorations.json imported at build time: title, author, date and note on a card, a link with target=_blank and rel=noopener noreferrer, an external-link icon and an External chip; hub.openVisualExploration(id) opens the same URL. Nothing in that file is part of the build.'],
  integrations: [], components: ['Card', 'Button', 'Toggle', 'RoleSwitcher', 'LangToggle', 'SegmentedControl', 'Badge', 'Icon', 'IconButton', 'Kbd', 'Tooltip', 'Placeholder', 'BrandMark', 'BrandArt', 'PhoneFrame', 'DeviceFrame'],
  actions: [
    { id: 'hub.enterAs', label: 'Enter as', intent: 'open a surface as its demo role', params: { surface: 'enum:counsel,assist,desk,owner,admin,app,site,board,learn,opposition,marketing,plan,manual,docs,dev', role: 'enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public' } },
    { id: 'hub.openRoleSurface', label: 'Open a page as a role', intent: 'open one page of a role\'s workspace as that role', params: { role: 'enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public', path: 'string' } },
    { id: 'hub.startHere', label: 'Start here', intent: 'start one of the three walkthroughs on the hub', params: { flow: 'enum:pipeline,calls,orders' } },
    { id: 'hub.openCanvas', label: 'Canvas', intent: 'open the canvas with every page laid out' },
    { id: 'hub.openSimulator', label: 'Demo simulator', intent: 'open the demo simulator' },
    { id: 'hub.openTool', label: 'Open tool', intent: 'open one of the testing-hub tools', params: { tool: 'enum:plan,proposal,canvas,simulator,docs,manual,legal,dev,roles' } },
    { id: 'hub.openVisualExploration', label: 'Open a visual exploration', intent: 'open one of the external visual-exploration sites in a new tab (labelled external; not part of CTL OS)', params: { id: 'string' } },
    { id: 'hub.toggleDevMode', label: 'Builder tool', intent: 'turn the builder tool (dev mode) on or off', permission: 'dev.tools' },
    { id: 'hub.setLang', label: 'Language', intent: 'switch the interface language', params: { lang: 'enum:en,es' } },
    { id: 'hub.toggleTheme', label: 'Theme', intent: 'switch between light and dark' },
    { id: 'hub.setBrand', label: 'Visual direction', intent: 'switch the visual direction (clear sky, board game or courthouse)', params: { brand: 'enum:clearsky,boardgame,courthouse' } },
    { id: 'hub.cycleBrand', label: 'Brand', intent: 'cycle the brand palette' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'dev mode on', 'viewing as another role', 'Spanish', 'previews loading', 'inside a frame (static previews)', 'a start-here page not built yet (Placeholder)', 'a role with no extra surfaces yet (no entry list)'],
  notes: ['prompt 0007 (T-138, 2026-09-20): Visual explorations group after Build & review, items from docs/data/visual-explorations.json.', 'pass 2 wave A (T-123, prompt 0006): order by what the owner cares about, per-role entry lists from the manifest, one-line role purpose, live pipeline counts, the Start here row and the Build & review band. Earlier: hub module foundation base, design pass (ink hero, audience groups, medallions, stat strip; docs/design/design-system.md) and showcase enrichment (T-024: live role previews, testing-hub row, plan counts). Frame roles come from src/modules/showcase/frameSession.ts (D-21 / D-22 own it); no shared file is edited.'], checkedAt: CHECKED,
});

export const noAccessSpec = defineSpec({
  code: 'HUB-02', name: 'No access',
  purpose: 'Friendly page when the current role cannot open a route; offers the hub to switch demo user or the role home.',
  layout: ['EmptyState (icon, title, body with role and target route)', 'Actions (hub, my home)'], data: ['users'], roles: EVERYONE,
  logic: ['RequireRole redirects here with ?from=<path>.'], integrations: [], components: ['EmptyState', 'Button'],
  actions: [{ id: 'hub.goHome', label: 'Go to my home', intent: 'go to the home page of my current role' }],
  rules: ['RULE-SYS-01'], states: ['default'], checkedAt: CHECKED, notes: ['hub module (foundation)'],
});
