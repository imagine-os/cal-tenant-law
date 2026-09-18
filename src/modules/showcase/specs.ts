import { defineSpec } from '../../specs/defineSpec';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const ROLES = ['super_admin' as const, 'owner' as const];
/** No `permission` on these: they are view controls (zoom, pan, pick a device), and both allowed roles must be able to run them (owner has every permission except `dev.tools`). */

export const canvasSpec = defineSpec({
  code: 'D-21', name: 'Canvas',
  purpose: 'Every page of CTL OS laid out on one zoomable, pannable surface as live frames, grouped by surface family, so the whole system is visible at once and any page can be used right inside its frame instead of one page at a time.',
  layout: [
    'PageHeader (title, live-frame counter, keyboard hint)',
    'Toolbar (zoom out / level / zoom in, fit all, group select + fit group, surface filter, built-only, search, live cap, frame language, frame builder tool)',
    'CanvasViewport (scrollable surface: labelled regions, frames with code + name + built/stub badge + Focus / Open, live iframes or a not-loaded card)',
    'Minimap (region rectangles and the viewport window)',
    'FocusOverlay (one frame enlarged to a working size)',
    'ListView (under 700 px: every page as a list with Open links)',
  ],
  data: ['page_layouts'], roles: ROLES,
  logic: [
    'Frames come from the route manifest (window.__ctl.routes): one per page code, parameterised paths filled with sample values.',
    'Regions are surface families in reading order; regions are shelf-packed into a 6600 px world and frames laid out in a grid inside their region (canvasLayout.ts).',
    'Each frame runs as the natural role of its surface when the route allows it, else the first allowed role, passed through the iframe hash (?as=&dev=&lang=&theme=) and applied by frameSession.ts inside the frame only.',
    'Live iframes are capped (default 12) and chosen by distance from the viewport centre; frames outside the cap show a not-loaded card with a Load button; IntersectionObserver decides what is in view.',
    'Zoom 0.06..1 with buttons, + / - keys, ctrl + wheel (anchored on the pointer) and fit all / fit group; panning is the viewport\'s own scroll (drag, arrow keys, scrollbars, minimap).',
    'Zoom, filters, live cap, frame language / builder tool and scroll position persist in localStorage ctl.canvas.',
    'Under 700 px (and inside a frame) the page renders the list view instead of the surface, so a phone never scrolls the document sideways.',
  ],
  integrations: [], components: ['PageHeader', 'Card', 'Button', 'IconButton', 'Select', 'Checkbox', 'SearchInput', 'Badge', 'StatusBadge', 'Chip', 'Toggle', 'LangToggle', 'DeviceFrame', 'EmptyState', 'Tooltip', 'Kbd', 'Placeholder'],
  actions: [
    { id: 'showcase.zoom', label: 'Zoom', intent: 'zoom the canvas in or out, or to a level', params: { step: 'enum:in,out', level: 'number' } },
    { id: 'showcase.fit', label: 'Fit', intent: 'fit everything, or one group, into the view', params: { region: 'string' } },
    { id: 'showcase.pan', label: 'Pan', intent: 'move the canvas view by an amount', params: { dx: 'number', dy: 'number' } },
    { id: 'showcase.focusFrame', label: 'Focus', intent: 'enlarge one page frame to a working size', params: { code: 'string' } },
    { id: 'showcase.closeFrame', label: 'Close frame', intent: 'close the enlarged frame' },
    { id: 'showcase.openFrame', label: 'Open page', intent: 'leave the canvas and open a page for real', params: { code: 'string' } },
    { id: 'showcase.loadFrame', label: 'Load frame', intent: 'load a page that is not live yet', params: { code: 'string' } },
    { id: 'showcase.filter', label: 'Filter', intent: 'filter the canvas by surface, search text or built only', params: { surface: 'string', q: 'string', builtOnly: 'boolean' } },
    { id: 'showcase.setLiveCap', label: 'Live frames', intent: 'set how many frames may be live at once', params: { cap: 'number' } },
    { id: 'showcase.setFrameLang', label: 'Frame language', intent: 'set the language the frames run in', params: { lang: 'enum:en,es' } },
    { id: 'showcase.setFrameDev', label: 'Frame builder tool', intent: 'turn the builder tool on or off inside the frames', params: { on: 'boolean' } },
  ],
  rules: ['RULE-SYS-01'], states: ['fit all', 'zoomed in', 'frame focused', 'filtered', 'narrow (list view)', 'inside a frame'],
  notes: ['showcase module (T-025). Frame roles are set by the iframe hash and frameSession.ts, which shadows ctl.session / ctl.lang / ctl.theme inside the frame only - no shared file is edited.'],
  checkedAt: CHECKED,
});

export const simulatorSpec = defineSpec({
  code: 'D-22', name: 'Demo simulator',
  purpose: 'Present any page of CTL OS at any size, as any demo role, in either language: phone, tablet, laptop, desktop and 4K TV frames with a present mode and a scripted tour, so a demo needs no screen sharing gymnastics.',
  layout: [
    'PageHeader (title, share note, Present)',
    'Controls (device segmented control, page select, role select, language, theme, builder tool, rotate, screenshot placeholder)',
    'Stage (DeviceFrame at the chosen viewport, scaled to fit)',
    'Tour (step counter, note, Back / Next)',
    'ShortcutHint (shown once)',
  ],
  data: ['page_layouts'], roles: ROLES,
  logic: [
    'Device presets: phone 360 and 390, tablet 768, laptop 1280, desktop 1920, TV 2560 and 3840; the frame is scaled down to fit the stage and the real viewport width is what the page sees.',
    'Orientation swaps width and height for phone and tablet only.',
    'Pages come from the route manifest, grouped by surface; the role defaults to the natural role of the page\'s surface.',
    'Role, language, theme and builder tool are passed through the iframe hash (?as=&dev=&lang=&theme=) and applied inside the frame only (frameSession.ts), so presenting never changes your own session.',
    'Device, page, role, language, theme and present mode live in the URL query, so a link reopens the same demo.',
    'The tour is a scripted sequence (hub, client home, board, attorney home, plan, proposal); a step whose page is not in the manifest falls back to the hub.',
    'Present mode hides the chrome, enlarges the frame and shows the keyboard shortcuts once (remembered in localStorage ctl.simulator).',
  ],
  integrations: [], components: ['PageHeader', 'Card', 'Button', 'IconButton', 'Select', 'SegmentedControl', 'Toggle', 'Badge', 'DeviceFrame', 'Kbd', 'Placeholder', 'Tooltip'],
  actions: [
    { id: 'showcase.setDevice', label: 'Device', intent: 'show the demo at a device size', params: { device: 'enum:phone360,phone390,tablet768,laptop1280,desktop1920,tv2560,tv3840' } },
    { id: 'showcase.setRoute', label: 'Page', intent: 'show a page in the simulator', params: { path: 'string' } },
    { id: 'showcase.setRole', label: 'Role', intent: 'run the framed page as a demo role', params: { role: 'enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public' } },
    { id: 'showcase.setLang', label: 'Language', intent: 'run the framed page in English or Spanish', params: { lang: 'enum:en,es' } },
    { id: 'showcase.setTheme', label: 'Theme', intent: 'run the framed page in light or dark', params: { theme: 'enum:light,dark' } },
    { id: 'showcase.setDevMode', label: 'Builder tool', intent: 'turn the builder tool on or off inside the frame', params: { on: 'boolean' } },
    { id: 'showcase.rotate', label: 'Rotate', intent: 'rotate the phone or tablet frame' },
    { id: 'showcase.present', label: 'Present', intent: 'enter or leave present mode', params: { on: 'boolean' } },
    { id: 'showcase.tourStart', label: 'Start tour', intent: 'start the scripted demo tour' },
    { id: 'showcase.tourNext', label: 'Next', intent: 'go to the next step of the tour' },
    { id: 'showcase.tourBack', label: 'Back', intent: 'go back one step of the tour' },
    { id: 'showcase.tourStop', label: 'End tour', intent: 'end the scripted demo tour' },
    { id: 'showcase.screenshot', label: 'Screenshot', intent: 'save a picture of the framed page' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'present mode', 'tour running', 'rotated', 'Spanish', 'dark', 'inside a frame'],
  notes: ['showcase module (T-026). Screenshot is a Placeholder (plannedIn: screenshot pass): a same-origin iframe cannot be rasterised from the page, so it needs the Playwright pass or a browser API.'],
  checkedAt: CHECKED,
});
