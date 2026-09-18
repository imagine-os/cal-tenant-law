import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../../auth/SessionProvider';
import { roleLabel } from '../../../auth/roles';
import { useTheme } from '../../../design/ThemeProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import { Avatar } from '../../atom/Avatar/Avatar';
import { Button } from '../../atom/Button/Button';
import { Icon } from '../../atom/Icon/Icon';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Toggle } from '../../atom/Toggle/Toggle';
import { Badge } from '../../atom/Badge/Badge';
import { SegmentedControl } from '../../molecule/SegmentedControl/SegmentedControl';
import { LangToggle } from '../../molecule/LangToggle/LangToggle';
import { RoleSwitcher } from '../../molecule/RoleSwitcher/RoleSwitcher';
import { Placeholder } from '../../atom/Placeholder/Placeholder';
import './TopBar.css';

export interface TopBarProps {
  title?: ReactNode;
  onMenu?: () => void;
  children?: ReactNode;
  /** Route the search submits to (`?q=` appended); omitted = the search box is a Placeholder until the search module ships. */
  searchTo?: string;
  /** "Help" link target (ops manual); omitted = hidden. */
  helpTo?: string;
  /** Notifications target; omitted = Placeholder bell. */
  notificationsTo?: string;
}

/**
 * Staff top bar: menu (narrow), title, global search, then language, theme, notifications and the user menu
 * (demo role switcher, appearance, builder-tool toggle, hub link, sign out). Every unwired control is a Placeholder.
 */
export function TopBar({ title, onMenu, children, searchTo, helpTo, notificationsTo }: TopBarProps) {
  const { user, role, isSuperAdmin, devMode, setDevMode, viewAs, signOut } = useSession();
  const { theme, toggleTheme, brand, cycleBrand } = useTheme();
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onMenu && <IconButton icon="menu" label={t('shell.openMenu')} onClick={onMenu} className="topbar-menu" />}
        {title && <div className="topbar-title">{title}</div>}
        <div className="topbar-search topbar-hide-sm">
          {searchTo
            ? <Button variant="outline" icon="search" onClick={() => nav(searchTo)}>{t('shell.search')}</Button>
            : <Placeholder what={t('shell.searchPlanned')} plannedIn="search module"><Button variant="outline" icon="search">{t('shell.search')}</Button></Placeholder>}
        </div>
      </div>
      <div className="topbar-mid">{children}</div>
      <div className="topbar-right">
        <LangToggle size="sm" />
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? t('theme.light') : t('theme.dark')} onClick={toggleTheme} />
        {helpTo && <Link to={helpTo} className="topbar-help topbar-hide-sm"><Icon name="question" size={22} />{t('shell.help')}</Link>}
        {notificationsTo
          ? <IconButton icon="bell" label={t('shell.notifications')} onClick={() => nav(notificationsTo)} />
          : <Placeholder what={t('shell.notificationsPlanned')} plannedIn="messages module"><IconButton icon="bell" label={t('shell.notifications')} /></Placeholder>}
        <div className="topbar-user" ref={ref}>
          <button type="button" className="topbar-userbtn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
            <Avatar name={user.name} size={32} />
            <span className="topbar-username"><strong>{user.name}</strong><span className="muted xs">{roleLabel(role, lang)}{viewAs ? ` (${t('session.viewAs').toLowerCase()})` : ''}</span></span>
            <Icon name="chevron-down" size={20} className="topbar-caret" />
          </button>
          {open && (
            <div className="topbar-pop" role="menu">
              <div className="topbar-pop-head"><Avatar name={user.name} size={40} /><div><strong>{user.name}</strong><div className="xs muted">{user.email || t('session.noEmail')}</div><Badge size="sm" tone="primary">{roleLabel(user.role, lang)}</Badge></div></div>
              <div className="topbar-pop-section"><div className="eyebrow">{t('session.demo')}</div><RoleSwitcher /></div>
              <div className="topbar-pop-section"><div className="eyebrow">{t('theme.appearance')}</div><div className="row wrap"><SegmentedControl size="sm" ariaLabel={t('theme.theme')} value={theme} onChange={() => toggleTheme()} options={[{ value: 'light', label: t('theme.light'), icon: 'sun' }, { value: 'dark', label: t('theme.dark'), icon: 'moon' }]} /><Button variant="ghost" size="sm" icon="palette" onClick={cycleBrand}>{t('theme.brand')}: {brand}</Button></div></div>
              {isSuperAdmin && <div className="topbar-pop-section"><Toggle size="sm" checked={devMode} onChange={setDevMode} label={t('hub.devMode')} description={t('hub.devModeHint')} /></div>}
              <div className="topbar-pop-links"><Link to="/" onClick={() => setOpen(false)}>{t('shell.hub')}</Link><button type="button" className="topbar-signout" onClick={() => { signOut(); setOpen(false); nav('/'); }}>{t('session.signOut')}</button></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
