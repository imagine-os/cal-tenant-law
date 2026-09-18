import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { ROLE_LABEL, type Role } from '../../auth/roles';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Icon, type IconName } from '../../components/atom/Icon/Icon';
import { SiteFrame } from './chrome';
import { proposalSpec } from './specs';
import { DEPARTMENTS, FEATURES, MATRIX_ROLES, METHOD, PROMISES, TASKS, featuresAt, planFor, type DepartmentId, type Feature, type ShipStatus } from './proposalData';

type RoleFilter = Role | 'all';
interface DeptRow { id: DepartmentId; label: string; icon: string }

const STATUS_TONE: Record<ShipStatus, 'success' | 'info' | 'neutral'> = { done: 'success', doing: 'info', planned: 'neutral' };

/** P-02 - the full-stack view of CTL OS for the firm's decision makers. */
export function ProposalPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = FEATURES.find((f) => f.id === openId) ?? null;
  const openPlan = open ? planFor(open.codes) : null;

  const statusLabel = (s: ShipStatus) => t(`site.status.${s}`);
  const roleColumns = role === 'all' ? MATRIX_ROLES : [role];

  const rows: DeptRow[] = useMemo(() => DEPARTMENTS.map((d) => ({ id: d.id, label: bi(d.label, lang), icon: d.icon })), [lang]);

  const columns: DataTableColumn<DeptRow>[] = useMemo(() => [
    { key: 'department', label: t('p2.matrix.dept'), width: 200, render: (r) => <span className="st-matrix-dept"><Icon name={r.icon as IconName} size={18} /> {r.label}</span> },
    ...roleColumns.map((rl) => ({
      key: rl,
      label: ROLE_LABEL[rl][lang] ?? ROLE_LABEL[rl].en,
      render: (r: DeptRow) => {
        const cells = featuresAt(r.id, rl);
        if (!cells.length) return <span className="st-matrix-none" aria-label={t('p2.matrix.empty')}>{t('p2.matrix.empty')}</span>;
        return (
          <span className="st-matrix-cell">
            {cells.map((f) => {
              const p = planFor(f.codes);
              return <Chip key={f.id} size="sm" className="st-featurechip" tone={p.status === 'planned' ? 'neutral' : 'primary'} onClick={() => setOpenId(f.id)} title={bi(f.what, lang)}>{bi(f.label, lang)}</Chip>;
            })}
          </span>
        );
      },
    })),
  ], [roleColumns, lang, t]);

  useActions(proposalSpec, {
    'site.filterRole': ({ role: r }) => {
      if (r === 'all') { setRole('all'); return { ok: true, message: 'Showing every role' }; }
      if (!MATRIX_ROLES.includes(r as Role)) return { ok: false, message: `role must be all or one of ${MATRIX_ROLES.join(', ')}` };
      setRole(r as Role);
      return { ok: true, message: `Filtered to ${String(r)}` };
    },
    'site.resetMatrix': () => { setRole('all'); return { ok: true, message: 'Showing every role' }; },
    'site.openFeature': ({ featureId }) => {
      const hit = FEATURES.find((f) => f.id === featureId);
      if (!hit) return { ok: false, message: `No such feature: ${String(featureId)}` };
      setOpenId(hit.id);
      return { ok: true, message: `Opened ${bi(hit.label, 'en')}` };
    },
    'site.openPlan': () => { navigate('/plan'); return { ok: true, message: 'Opened the project board' }; },
    'site.printProposal': () => { window.print(); return { ok: true, message: 'Print dialog opened' }; },
  });

  const centre: { key: string; icon: IconName }[] = [
    { key: 'board', icon: 'gamepad' }, { key: 'deadlines', icon: 'clock' }, { key: 'binder', icon: 'layers' },
    { key: 'costs', icon: 'dollar' }, { key: 'learning', icon: 'video' }, { key: 'comms', icon: 'message' },
  ];

  return (
    <SiteFrame>
      <div className="container">
        <PageHeader
          code="P-02" eyebrow={t('p2.eyebrow')} title={t('p2.title')} subtitle={t('p2.lead')}
          actions={<Button variant="secondary" icon="download" className="st-print-hide" onClick={() => window.print()}>{t('p2.print')}</Button>}
        />
      </div>

      <div className="container">
        <div className="st-grid4">
          <StatTile label={t('p2.stat.departments')} value={DEPARTMENTS.length} icon="building" />
          <StatTile label={t('p2.stat.roles')} value={MATRIX_ROLES.length} icon="users" />
          <StatTile label={t('p2.stat.features')} value={FEATURES.length} icon="grid" tone="primary" />
          <StatTile label={t('p2.stat.tasks')} value={TASKS.length} icon="kanban" />
        </div>
      </div>

      <div className="container">
        <Section
          title={t('p2.matrix.title')} description={t('p2.matrix.desc')}
          actions={
            <SegmentedControl
              size="sm" ariaLabel={t('p2.matrix.role')} value={role} onChange={(v) => setRole(v as RoleFilter)}
              options={[{ value: 'all', label: t('p2.matrix.all') }, ...MATRIX_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r][lang] ?? ROLE_LABEL[r].en }))]}
            />
          }
        >
          <DataTable<DeptRow> columns={columns} rows={rows} rowKey={(r) => r.id} dense emptyText={t('p2.matrix.empty')} />
          <p className="xs muted">{t('p2.matrix.count', { n: FEATURES.length })}</p>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p2.centre.title')} description={t('p2.centre.desc')}>
          <div className="st-centre">
            <div className="st-centre-hub">
              <strong>{t('p2.centre.case')}</strong>
              <span>{t('p2.centre.boardBody')}</span>
            </div>
            {centre.map((c) => (
              <Card key={c.key}>
                <div className="stack-sm">
                  <div className="st-cardhead"><span className="st-icon-badge"><Icon name={c.icon} size={20} /></span><h3>{t(`p2.centre.${c.key}`)}</h3></div>
                  <p className="st-body">{t(`p2.centre.${c.key}Body`)}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p2.promises.title')} description={t('p2.promises.desc')}>
          <div className="st-grid2">
            {PROMISES.map((p) => {
              const plan = planFor(p.codes);
              return (
                <Card key={p.id}>
                  <div className="stack-sm">
                    <div className="st-cardhead">
                      <span className="st-icon-badge"><Icon name={p.icon as IconName} size={20} /></span>
                      <h3>{bi(p.title, lang)}</h3>
                    </div>
                    <p className="st-body">{bi(p.body, lang)}</p>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <Badge tone={STATUS_TONE[plan.status]} size="sm">{statusLabel(plan.status)}</Badge>
                      <Badge tone="neutral" size="sm">{t('site.pass', { n: plan.pass })}</Badge>
                      {p.codes.map((c) => <Badge key={c} tone="neutral" variant="text" size="sm">{c}</Badge>)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p2.method.title')} description={t('p2.method.desc')}>
          <div className="st-grid3">
            {METHOD.map((m) => (
              <Card key={m.id}>
                <div className="stack-sm">
                  <h3 className="serif" style={{ fontSize: 'var(--fs-lg-2)' }}>{bi(m.title, lang)}</h3>
                  <p className="st-body">{bi(m.body, lang)}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p2.links.title')}>
          <div className="st-grid3">
            <Card interactive onClick={() => navigate('/plan')}>
              <div className="stack-sm"><div className="st-cardhead"><span className="st-icon-badge"><Icon name="kanban" size={20} /></span><h3>{t('p2.links.plan')}</h3></div><p className="st-body">{t('p2.links.planBody')}</p></div>
            </Card>
            <Card interactive onClick={() => navigate('/board')}>
              <div className="stack-sm"><div className="st-cardhead"><span className="st-icon-badge"><Icon name="gamepad" size={20} /></span><h3>{t('p2.links.board')}</h3></div><p className="st-body">{t('p2.links.boardBody')}</p></div>
            </Card>
            <Card>
              <div className="stack-sm"><div className="st-cardhead"><span className="st-icon-badge"><Icon name="timeline" size={20} /></span><h3>{t('p2.links.roadmap')}</h3></div><p className="st-body">{t('p2.links.roadmapBody')}</p><div><Link to="/site/proposal/roadmap"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('p2.links.roadmap')}</Button></Link></div></div>
            </Card>
          </div>
        </Section>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? bi(open.label, lang) : ''} width={460}>
        {open && openPlan && <FeatureDetail feature={open} />}
      </Drawer>
    </SiteFrame>
  );
}

function FeatureDetail({ feature }: { feature: Feature }) {
  const { t, lang } = useI18n();
  const plan = planFor(feature.codes);
  return (
    <div className="stack">
      <div className="st-drawer-block">
        <h3>{t('p2.drawer.what')}</h3>
        <p>{bi(feature.what, lang)}</p>
      </div>
      <div className="st-drawer-block">
        <h3>{t('p2.drawer.who')}</h3>
        <div className="row wrap" style={{ gap: 6 }}>
          {feature.roles.map((r) => <Badge key={r} tone="neutral" size="sm">{ROLE_LABEL[r][lang] ?? ROLE_LABEL[r].en}</Badge>)}
        </div>
      </div>
      <div className="st-drawer-block">
        <h3>{t('p2.drawer.when')}</h3>
        <div className="row wrap" style={{ gap: 6 }}>
          <Badge tone={STATUS_TONE[plan.status]} size="sm">{t(`site.status.${plan.status}`)}</Badge>
          <Badge tone="neutral" size="sm">{t('site.pass', { n: plan.pass })}</Badge>
        </div>
      </div>
      <div className="st-drawer-block">
        <h3>{t('p2.drawer.pages')}</h3>
        <div className="row wrap" style={{ gap: 6 }}>{feature.codes.map((c) => <Badge key={c} tone="info" size="sm">{c}</Badge>)}</div>
      </div>
      {plan.tasks.length > 0 && (
        <div className="st-drawer-block">
          <h3>{t('p2.drawer.tasks')}</h3>
          <ul className="st-tasklist">
            {plan.tasks.map((task) => <li key={task.id}><strong>{task.id}</strong> · {task.title}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
