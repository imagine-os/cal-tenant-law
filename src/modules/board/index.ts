import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { EVERYONE } from '../../auth/roles';
import { BoardPage } from './BoardPage';
import { CaseBoardPage, CaseRedirectPage } from './CaseBoardPage';
import { OverlayPage } from './OverlayPage';
import { boardSpec, caseBoardSpec, overlaySpec } from './specs';
export { strings } from './strings';

/**
 * The game board module (GB-01..GB-03). Surface `board` (the staff DesktopShell, menu group `board`), but the routes
 * are open to everyone including the public visitor: the board is the firm's teaching tool as much as a staff view.
 * GB-01 replaces the _stubs placeholder at /board.
 */
export const routes: RouteDef[] = [
  {
    path: '/board', element: h(BoardPage), spec: boardSpec, roles: EVERYONE, surface: 'board', layout: 'auto',
    nav: { label: 'board.nav.explore', icon: 'gamepad', order: 0, group: 'board' },
  },
  {
    path: '/board/case/:caseId', element: h(CaseBoardPage), spec: caseBoardSpec, roles: EVERYONE, surface: 'board', layout: 'auto',
    nav: { label: 'board.nav.case', icon: 'pin', order: 1, group: 'board', to: '/board/case' },
  },
  { path: '/board/case', element: h(CaseRedirectPage), spec: caseBoardSpec, roles: EVERYONE, surface: 'board', layout: 'auto' },
  {
    path: '/board/overlay', element: h(OverlayPage), spec: overlaySpec, roles: EVERYONE, surface: 'board', layout: 'auto',
    nav: { label: 'board.nav.overlay', icon: 'dollar', order: 2, group: 'board' },
  },
];
