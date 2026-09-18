import { useEffect, useState } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../../atom/Button/Button';
import { Select } from '../../atom/Select/Select';
import { Textarea } from '../../atom/Textarea/Textarea';
import { Icon } from '../../atom/Icon/Icon';
import { Chip } from '../../atom/Chip/Chip';
import { useToast } from '../../molecule/Toast/Toast';
import { useData } from '../../../data/DataContext';
import { useSession } from '../../../auth/SessionProvider';
import { useTheme } from '../../../design/ThemeProvider';
import { useT } from '../../../i18n/I18nProvider';
import { FEEDBACK_KINDS } from '../../../data/schema/core';
import { cssPath } from '../../../dev/a11yScan';
import './FeedbackButton.css';

export interface FeedbackButtonProps { pageCode: string; route: string }
const CATS = ['ui', 'content', 'data', 'legal', 'idea', 'other'];

/** Nearest library component name from the DOM (class prefixes map to components). */
function componentAt(el: Element | null): string | null {
  for (let cur: Element | null = el; cur; cur = cur.parentElement) {
    const cls = [...cur.classList];
    const hit = cls.find((c) => /^(btn|iconbtn|badge|chip|card|field|select|toggle|tabs|seg|datatable|drawer|modal|sidebar|topbar|stattile|section|pageheader|empty|stepper|toast|ph|tip|langtoggle|crumbs|searchinput|depchip|dvf|phoneframe|shell|phoneshell|site2|stub)(-|$)/.test(c));
    if (hit) return hit.split('-')[0];
  }
  return null;
}

/**
 * P-08 annotations: floating button on every staff page; testers leave a comment, request or bug pinned to the page
 * or to one element (click-to-select picker stores the CSS path and the component). Writes to `feedback` with
 * viewport and theme; agents triage from the table and record the decision before changing anything.
 */
export function FeedbackButton({ pageCode, route }: FeedbackButtonProps) {
  const data = useData();
  const { user, role, tenantId } = useSession();
  const { theme } = useTheme();
  const t = useT();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof FEEDBACK_KINDS)[number]>('comment');
  const [cat, setCat] = useState('ui');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pin, setPin] = useState<{ path: string; component: string | null } | null>(null);

  useEffect(() => {
    if (!picking) return;
    document.body.classList.add('is-picking');
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element;
      if (el.closest('.feedbackbtn, .modal, .toasts')) return;
      e.preventDefault(); e.stopPropagation();
      setPin({ path: cssPath(el), component: componentAt(el) });
      setPicking(false); setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPicking(false); setOpen(true); } };
    document.addEventListener('click', onClick, true); document.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('is-picking'); document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey); };
  }, [picking]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await data.insert('feedback', { tenant_id: tenantId ?? 'ten_network', user_id: user.id, user_name: user.name, role, page_code: pageCode, route, kind, category: cat, text: text.trim(), element_path: pin?.path ?? null, component: pin?.component ?? null, viewport: `${window.innerWidth}x${window.innerHeight}`, theme, screenshot_url: null, status: 'new', triage: null, triage_note: null, decision_ref: null, owner_reply: null });
    setBusy(false); setOpen(false); setText(''); setPin(null);
    toast({ tone: 'success', title: t('feedback.thanks'), body: `${pageCode}${pin ? ` · ${pin.component ?? pin.path}` : ''}` });
  };
  return (
    <>
      <button type="button" className="feedbackbtn" onClick={() => setOpen(true)} aria-label={t('feedback.open')}><Icon name="feedback" size={18} /><span className="feedbackbtn-label">{t('feedback.label')}</span></button>
      {picking && <div className="feedback-pick-hint" role="status">{t('feedback.pickHint')}</div>}
      <Modal open={open} onClose={() => setOpen(false)} title={t('feedback.title')} size="sm" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button onClick={send} loading={busy} disabled={!text.trim()}>{t('common.send')}</Button></>}>
        <div className="stack">
          <p className="muted small">{t('feedback.about')}: <code>{pageCode}</code> <span className="faint">{route}</span></p>
          <div className="row wrap" role="group" aria-label={t('feedback.kind')}>{FEEDBACK_KINDS.map((k) => <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{t(`feedback.kind.${k}`)}</Chip>)}</div>
          <Select label={t('feedback.category')} value={cat} onChange={(e) => setCat(e.target.value)} options={CATS.map((c) => ({ value: c, label: t(`feedback.cat.${c}`) }))} />
          <div className="row wrap">
            <Button variant="outline" size="sm" icon="pin" onClick={() => { setOpen(false); setPicking(true); }}>{pin ? t('feedback.repick') : t('feedback.pick')}</Button>
            {pin && <span className="xs muted">{pin.component ? <strong>{pin.component}</strong> : null} <code>{pin.path}</code> <button type="button" className="feedback-unpin" onClick={() => setPin(null)}>{t('common.remove')}</button></span>}
          </div>
          <Textarea label={t('feedback.text')} value={text} onChange={(e) => setText(e.target.value)} maxLength={800} showCount rows={4} placeholder={t('feedback.placeholder')} />
        </div>
      </Modal>
    </>
  );
}
