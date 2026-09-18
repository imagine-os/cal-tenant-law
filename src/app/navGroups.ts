import type { IconName } from '../components/atom/Icon/Icon';

/**
 * Side-menu categories. Module routes reference a category by `nav.group` key; unknown keys render as an ad-hoc
 * category with the key as label. Order here is the menu order. Nobody needs to edit this file to add a page.
 */
export interface NavGroupDef { key: string; label: string; icon: IconName; order: number }

export const NAV_GROUPS: NavGroupDef[] = [
  { key: 'overview', label: 'Overview', icon: 'home', order: 0 },
  { key: 'intake', label: 'Intake & consultations', icon: 'phone', order: 10 },
  { key: 'cases', label: 'Cases', icon: 'briefcase', order: 20 },
  { key: 'calendar', label: 'Deadlines & hearings', icon: 'calendar', order: 30 },
  { key: 'documents', label: 'Documents & filings', icon: 'file-text', order: 40 },
  { key: 'board', label: 'Game board', icon: 'gamepad', order: 45 },
  { key: 'clients', label: 'Clients', icon: 'users', order: 50 },
  { key: 'opposition', label: 'Opposing counsel', icon: 'scale', order: 55 },
  { key: 'store', label: 'Store & payments', icon: 'dollar', order: 60 },
  { key: 'messages', label: 'Messages & hotline', icon: 'message', order: 65 },
  { key: 'marketing', label: 'Marketing', icon: 'megaphone', order: 70 },
  { key: 'reports', label: 'Reports', icon: 'chart', order: 75 },
  { key: 'plan', label: 'Projects & plan', icon: 'kanban', order: 80 },
  { key: 'settings', label: 'Settings', icon: 'settings', order: 85 },
  { key: 'manual', label: 'Ops manual', icon: 'book', order: 90 },
  { key: 'developer', label: 'Developer', icon: 'code', order: 100 },
  { key: 'docs', label: 'Docs', icon: 'layers', order: 110 },
];
export const navGroup = (key: string): NavGroupDef => NAV_GROUPS.find((g) => g.key === key) ?? { key, label: key, icon: 'grid', order: 500 };
