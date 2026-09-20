/**
 * Drafting studio (S-21 index, S-22 the studio, S-10 template manager). Surface `assist` -> the staff DesktopShell.
 *
 * Justin, prompt 0006: "i also want a really cool system for drafting documents with relevant laws automatically on
 * the side, precedence, recommendations, access to client details, etc. The pleading paper drafting system needs
 * lots of attention, things to ask client, with ability to send the client the questions or requests for items, etc."
 * The firm drafts pleading paper in WordPerfect today; D-018 chose a browser editor with the pleading-line ruler and
 * PDF / DOCX export. Realtime co-editing is Pass 3 (S-12, T-097).
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { StudioIndexPage } from './StudioIndexPage';
import { DraftPage } from './DraftPage';
import { TemplatesPage } from './TemplatesPage';
import { studioIndexSpec, draftSpec, templatesSpec } from './specs';
export { strings } from './strings';

const STAFF = ['paralegal', 'attorney', 'owner', 'super_admin'] as const;
const base = { roles: [...STAFF], surface: 'assist' as const, layout: 'desktop' as const };

export const routes: RouteDef[] = [
  { ...base, path: '/assist/drafting', element: h(StudioIndexPage), spec: studioIndexSpec, nav: { label: 'drafting.nav.studio', icon: 'edit', order: 10, group: 'documents' } },
  { ...base, path: '/assist/drafting/:draftId', element: h(DraftPage), spec: draftSpec },
  { ...base, path: '/assist/templates', element: h(TemplatesPage), spec: templatesSpec, nav: { label: 'drafting.nav.templates', icon: 'layers', order: 11, group: 'documents' } },
];
