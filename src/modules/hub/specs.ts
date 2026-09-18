import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

export const hubSpec = defineSpec({
  code: 'HUB-01', name: 'Testing hub',
  purpose: 'First screen for the team: open any surface family as the right demo role, switch demo user and view-as, toggle language, brand, theme and the builder tool; see the counts of what the system holds. Not customer-facing.',
  layout: ['HubHeader (BrandMark lockup, LangToggle, brand cycle, theme, dev mode) on the ink hero band', 'Hero (eyebrow, display title, promise, tagline, clearing-sky art, floating session bar with RoleSwitcher)', 'SurfaceGrid grouped by audience (Outside the firm / Firm staff / Build & test): one card per family (P, C, GB, X, F, L, S, O, A, MK, PM, M, K, D) with hue medallion, built / in-progress / planned chip from the manifest, purpose, live preview of the family home as its demo role, "Enter as <demo user>" with role and path', 'TestingHub (canvas, simulator, plan, board, proposal, docs, manual, legal memory, dev tools)', 'Footer stat strip (routes, built, tables, rules, components, actions, plan tasks done)'],
  data: ['users', 'tenants'], roles: EVERYONE,
  logic: ['Entering a surface calls switchUser(role) then navigates to ROLE_HOME[role] or the family home path.', 'Each card carries a live preview of its home page running as that family’s demo role: an iframe whose hash carries ?as=&dev=&lang=&theme= (src/modules/showcase/frameSession.ts applies it inside the frame only, so the preview never changes your own session).', 'Previews load only when they scroll into view (IntersectionObserver) and at most six are live at once; inside a frame the hub shows the drawn phone / a static icon instead, so frames never nest.', 'Status chips (built / in progress / planned) come from the route manifest: a path with no route yet is a Placeholder, not a dead link.', 'Dev toggle renders only for super_admin; theme, brand and language persist in localStorage (ctl.theme carries theme and brand, ctl.lang the language). Developer codes render only in dev mode.', 'Counts come from getRoutes(), tables, rules, componentLibrary, listActions() and docs/plan/tasks.json (imported as JSON).'],
  integrations: [], components: ['Card', 'Button', 'Toggle', 'RoleSwitcher', 'LangToggle', 'Badge', 'Icon', 'IconButton', 'Kbd', 'Tooltip', 'Placeholder', 'BrandMark', 'BrandArt', 'PhoneFrame', 'DeviceFrame'],
  actions: [
    { id: 'hub.enterAs', label: 'Enter as', intent: 'open a surface as its demo role', params: { surface: 'enum:site,app,desk,counsel,assist,owner,admin,opposition,board,plan,manual,docs,marketing,dev', role: 'enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public' } },
    { id: 'hub.openCanvas', label: 'Canvas', intent: 'open the canvas with every page laid out' },
    { id: 'hub.openSimulator', label: 'Demo simulator', intent: 'open the demo simulator' },
    { id: 'hub.openTool', label: 'Open tool', intent: 'open one of the testing-hub tools', params: { tool: 'enum:canvas,simulator,plan,board,proposal,docs,manual,legal,dev' } },
    { id: 'hub.toggleDevMode', label: 'Builder tool', intent: 'turn the builder tool (dev mode) on or off', permission: 'dev.tools' },
    { id: 'hub.setLang', label: 'Language', intent: 'switch the interface language', params: { lang: 'enum:en,es' } },
    { id: 'hub.toggleTheme', label: 'Theme', intent: 'switch between light and dark' },
    { id: 'hub.cycleBrand', label: 'Brand', intent: 'cycle the brand palette' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'dev mode on', 'viewing as another role', 'Spanish', 'previews loading', 'inside a frame (static previews)'],
  notes: ['hub module: foundation base, design pass (ink hero, audience groups, medallions, stat strip; docs/design/design-system.md) and showcase enrichment (T-024: live role previews, testing-hub row, plan counts). Frame roles come from src/modules/showcase/frameSession.ts (D-21 / D-22 own it); no shared file is edited.'], checkedAt: CHECKED,
});

export const noAccessSpec = defineSpec({
  code: 'HUB-02', name: 'No access',
  purpose: 'Friendly page when the current role cannot open a route; offers the hub to switch demo user or the role home.',
  layout: ['EmptyState (icon, title, body with role and target route)', 'Actions (hub, my home)'], data: ['users'], roles: EVERYONE,
  logic: ['RequireRole redirects here with ?from=<path>.'], integrations: [], components: ['EmptyState', 'Button'],
  actions: [{ id: 'hub.goHome', label: 'Go to my home', intent: 'go to the home page of my current role' }],
  rules: ['RULE-SYS-01'], states: ['default'], checkedAt: CHECKED, notes: ['hub module (foundation)'],
});
