/**
 * Document pipeline module (prompt 0006, D-047): L-13 the attorney board, L-14 one order end to end, S-13 the
 * paralegal queue, C-11 / C-11a the client's own version, F-14 the front desk's order lookup.
 *
 * Justin's ask: "the attorneys need a pipeline for each document, with each of the steps ... One important thing is
 * knowing when things are being waited on by the clients. The clients should see their own version accordingly,
 * Front Desk should know the status of any order if the customer calls in." The five pages are those four sentences,
 * built on the shared contract in `src/domain/pipeline.ts` (stages, transitions, waiting-on, SLA, client collapse)
 * and documented in `docs/reference/pipeline.md`.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { PipelineBoardPage } from './PipelineBoardPage';
import { OrderDetailPage } from './OrderDetailPage';
import { AssistQueuePage } from './AssistQueuePage';
import { ClientOrdersPage } from './ClientOrdersPage';
import { ClientOrderPage } from './ClientOrderPage';
import { DeskOrdersPage } from './DeskOrdersPage';
import { pipelineBoardSpec, orderDetailSpec, assistQueueSpec, clientOrdersSpec, clientOrderSpec, deskOrdersSpec, COUNSEL_ROLES, ORDER_ROLES, ASSIST_ROLES, CLIENT_ROLES, DESK_ROLES } from './specs';
export { strings } from './strings';

const client = { roles: CLIENT_ROLES, surface: 'customer' as const, layout: 'mobile' as const };

export const routes: RouteDef[] = [
  {
    path: '/counsel/pipeline', element: h(PipelineBoardPage), spec: pipelineBoardSpec, roles: COUNSEL_ROLES, surface: 'counsel', layout: 'desktop',
    nav: { label: 'pipeline.nav.board', icon: 'kanban', order: 0, group: 'documents' },
  },
  { path: '/counsel/orders/:orderId', element: h(OrderDetailPage), spec: orderDetailSpec, roles: ORDER_ROLES, surface: 'counsel', layout: 'desktop' },
  {
    path: '/assist/queue', element: h(AssistQueuePage), spec: assistQueueSpec, roles: ASSIST_ROLES, surface: 'assist', layout: 'desktop',
    nav: { label: 'pipeline.nav.queue', icon: 'list', order: 1, group: 'documents' },
  },
  {
    path: '/desk/orders', element: h(DeskOrdersPage), spec: deskOrdersSpec, roles: DESK_ROLES, surface: 'frontdesk', layout: 'desktop',
    nav: { label: 'pipeline.nav.desk', icon: 'search', order: 2, group: 'documents' },
  },
  {
    ...client, path: '/app/orders', element: h(ClientOrdersPage), spec: clientOrdersSpec,
    nav: { label: 'pipeline.nav.orders', icon: 'file-text', order: 15, group: 'customer' },
  },
  { ...client, path: '/app/orders/:orderId', element: h(ClientOrderPage), spec: clientOrderSpec },
];
