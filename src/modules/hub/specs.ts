import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

export const hubSpec = defineSpec({
  code: 'HUB-01', name: 'Testing hub',
  purpose: 'First screen for the team: open any surface family as the right demo role, switch demo user and view-as, toggle language, theme and the builder tool; see the counts of what the system holds. Not customer-facing.',
  layout: ['HubHeader (brand, LangToggle, theme, dev mode)', 'Hero (title, RoleSwitcher)', 'SurfaceGrid (one card per family: P, C, F, L, S, O, A, X, GB, PM, M, K, MK, D)', 'Footer (version, counts: routes, tables, rules, components, actions)'],
  data: ['users', 'tenants'], roles: EVERYONE,
  logic: ['Entering a surface calls switchUser(role) then navigates to ROLE_HOME[role] or the family home path.', 'Dev toggle renders only for super_admin; theme and language persist in localStorage (ctl.theme, ctl.lang).', 'Counts come from getRoutes(), tables, rules, componentLibrary and listActions().'],
  integrations: [], components: ['Card', 'Button', 'Toggle', 'RoleSwitcher', 'LangToggle', 'Badge', 'Icon', 'IconButton', 'Kbd', 'Tooltip'],
  actions: [
    { id: 'hub.enterAs', label: 'Enter as', intent: 'open a surface as its demo role', params: { surface: 'enum:site,app,desk,counsel,assist,owner,admin,opposition,board,plan,manual,docs,marketing,dev' } },
    { id: 'hub.toggleDevMode', label: 'Builder tool', intent: 'turn the builder tool (dev mode) on or off', permission: 'dev.tools' },
    { id: 'hub.setLang', label: 'Language', intent: 'switch the interface language', params: { lang: 'enum:en,es' } },
    { id: 'hub.toggleTheme', label: 'Theme', intent: 'switch between light and dark' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'dev mode on', 'viewing as another role', 'Spanish'],
  notes: ['hub module (foundation); another pass enriches it with the canvas and simulator - keep HubPage sectioned.'], checkedAt: CHECKED,
});

export const noAccessSpec = defineSpec({
  code: 'HUB-02', name: 'No access',
  purpose: 'Friendly page when the current role cannot open a route; offers the hub to switch demo user or the role home.',
  layout: ['EmptyState (icon, title, body with role and target route)', 'Actions (hub, my home)'], data: ['users'], roles: EVERYONE,
  logic: ['RequireRole redirects here with ?from=<path>.'], integrations: [], components: ['EmptyState', 'Button'],
  actions: [{ id: 'hub.goHome', label: 'Go to my home', intent: 'go to the home page of my current role' }],
  rules: ['RULE-SYS-01'], states: ['default'], checkedAt: CHECKED, notes: ['hub module (foundation)'],
});
