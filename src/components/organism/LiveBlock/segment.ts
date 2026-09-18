/**
 * Splits a markdown body into plain-markdown runs, live-data directives and capture placeholders, so a page can
 * render each with the right component instead of pushing custom nodes through the markdown renderer.
 *
 * A directive (`{{roles}}`, `{{routes:counsel}}`), a capture placeholder (`[screenshot: F-10 — The intake queue]`) and
 * a callout (`> DECISION NEEDED: ...`) each sit alone on their line; anything else stays markdown and goes to
 * MarkdownViewer untouched. Fenced code is passed through verbatim, so a chapter can show the syntax without
 * triggering it.
 */
export type MarkdownSegment =
  | { kind: 'md'; text: string }
  | { kind: 'live'; name: string; arg?: string; raw: string }
  | { kind: 'shot'; code: string; caption: string; raw: string }
  | { kind: 'callout'; tone: CalloutTone; label: string; text: string; raw: string };

/** Callout kinds a chapter or a doc may write as `> LABEL: text` (English or Spanish). */
export type CalloutTone = 'decision' | 'note' | 'tip' | 'warning' | 'inPerson' | 'inCtlOs';

const CALLOUT_TONES: [RegExp, CalloutTone][] = [
  [/^(DECISION NEEDED|DECISION PENDING|DECISIÓN PENDIENTE|DECISION PENDIENTE)$/i, 'decision'],
  [/^(IN PERSON|EN PERSONA)$/i, 'inPerson'],
  [/^(IN CTL OS|EN CTL OS)$/i, 'inCtlOs'],
  [/^(NOTE|NOTA)$/i, 'note'],
  [/^(TIP|CONSEJO)$/i, 'tip'],
  [/^(WARNING|ADVERTENCIA|AVISO)$/i, 'warning'],
];

const DIRECTIVE = /^\{\{\s*([a-z][a-z0-9-]*)\s*(?::\s*([^}]+?)\s*)?\}\}$/i;
const CALLOUT = /^>\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]{2,24}?)\s*:\s*(.+)$/;
const SHOT = /^\[screenshot:\s*([^\]]+)\]$/i;
const FENCE = /^\s*(```|~~~)/;

export function segmentMarkdown(source: string): MarkdownSegment[] {
  const out: MarkdownSegment[] = [];
  let buffer: string[] = [];
  let fenced = false;
  const flush = () => { const text = buffer.join('\n').trim(); if (text) out.push({ kind: 'md', text }); buffer = []; };
  for (const line of source.split('\n')) {
    if (FENCE.test(line)) { fenced = !fenced; buffer.push(line); continue; }
    if (fenced) { buffer.push(line); continue; }
    const trimmed = line.trim();
    const live = trimmed.match(DIRECTIVE);
    if (live) { flush(); out.push({ kind: 'live', name: live[1].toLowerCase(), arg: live[2]?.trim(), raw: trimmed }); continue; }
    const call = trimmed.match(CALLOUT);
    if (call) {
      const tone = CALLOUT_TONES.find(([re]) => re.test(call[1].trim()))?.[1];
      if (tone) { flush(); out.push({ kind: 'callout', tone, label: call[1].trim(), text: call[2].trim(), raw: trimmed }); continue; }
    }
    const shot = trimmed.match(SHOT);
    if (shot) {
      flush();
      const caption = shot[1].trim();
      out.push({ kind: 'shot', code: caption.match(/^([A-Z]{1,3}-\d{2}[a-z]?)/)?.[1] ?? '', caption, raw: trimmed });
      continue;
    }
    buffer.push(line);
  }
  flush();
  return out;
}

/** Anchor id MarkdownViewer's callers put on a rendered heading (`## In person` -> `in-person`). */
export function headingSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

/** `## headings` of a markdown body, skipping fenced code; the outline rails read this when docmeta is not enough. */
export function outlineOf(source: string): { id: string; text: string; level: 2 | 3 }[] {
  const out: { id: string; text: string; level: 2 | 3 }[] = [];
  let fenced = false;
  for (const line of source.split('\n')) {
    if (FENCE.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const m = line.match(/^(##|###)\s+(.+)$/);
    if (m) { const text = m[2].trim().replace(/\s*#+\s*$/, ''); out.push({ id: headingSlug(text), text, level: m[1] === '##' ? 2 : 3 }); }
  }
  return out;
}
