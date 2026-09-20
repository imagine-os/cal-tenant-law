import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../atom/Icon/Icon';
import { useSession } from '../../../auth/SessionProvider';
import { useT } from '../../../i18n/I18nProvider';
import './PageHeader.css';

export interface PageHeaderProps { title: string; subtitle?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; backTo?: string; code?: string; children?: ReactNode }

/** Page title row (Figma `employees.jpg`: "Manage Employees" Open Sans 700 24 #181818 with the primary action right): optional back link, eyebrow, title, subtitle, actions; children = tabs / filters row. The page-code pill shows in dev mode only (Figma has none). */
export function PageHeader({ title, subtitle, eyebrow, actions, backTo, code, children }: PageHeaderProps) {
  const { devMode } = useSession();
  const t = useT();
  const showCode = devMode && !!code;
  return (
    <header className="pagehead">
      <div className="pagehead-row">
        <div className="pagehead-text">
          {backTo && <Link to={backTo} className="pagehead-back"><Icon name="arrow-left" size={16} /> {t('shell.back')}</Link>}
          {(eyebrow || showCode) && <div className="eyebrow row wrap" style={{ gap: 8, rowGap: 4 }}>{showCode && <code className="pagehead-code">{code}</code>}{eyebrow}</div>}
          <h1 className="pagehead-title">{title}</h1>
          {subtitle && <p className="pagehead-sub muted">{subtitle}</p>}
        </div>
        {actions && <div className="pagehead-actions">{actions}</div>}
      </div>
      {children && <div className="pagehead-bar">{children}</div>}
    </header>
  );
}
