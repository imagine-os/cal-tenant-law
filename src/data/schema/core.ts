/**
 * Core tables owned by the foundation: tenants (the network + regional offices), users, feedback (annotations),
 * page_layouts, presence, actions_log. Module tables live in their own src/data/schema/<module>.ts.
 */
import { defineTables, col, type BaseRow } from './types.ts';
import { ROLES } from '../../auth/roles.ts';

export const FEEDBACK_KINDS = ['comment', 'request', 'bug'] as const;
export const FEEDBACK_STATUSES = ['new', 'triaged', 'waiting', 'fixed', 'wontfix', 'closed'] as const;
export const FEEDBACK_TRIAGE = ['fix', 'ask', 'wontfix'] as const;

export const tables = defineTables([
  { name: 'tenants', label: 'Tenants (offices)', description: 'The CTL network and each regional attorney office under the banner. tenant_id on every row points here; the network row is its own tenant.', group: 'core', titleColumn: 'name', source: 'docs/data/offices.json (eight offices as posted on caltenantlaw.com, 2026-09-18) · brief 1.3 · D-044',
    rls: ['everyone signed in: read own tenant and the network row', 'owner / super_admin: write'],
    columns: [col.text('slug'), col.text('name'), col.text('short_name'), col.en('kind', ['network', 'office']), col.text('city', true), col.text('region', true, 'Coverage copy, e.g. Inland Empire'), col.text('address', true), col.text('phone', true), col.text('email', true), col.text('timezone'), col.json('settings', true), col.int('sort_order'), col.bool('active')] },
  { name: 'users', label: 'Users', description: 'Login principals: staff, clients, opposing counsel. Role is the primary role; permissions derive from it (src/auth/permissions.ts).', group: 'core', titleColumn: 'name', source: 'foundation',
    rls: ['self: read own row', 'staff: read users of own tenant', 'owner / super_admin: write'],
    columns: [col.text('name'), col.text('email'), col.en('role', ROLES), col.text('phone', true), col.text('avatar_url', true), col.en('preferred_language', ['en', 'es']), col.bool('active'), col.ts('last_seen_at', true)] },
  { name: 'feedback', label: 'Feedback & annotations', description: 'Comments, requests and bug reports pinned to a page or an element by testers (FeedbackButton). Agents triage from here and record the decision before changing anything (docs/reference/annotations-triage.md).', group: 'comms', titleColumn: 'text', source: 'P-08, D-199/200',
    rls: ['any signed-in role: insert own rows', 'author: read own rows', 'owner / attorney / super_admin: read all, write triage fields'],
    columns: [col.ref('user_id', 'users'), col.text('user_name'), col.text('role'), col.text('page_code'), col.text('route'), col.en('kind', FEEDBACK_KINDS), col.en('category', ['ui', 'content', 'data', 'legal', 'idea', 'other']), col.long('text'),
      col.text('element_path', true, 'CSS path of the pinned element (element picker)'), col.text('component', true, 'Library component name at the pin, when known'), col.text('viewport', true, 'e.g. 1280x800'), col.en('theme', ['light', 'dark'], true), col.text('screenshot_url', true),
      col.en('status', FEEDBACK_STATUSES), col.en('triage', FEEDBACK_TRIAGE, true), col.long('triage_note', true, 'Why fix / ask / wontfix, written before the change'), col.text('decision_ref', true, 'D-xxx or kanban card the decision lives in'), col.long('owner_reply', true)] },
  { name: 'page_layouts', label: 'Page layouts', description: 'Per page code: section order and hidden sections (builder tool layout editor, useLayout).', group: 'design', titleColumn: 'page_code', source: 'hoy pattern',
    rls: ['everyone: read', 'super_admin: write'],
    columns: [col.text('page_code'), col.json('order'), col.json('hidden')] },
  { name: 'presence', label: 'Presence', description: 'Who is on which route right now (multiplayer seam, P-14). One row per user; updated_at is the heartbeat.', group: 'system', titleColumn: 'route', source: 'P-14',
    rls: ['signed in: upsert own row', 'staff: read rows of own tenant'],
    columns: [col.ref('user_id', 'users'), col.text('user_name'), col.text('role'), col.text('route'), col.text('page_code', true), col.en('state', ['active', 'idle', 'away'])] },
  { name: 'actions_log', label: 'Actions log', description: 'Every action run through the actions bus (runAction): who, which action, params, result. The audit trail for voice / agent controllers.', group: 'system', titleColumn: 'action_id', source: 'P-05 / P-06',
    rls: ['signed in: insert own rows', 'owner / super_admin: read all'],
    columns: [col.ref('user_id', 'users', true), col.text('user_name', true), col.text('role', true), col.text('action_id'), col.text('page_code', true), col.json('params', true), col.bool('ok'), col.text('message', true), col.text('source', true, 'ui | dev | voice | mcp')] },
]);

export interface TenantRow extends BaseRow { slug: string; name: string; short_name: string; kind: 'network' | 'office'; city: string | null; region: string | null; address: string | null; phone: string | null; email: string | null; timezone: string; settings: Record<string, unknown> | null; sort_order: number; active: boolean }
export interface UserRow extends BaseRow { name: string; email: string; role: string; phone: string | null; avatar_url: string | null; preferred_language: 'en' | 'es'; active: boolean; last_seen_at: string | null }
export interface FeedbackRow extends BaseRow { user_id: string; user_name: string; role: string; page_code: string; route: string; kind: (typeof FEEDBACK_KINDS)[number]; category: string; text: string; element_path: string | null; component: string | null; viewport: string | null; theme: 'light' | 'dark' | null; screenshot_url: string | null; status: (typeof FEEDBACK_STATUSES)[number]; triage: (typeof FEEDBACK_TRIAGE)[number] | null; triage_note: string | null; decision_ref: string | null; owner_reply: string | null }
export interface PageLayoutRow extends BaseRow { page_code: string; order: string[]; hidden: string[] }
export interface PresenceRow extends BaseRow { user_id: string; user_name: string; role: string; route: string; page_code: string | null; state: 'active' | 'idle' | 'away' }
export interface ActionsLogRow extends BaseRow { user_id: string | null; user_name: string | null; role: string | null; action_id: string; page_code: string | null; params: Record<string, unknown> | null; ok: boolean; message: string | null; source: string | null }
