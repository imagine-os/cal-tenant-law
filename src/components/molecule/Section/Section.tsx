import { useState, type ReactNode } from 'react';
import { Icon } from '../../atom/Icon/Icon';
import './Section.css';

export interface SectionProps { title: ReactNode; description?: ReactNode; actions?: ReactNode; collapsible?: boolean; defaultOpen?: boolean; id?: string; children?: ReactNode; className?: string; /** Figma customer home (Home Page.png): the label sits on the white screen and the body on a full-bleed #EEF2F5 band (Services 170..263, Pets 312..461, Upcoming 491..729). */ band?: boolean }

/** Titled block inside a page; optionally collapsible. Matches PageSpec.layout section names one to one. */
export function Section({ title, description, actions, collapsible = false, defaultOpen = true, id, children, className = '', band = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`section ${band ? 'is-band' : ''} ${className}`} id={id}>
      <div className="section-head">
        <div className="section-text">
          {collapsible ? <button type="button" className="section-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}><Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} /><h2 className="section-title">{title}</h2></button> : <h2 className="section-title">{title}</h2>}
          {description && <p className="section-desc muted">{description}</p>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      {(!collapsible || open) && <div className="section-body">{children}</div>}
    </section>
  );
}
