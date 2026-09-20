import type { KeyboardEvent, ReactNode } from 'react';
import { StatusBadge } from '../../atom/StatusBadge/StatusBadge';
import './DocPreview.css';

/**
 * A preview image of any kind of document, drawn from metadata (SVG + CSS, no rasterisation, no file needed).
 * Prompt 0006: "create a preview image of any type of document". Pleadings draw California pleading paper (28
 * numbered lines, double left rule, caption box); letters a letterhead; court forms boxed fields; evidence a framed
 * photo; email, text thread, receipt, video, audio, article, spreadsheet and a generic page each their own shape.
 * Every colour is a token (`--docp-*` in DocPreview.css), every dimension scales with `--scale`, a clickable preview
 * is a 44 px button with the focus ring, a static one is `role="img"` with an automatic label.
 */
export type DocPreviewKind = 'pleading' | 'motion' | 'letter' | 'court_form' | 'agreement' | 'evidence_photo' | 'email' | 'text_thread' | 'receipt' | 'video' | 'article' | 'audio' | 'spreadsheet' | 'generic';
export type DocPreviewSize = 'xs' | 'sm' | 'md' | 'lg' | 'fill';

export const DOC_PREVIEW_KINDS: DocPreviewKind[] = ['pleading', 'motion', 'letter', 'court_form', 'agreement', 'evidence_photo', 'email', 'text_thread', 'receipt', 'video', 'article', 'audio', 'spreadsheet', 'generic'];

export interface DocPreviewMeta {
  court?: string;
  caption?: { plaintiff: string; defendant: string; caseNumber: string };
  date?: string;
  pages?: number;
  from?: string;
  to?: string;
  messages?: { from: string; text: string }[];
  amount?: string;
  duration?: string;
  thumbnailUrl?: string;
}

export interface DocPreviewProps {
  kind: DocPreviewKind;
  title: string;
  subtitle?: string;
  meta?: DocPreviewMeta;
  /** xs ~64 px wide (table cells), sm ~120, md ~200, lg ~320, fill = the container's width. */
  size?: DocPreviewSize;
  /** Status badge over the bottom-right corner (StatusBadge tone vocabulary). */
  status?: string;
  /** Ribbon across the top-left corner (a pipeline stage label). */
  stage?: string;
  onClick?: () => void;
  /** Override the automatic aria label. */
  ariaLabel?: string;
  className?: string;
}

const KIND_LABEL: Record<DocPreviewKind, string> = {
  pleading: 'Pleading', motion: 'Motion', letter: 'Letter', court_form: 'Court form', agreement: 'Agreement', evidence_photo: 'Photo evidence', email: 'Email',
  text_thread: 'Text messages', receipt: 'Receipt', video: 'Video', article: 'Article', audio: 'Audio', spreadsheet: 'Spreadsheet', generic: 'Document',
};
const VIEWBOX: Record<DocPreviewKind, [number, number]> = {
  pleading: [170, 220], motion: [170, 220], letter: [170, 220], court_form: [170, 220], agreement: [170, 220], article: [170, 220], spreadsheet: [170, 220], generic: [170, 220],
  evidence_photo: [220, 165], email: [220, 165], text_thread: [130, 220], receipt: [110, 220], video: [240, 135], audio: [240, 135],
};

/** Deterministic pseudo-random from the title so two documents never look identical. */
function seeded(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}
const fit = (s: string, max: number): string => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** Grey text bars: a paragraph of `n` lines between x0 and x1, last line shorter. */
function Bars({ x0, x1, y, n, gap, h = 2.2, rnd, cls = 'docp-bar' }: { x0: number; x1: number; y: number; n: number; gap: number; h?: number; rnd: () => number; cls?: string }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const w = i === n - 1 ? (x1 - x0) * (0.35 + rnd() * 0.45) : (x1 - x0) * (0.86 + rnd() * 0.14);
    out.push(<rect key={i} className={cls} x={x0} y={y + i * gap} width={w} height={h} rx={h / 2} />);
  }
  return <>{out}</>;
}

function Photo({ w, h, url, rnd }: { w: number; h: number; url?: string; rnd: () => number }) {
  if (url) return <image href={url} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />;
  const peak = w * (0.3 + rnd() * 0.3);
  return (
    <>
      <rect className="docp-photo" x={0} y={0} width={w} height={h} />
      <circle className="docp-photo-sun" cx={w * 0.78} cy={h * 0.26} r={h * 0.09} />
      <polygon className="docp-photo-hill" points={`0,${h} ${peak},${h * 0.42} ${peak + w * 0.18},${h * 0.66} ${w * 0.72},${h * 0.5} ${w},${h * 0.78} ${w},${h}`} />
      <polygon className="docp-photo-hill-2" points={`0,${h} ${w * 0.22},${h * 0.7} ${w * 0.48},${h} `} />
    </>
  );
}

function Art({ kind, title, meta, rnd }: { kind: DocPreviewKind; title: string; meta: DocPreviewMeta; rnd: () => number }) {
  const [W, H] = VIEWBOX[kind];
  switch (kind) {
    case 'pleading':
    case 'motion': {
      const L = 30, R = 156, top = 22, step = (208 - top) / 27, ly = (n: number) => top + (n - 1) * step;
      const nums = Array.from({ length: 28 }, (_, i) => i + 1);
      const cap = meta.caption;
      const court = (meta.court ?? 'Superior Court of California').toUpperCase();
      const titleLines = fit(title.toUpperCase(), 54).split(' ').reduce<string[]>((acc, w) => { const last = acc[acc.length - 1]; if (last !== undefined && (last + ' ' + w).length <= 19) acc[acc.length - 1] = `${last} ${w}`; else acc.push(w); return acc; }, []).slice(0, 3);
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <line className="docp-rule" x1={24} y1={0} x2={24} y2={H} /><line className="docp-rule" x1={26.5} y1={0} x2={26.5} y2={H} /><line className="docp-rule" x1={R + 3} y1={0} x2={R + 3} y2={H} />
          {nums.map((n) => <text key={n} className="docp-num" x={20} y={ly(n) + 1.6} textAnchor="end">{n}</text>)}
          <Bars x0={L} x1={L + 62} y={ly(1) - 1} n={5} gap={step} h={2.4} rnd={rnd} />
          <text className="docp-text docp-strong" x={(L + R) / 2} y={ly(8) + 1.6} textAnchor="middle">{fit(court, 40)}</text>
          <text className="docp-text" x={(L + R) / 2} y={ly(9) + 1.6} textAnchor="middle">{fit(meta.court ? 'LIMITED CIVIL · UNLAWFUL DETAINER' : 'COUNTY OF LOS ANGELES', 40)}</text>
          {cap ? <text className="docp-text" x={L} y={ly(11) + 1.6}>{fit(cap.plaintiff.toUpperCase(), 22)},</text> : <rect className="docp-bar" x={L} y={ly(11) - 1} width={46} height={2.4} rx={1.2} />}
          <text className="docp-faint" x={L + 14} y={ly(12) + 1.6}>Plaintiff,</text>
          <text className="docp-text" x={L + 14} y={ly(13) + 1.6}>v.</text>
          {cap ? <text className="docp-text" x={L} y={ly(14) + 1.6}>{fit(cap.defendant.toUpperCase(), 22)},</text> : <rect className="docp-bar" x={L} y={ly(14) - 1} width={52} height={2.4} rx={1.2} />}
          <text className="docp-faint" x={L + 14} y={ly(15) + 1.6}>Defendant.</text>
          <line className="docp-hair" x1={92} y1={ly(10) - 2} x2={92} y2={ly(16) - 2} />
          <line className="docp-hair" x1={L} y1={ly(16) - 2} x2={92} y2={ly(16) - 2} />
          <text className="docp-text" x={96} y={ly(10) + 1.6}>Case No. {cap ? fit(cap.caseNumber, 14) : '________'}</text>
          {titleLines.map((t, i) => <text key={i} className="docp-text docp-strong" x={96} y={ly(12 + i) + 1.6}>{t}</text>)}
          {kind === 'motion' && <><text className="docp-faint" x={96} y={ly(15) + 1.6}>Hearing: {meta.date ? fit(meta.date, 12) : '__/__/____'}</text><text className="docp-faint" x={96} y={ly(16) + 1.6}>Dept. __ · Time __:__</text></>}
          <Bars x0={L} x1={R} y={ly(18) - 1} n={5} gap={step} rnd={rnd} />
          <Bars x0={L} x1={R} y={ly(24) - 1} n={4} gap={step} rnd={rnd} />
        </>
      );
    }
    case 'letter':
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <rect className="docp-brand" x={18} y={16} width={10} height={10} rx={2} />
          <rect className="docp-bar docp-strong-bar" x={32} y={17} width={48} height={3} rx={1.5} /><rect className="docp-bar" x={32} y={23} width={34} height={2} rx={1} />
          <rect className="docp-bar" x={118} y={18} width={34} height={2} rx={1} /><rect className="docp-bar" x={124} y={23} width={28} height={2} rx={1} />
          <line className="docp-hair" x1={18} y1={34} x2={152} y2={34} />
          <text className="docp-faint" x={152} y={46} textAnchor="end">{meta.date ?? 'September 20, 2026'}</text>
          <Bars x0={18} x1={80} y={54} n={3} gap={5} rnd={rnd} />
          <text className="docp-text docp-strong" x={18} y={78}>Re: {fit(title, 34)}</text>
          <Bars x0={18} x1={152} y={86} n={6} gap={5.2} rnd={rnd} /><Bars x0={18} x1={152} y={122} n={5} gap={5.2} rnd={rnd} /><Bars x0={18} x1={152} y={154} n={3} gap={5.2} rnd={rnd} />
          <path className="docp-ink-stroke" d="M22 190 c 6 -12, 10 6, 16 -4 s 8 -8, 14 0 s 10 4, 18 -6" />
          <line className="docp-hair" x1={18} y1={196} x2={80} y2={196} /><rect className="docp-bar" x={18} y={200} width={40} height={2.2} rx={1.1} />
        </>
      );
    case 'court_form': {
      const rows = [46, 66, 86, 106, 126, 146];
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <rect className="docp-box" x={10} y={10} width={98} height={26} /><rect className="docp-box" x={110} y={10} width={50} height={26} />
          <text className="docp-text docp-strong" x={13} y={17}>{fit(title.toUpperCase(), 30)}</text><rect className="docp-bar" x={13} y={22} width={70} height={2} rx={1} /><rect className="docp-bar" x={13} y={27} width={54} height={2} rx={1} />
          <text className="docp-faint" x={135} y={24} textAnchor="middle">FOR COURT USE ONLY</text>
          {rows.map((y, i) => (
            <g key={y}>
              <rect className="docp-box" x={10} y={y} width={i % 3 === 1 ? 150 : 74} height={16} />
              {i % 3 !== 1 && <rect className="docp-box" x={86} y={y} width={74} height={16} />}
              <text className="docp-faint" x={12} y={y + 4.5}>{i + 1}.</text>
              <rect className="docp-bar" x={18} y={y + 8} width={40 + rnd() * 24} height={2.2} rx={1.1} />
              {i % 3 !== 1 && <rect className="docp-bar" x={94} y={y + 8} width={30 + rnd() * 30} height={2.2} rx={1.1} />}
            </g>
          ))}
          {[168, 178, 188].map((y, i) => (
            <g key={y}>
              <rect className="docp-box" x={12} y={y} width={5} height={5} />{i !== 1 && <path className="docp-check" d={`M13 ${y + 2.6} l1.4 1.4 l2.4 -2.8`} />}
              <rect className="docp-bar" x={21} y={y + 1.5} width={50 + rnd() * 60} height={2.2} rx={1.1} />
            </g>
          ))}
          <line className="docp-hair" x1={10} y1={204} x2={160} y2={204} /><text className="docp-faint" x={10} y={210}>Form adopted for mandatory use · Page 1 of {meta.pages ?? 2}</text>
        </>
      );
    }
    case 'agreement':
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <text className="docp-text docp-strong" x={W / 2} y={24} textAnchor="middle">{fit(title.toUpperCase(), 32)}</text>
          <line className="docp-hair" x1={40} y1={29} x2={130} y2={29} />
          <Bars x0={20} x1={150} y={38} n={3} gap={5} rnd={rnd} />
          {[60, 84, 108, 132].map((y, i) => (<g key={y}><text className="docp-text docp-strong" x={20} y={y + 2}>{i + 1}.</text><Bars x0={28} x1={150} y={y} n={3} gap={5} rnd={rnd} /></g>))}
          <line className="docp-hair" x1={20} y1={186} x2={78} y2={186} /><line className="docp-hair" x1={92} y1={186} x2={150} y2={186} />
          <path className="docp-ink-stroke" d="M24 182 c 5 -10, 9 4, 14 -3 s 7 -6, 12 0 s 8 3, 14 -5" />
          <rect className="docp-bar" x={20} y={190} width={36} height={2} rx={1} /><rect className="docp-bar" x={92} y={190} width={36} height={2} rx={1} />
          <text className="docp-faint" x={20} y={200}>Tenant</text><text className="docp-faint" x={92} y={200}>Landlord</text>
        </>
      );
    case 'evidence_photo':
      return (
        <>
          <Photo w={W} h={H} url={meta.thumbnailUrl} rnd={rnd} />
          <rect className="docp-scrim" x={0} y={H - 22} width={W} height={22} />
          <text className="docp-on-dark docp-strong" x={8} y={H - 12}>{fit(title, 40)}</text>
          <text className="docp-on-dark-faint" x={8} y={H - 4.5}>{meta.date ?? 'undated'} · IMG_{String(1000 + Math.floor(rnd() * 8999))}.jpg · geotag off</text>
        </>
      );
    case 'email':
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <circle className="docp-brand" cx={20} cy={20} r={9} /><text className="docp-on-brand docp-strong" x={20} y={22.5} textAnchor="middle">{(meta.from ?? 'CTL').slice(0, 2).toUpperCase()}</text>
          <text className="docp-text docp-strong" x={34} y={17}>{fit(meta.from ?? 'California Tenant Law', 34)}</text>
          <text className="docp-faint" x={34} y={25}>to {fit(meta.to ?? 'client', 30)} · {meta.date ?? 'today'}</text>
          <text className="docp-text docp-strong" x={12} y={44}>{fit(title, 44)}</text>
          <line className="docp-hair" x1={12} y1={50} x2={208} y2={50} />
          <Bars x0={12} x1={208} y={58} n={5} gap={7} h={2.6} rnd={rnd} /><Bars x0={12} x1={208} y={98} n={3} gap={7} h={2.6} rnd={rnd} />
          <rect className="docp-box" x={12} y={136} width={70} height={16} rx={3} /><rect className="docp-bar" x={18} y={143} width={44} height={2.4} rx={1.2} /><path className="docp-clip" d="M74 140 v8 a3 3 0 0 1 -6 0 v-6" />
        </>
      );
    case 'text_thread': {
      const msgs = (meta.messages ?? [{ from: 'them', text: 'Rent is late again' }, { from: 'me', text: 'The heater still is not fixed' }, { from: 'them', text: 'Not my problem' }, { from: 'me', text: 'It is under Civil Code 1941' }]).slice(0, 5);
      let y = 32;
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <rect className="docp-surface2" x={0} y={0} width={W} height={20} />
          <text className="docp-text docp-strong" x={W / 2} y={12.5} textAnchor="middle">{fit(meta.from ?? title, 24)}</text>
          {msgs.map((m, i) => {
            const mine = m.from === 'me' || m.from === 'client';
            const text = fit(m.text, 24); const w = Math.min(W - 24, 12 + text.length * 3.1); const h = 14; const x = mine ? W - 8 - w : 8; const yy = y; y += h + 6;
            return (<g key={i}><rect className={mine ? 'docp-bubble-me' : 'docp-bubble-them'} x={x} y={yy} width={w} height={h} rx={5} /><text className={mine ? 'docp-on-brand' : 'docp-text'} x={x + 6} y={yy + 9}>{text}</text></g>);
          })}
          <text className="docp-faint" x={W / 2} y={y + 4} textAnchor="middle">{meta.date ?? 'Delivered'}</text>
          <rect className="docp-box" x={8} y={H - 18} width={W - 16} height={11} rx={5.5} />
        </>
      );
    }
    case 'receipt':
      return (
        <>
          <polygon className="docp-paper" points={`0,0 ${W},0 ${W},${H - 6} ${Array.from({ length: 11 }, (_, i) => `${W - i * (W / 10)},${i % 2 ? H - 6 : H}`).join(' ')} 0,${H - 6}`} />
          <text className="docp-text docp-strong" x={W / 2} y={16} textAnchor="middle">CALIFORNIA TENANT LAW</text>
          <text className="docp-faint" x={W / 2} y={23} textAnchor="middle">{meta.date ?? 'receipt'}</text>
          <line className="docp-dash" x1={10} y1={30} x2={W - 10} y2={30} />
          {[40, 50, 60, 70].map((y, i) => (<g key={y}><rect className="docp-bar" x={10} y={y} width={40 + rnd() * 24} height={2.2} rx={1.1} /><rect className="docp-bar" x={W - 30} y={y} width={20} height={2.2} rx={1.1} />{i === 0 && <text className="docp-faint" x={10} y={y + 8}>{fit(title, 26)}</text>}</g>))}
          <line className="docp-dash" x1={10} y1={84} x2={W - 10} y2={84} />
          <text className="docp-text docp-strong" x={10} y={98}>TOTAL</text><text className="docp-text docp-strong docp-amount" x={W - 10} y={98} textAnchor="end">{meta.amount ?? '$0.00'}</text>
          <text className="docp-faint" x={10} y={108}>as listed · unverified</text>
          {Array.from({ length: 26 }, (_, i) => <rect key={i} className="docp-ink" x={12 + i * 3.3} y={150} width={rnd() > 0.5 ? 1.6 : 0.8} height={22} />)}
          <text className="docp-faint" x={W / 2} y={182} textAnchor="middle">Thank you</text>
        </>
      );
    case 'video':
      return (
        <>
          {meta.thumbnailUrl ? <image href={meta.thumbnailUrl} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" /> : <rect className="docp-dark" x={0} y={0} width={W} height={H} />}
          {!meta.thumbnailUrl && <><rect className="docp-dark-2" x={20} y={18} width={W - 40} height={H - 50} rx={4} /><Bars x0={30} x1={W - 30} y={30} n={2} gap={8} h={3} rnd={rnd} cls="docp-on-dark-bar" /></>}
          <circle className="docp-play" cx={W / 2} cy={H / 2} r={17} /><polygon className="docp-play-glyph" points={`${W / 2 - 5},${H / 2 - 8} ${W / 2 - 5},${H / 2 + 8} ${W / 2 + 9},${H / 2}`} />
          <rect className="docp-scrim" x={W - 44} y={H - 22} width={38} height={13} rx={3} /><text className="docp-on-dark docp-strong" x={W - 25} y={H - 12.5} textAnchor="middle">{meta.duration ?? '00:00'}</text>
          <rect className="docp-track" x={0} y={H - 3} width={W} height={3} /><rect className="docp-progress" x={0} y={H - 3} width={W * (0.2 + rnd() * 0.5)} height={3} />
        </>
      );
    case 'audio':
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <circle className="docp-brand" cx={30} cy={H / 2} r={16} /><polygon className="docp-on-brand-fill" points={`${26},${H / 2 - 7} ${26},${H / 2 + 7} ${38},${H / 2}`} />
          {Array.from({ length: 40 }, (_, i) => { const h = 6 + rnd() * 44; return <rect key={i} className={i < 15 ? 'docp-brand' : 'docp-bar'} x={56 + i * 4.2} y={H / 2 - h / 2} width={2.4} height={h} rx={1.2} />; })}
          <text className="docp-text docp-strong" x={56} y={H - 18}>{fit(title, 40)}</text><text className="docp-faint" x={W - 12} y={H - 18} textAnchor="end">{meta.duration ?? '00:00'}</text>
        </>
      );
    case 'article':
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <g><Photo w={W} h={64} url={meta.thumbnailUrl} rnd={rnd} /></g>
          <rect className="docp-bar docp-strong-bar" x={14} y={76} width={130} height={4} rx={2} /><rect className="docp-bar docp-strong-bar" x={14} y={84} width={92} height={4} rx={2} />
          <text className="docp-faint" x={14} y={96}>{fit(meta.from ?? 'caltenantlaw.com', 24)} · {meta.date ?? ''}</text>
          <Bars x0={14} x1={82} y={104} n={12} gap={5.2} rnd={rnd} /><Bars x0={88} x1={156} y={104} n={12} gap={5.2} rnd={rnd} />
        </>
      );
    case 'spreadsheet': {
      const cols = [14, 44, 84, 124, 156], rows = Array.from({ length: 11 }, (_, i) => 30 + i * 15);
      return (
        <>
          <rect className="docp-paper" x={0} y={0} width={W} height={H} />
          <text className="docp-text docp-strong" x={14} y={20}>{fit(title, 40)}</text>
          <rect className="docp-surface2" x={14} y={30} width={142} height={15} />
          {rows.map((y) => <line key={y} className="docp-grid" x1={14} y1={y} x2={156} y2={y} />)}<line className="docp-grid" x1={14} y1={rows[rows.length - 1] + 15} x2={156} y2={rows[rows.length - 1] + 15} />
          {cols.map((x) => <line key={x} className="docp-grid" x1={x} y1={30} x2={x} y2={rows[rows.length - 1] + 15} />)}
          {['Date', 'Item', 'Paid', 'Balance'].map((h, i) => <text key={h} className="docp-faint docp-strong" x={cols[i] + 3} y={40}>{h}</text>)}
          {rows.slice(1).map((y, r) => cols.slice(0, 4).map((x, c) => <rect key={`${r}-${c}`} className="docp-bar" x={x + 3} y={y + 6} width={(cols[c + 1] - x - 6) * (0.4 + rnd() * 0.55)} height={2.2} rx={1.1} />))}
        </>
      );
    }
    default:
      return (
        <>
          <path className="docp-paper" d={`M0 0 H${W - 28} L${W} 28 V${H} H0 Z`} /><path className="docp-fold" d={`M${W - 28} 0 V28 H${W} Z`} />
          <rect className="docp-bar docp-strong-bar" x={18} y={30} width={96} height={4} rx={2} /><rect className="docp-bar docp-strong-bar" x={18} y={38} width={64} height={4} rx={2} />
          <Bars x0={18} x1={152} y={54} n={7} gap={6} rnd={rnd} /><Bars x0={18} x1={152} y={102} n={6} gap={6} rnd={rnd} /><Bars x0={18} x1={152} y={144} n={5} gap={6} rnd={rnd} />
          {meta.pages && meta.pages > 1 && <text className="docp-faint" x={W - 14} y={H - 8} textAnchor="end">1 / {meta.pages}</text>}
        </>
      );
  }
}

export function DocPreview({ kind, title, subtitle, meta = {}, size = 'md', status, stage, onClick, ariaLabel, className = '' }: DocPreviewProps) {
  const [W, H] = VIEWBOX[kind];
  const label = ariaLabel ?? [`${KIND_LABEL[kind]}: ${title}`, subtitle, stage, status ? status.replace(/_/g, ' ') : null].filter(Boolean).join(', ');
  const rnd = seeded(`${kind}:${title}`);
  const classes = `docp docp-${size} docp-kind-${kind} ${onClick ? 'is-clickable' : ''} ${className}`;
  const onKey = (ev: KeyboardEvent) => { if (onClick && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); onClick(); } };
  const inner = (
    <>
      <span className="docp-stage" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false"><Art kind={kind} title={title} meta={meta} rnd={rnd} /></svg>
        {stage && <span className="docp-ribbon"><span>{stage}</span></span>}
        {status && <span className="docp-status"><StatusBadge status={status} size="sm" /></span>}
      </span>
      {size !== 'xs' && (
        <span className="docp-caption">
          <span className="docp-title">{title}</span>
          {subtitle && <span className="docp-sub">{subtitle}</span>}
        </span>
      )}
    </>
  );
  return onClick
    ? <button type="button" className={classes} aria-label={label} onClick={onClick} onKeyDown={onKey}>{inner}</button>
    : <span className={classes} role="img" aria-label={label}>{inner}</span>;
}

/**
 * Picks a preview kind for a stored document: `documents.kind` (template | filed | evidence | upload), `orders.document_kind`
 * (pleading | motion | discovery | letter | form | agreement | other), a mime type and the title, in that order of confidence.
 */
export function docPreviewKindFor(doc: { kind?: string | null; document_kind?: string | null; mime?: string | null; title?: string | null }): DocPreviewKind {
  const mime = (doc.mime ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'evidence_photo';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'message/rfc822' || mime.includes('outlook')) return 'email';
  if (mime.includes('spreadsheet') || mime === 'text/csv' || mime.includes('excel')) return 'spreadsheet';
  switch (doc.document_kind) {
    case 'pleading': case 'discovery': return 'pleading';
    case 'motion': return 'motion';
    case 'letter': return 'letter';
    case 'form': return 'court_form';
    case 'agreement': return 'agreement';
    default: break;
  }
  const t = (doc.title ?? '').toLowerCase();
  if (/\b(photo|photos|picture|mold|damage|img_)\b/.test(t)) return 'evidence_photo';
  if (/\b(text message|texts|sms|whatsapp|imessage)\b/.test(t)) return 'text_thread';
  if (/\b(email|e-mail)\b/.test(t)) return 'email';
  if (/\b(receipt|money order|payment confirmation)\b/.test(t)) return 'receipt';
  if (/\b(ledger|statement|statements|spreadsheet|csv)\b/.test(t)) return 'spreadsheet';
  if (/\b(video|recording)\b/.test(t)) return 'video';
  if (/\b(voicemail|audio)\b/.test(t)) return 'audio';
  if (/\b(motion|ex parte|application)\b/.test(t)) return 'motion';
  if (/\b(letter|demand|meet-and-confer|meet and confer)\b/.test(t)) return 'letter';
  if (/\b(agreement|stipulation|settlement)\b/.test(t)) return 'agreement';
  if (/\b(form|ud-\d+|interrogator|summons|3-day notice|notice to (pay|quit))\b/.test(t)) return 'court_form';
  if (/\b(answer|demurrer|complaint|brief|opposition|reply|declaration|proof of service|notice of appeal|request for|requests for)\b/.test(t)) return 'pleading';
  if (doc.kind === 'evidence') return 'evidence_photo';
  if (doc.kind === 'template' || doc.kind === 'filed') return 'pleading';
  if (/\b(article|blog|guide)\b/.test(t)) return 'article';
  return 'generic';
}
