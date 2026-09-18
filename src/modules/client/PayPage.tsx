import { useI18n } from '../../i18n/I18nProvider';
import { useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import type { InvoiceRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Link, useNavigate } from 'react-router-dom';
import type { BoardPositionRow } from '../../data/schema/board';
import { PriceTag, serviceHref } from '../catalog/catalogChrome';
import { useNextServices } from '../catalog/catalogData';
import { clientPaySpec } from './specs';
import { useMyCase } from './useMyCase';
import { fmtDate, money } from '../_homes/lib';
import '../_homes/homes.css';
import '../catalog/catalog.css';

/** C-04 pay: unbundled, SKU-priced work. Prices are as listed on the firm site; paying is a seam. */
export function ClientPayPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { caseId } = useMyCase();
  const { rows: invoices } = useTable<InvoiceRow>('invoices', { where: { case_id: caseId } });
  // P-10 cross-wiring: what the menu holds for the square this case is standing on (prices "as listed").
  const { rows: positions } = useTable<BoardPositionRow>('board_positions', { where: { case_id: caseId } });
  const nextServices = useNextServices(positions[0]?.node_id ?? null);
  const due = invoices.filter((i) => i.status === 'due');
  const history = invoices.filter((i) => i.status !== 'due').sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''));
  const totalDue = due.reduce((s, i) => s + i.amount_cents, 0);

  useActions(clientPaySpec, {
    'client.payInvoice': () => ({ ok: false, message: 'Not wired yet (payments are a seam)' }),
    'client.openReceipt': () => ({ ok: false, message: 'Not wired yet (payments are a seam)' }),
    'client.openServices': () => { navigate('/site/services'); return { ok: true, message: 'Opened the services menu' }; },
  });

  return (
    <div className="homes-phone">
      <PageHeader code="C-04" title={t('client.payTitle')} subtitle={t('client.paySub')} />
      <Card padding="md" className="stack-sm">
        <div className="homes-pay-row"><strong>{t('client.totalDue')}</strong><strong className="homes-amount" style={{ fontSize: 'var(--fs-xl)' }}>{money(totalDue)}</strong></div>
        <span className="xs muted">{t('client.asListed')}</span>
      </Card>

      <Section title={t('client.due')}>
        {due.length === 0 ? <EmptyState compact icon="check" title={t('client.nothingDue')} />
          : <ul className="homes-list">
            {due.map((i) => (
              <li key={i.id} className="homes-item">
                <span className="homes-item-main"><span className="homes-item-title">{i.title}</span><span className="homes-item-meta">SKU {i.sku}</span></span>
                <span className="homes-item-side">
                  <span className="homes-amount">{money(i.amount_cents)}</span>
                  <Placeholder what="pay this item by card or PayPal" plannedIn="payments seam (Stripe / PayPal, Pass 3)">
                    <Button size="sm" icon="card">{t('client.payThis')}</Button>
                  </Placeholder>
                </span>
              </li>
            ))}
          </ul>}
      </Section>

      {nextServices.length > 0 && (
        <Section title={t('catalog.next.title')} description={t('catalog.next.desc')}>
          <ul className="cat-next">
            {nextServices.map((s) => (
              <li key={s.id}>
                <Link to={serviceHref(s.sku)} className="cat-next-title">{s.sku_listed ? `${s.sku} · ` : ''}{s.title}</Link>
                <PriceTag service={s} size="sm" />
              </li>
            ))}
          </ul>
          <Link to="/site/services"><Button size="sm" variant="ghost" iconRight="arrow-right">{t('catalog.next.seeAll')}</Button></Link>
        </Section>
      )}

      <Section title={t('client.history')}>
        {history.length === 0 ? <EmptyState compact icon="card" title={lang === 'es' ? 'Sin historial todavía' : 'No history yet'} />
          : <ul className="homes-list">
            {history.map((i) => (
              <li key={i.id} className="homes-item">
                <span className="homes-item-main"><span className="homes-item-title">{i.title}</span>
                  <span className="homes-item-meta">SKU {i.sku}{i.paid_at ? ` · ${fmtDate(i.paid_at, lang)}` : ''}</span></span>
                <span className="homes-item-side">
                  <span className="homes-amount">{money(i.amount_cents)}</span>
                  <StatusBadge status={i.status} size="sm" />
                  <Placeholder what="open the receipt" plannedIn="payments seam (Pass 3)">
                    <Button size="sm" variant="ghost" icon="download" aria-label={`${t('client.history')} ${i.title}`} />
                  </Placeholder>
                </span>
              </li>
            ))}
          </ul>}
      </Section>
    </div>
  );
}
