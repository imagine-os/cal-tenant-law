/**
 * Turning a conversation a client has in their hand into rows the binder can keep (RULE-EVID-03: the original text
 * is preserved, never rewritten, and a line we cannot parse is kept as its own message rather than dropped).
 *
 * Three shapes arrive in practice, and all of them are plain text in the end:
 *   `[9/12/2026, 3:04 PM] Alex Ordoñez: the plumber comes Tuesday`   (iPhone copy, many export tools)
 *   `Alex Ordoñez (9/12/2026): the plumber comes Tuesday`            (Android exports, printed transcripts)
 *   `9/12/26, 3:04 PM - Alex Ordoñez: the plumber comes Tuesday`     (the standard WhatsApp .txt export)
 * A CSV export (date, from, message columns in any order) and a JSON export (an array of message objects) are
 * read too, because that is what the phone tools produce. Everything runs in the browser; nothing is uploaded.
 */
export interface ParsedMessage {
  direction: 'incoming' | 'outgoing';
  fromLabel: string;
  toLabel: string | null;
  sentAt: string;
  subject: string | null;
  body: string;
  hasAttachments: boolean;
}

export interface ParsedConversation {
  messages: ParsedMessage[];
  /** Everyone who appears as a sender, in first-seen order. */
  participants: string[];
  /** Earliest and latest message, for the review summary shown before saving. */
  firstAt: string | null;
  lastAt: string | null;
  /** Lines kept verbatim because no pattern matched them. */
  unparsedLines: number;
  /** Messages whose date could not be read; they carry the import time instead. */
  undatedMessages: number;
}

const EMPTY: ParsedConversation = { messages: [], participants: [], firstAt: null, lastAt: null, unparsedLines: 0, undatedMessages: 0 };

const ATTACHMENT_HINT = /<attached:|image omitted|imagen omitida|<media omitted>|attachment:/i;

/** Tolerant date reading: ISO, "9/12/2026, 3:04 PM", "9/12/26 15:04", "Sep 12, 2026". Returns null when unreadable. */
export function readDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim().replace(/ | /g, ' ');
  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return new Date(direct).toISOString();
  const m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?)?$/i);
  if (!m) return null;
  const [, mo, d, y, hh, mi, ss, ampm] = m;
  const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);
  let hour = hh ? Number(hh) : 12;
  if (ampm) {
    const pm = /p/i.test(ampm);
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  const date = new Date(year, Number(mo) - 1, Number(d), hour, mi ? Number(mi) : 0, ss ? Number(ss) : 0);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const isSelf = (name: string, selfNames: string[]): boolean => {
  const n = name.trim().toLowerCase();
  return selfNames.some((s) => s.trim().length > 0 && (n === s.toLowerCase() || n.startsWith(`${s.toLowerCase()} `) || s.toLowerCase().startsWith(n)));
};

interface Draft { from: string; dateRaw: string | null; lines: string[] }

/** One line -> a new message, or null when the line continues the previous one. */
function openMessage(line: string): Draft | null {
  // [date] Name: text
  const bracket = line.match(/^\[([^\]]+)\]\s*([^:]{1,60}?):\s?([\s\S]*)$/);
  if (bracket) return { from: bracket[2], dateRaw: bracket[1], lines: [bracket[3]] };
  // date - Name: text  (WhatsApp)
  const dash = line.match(/^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s*(?:\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)?)\s*[-–]\s*([^:]{1,60}?):\s?([\s\S]*)$/i);
  if (dash) return { from: dash[2], dateRaw: dash[1], lines: [dash[3]] };
  // Name (date): text
  const paren = line.match(/^([^():]{1,60}?)\s*\(([^)]+)\):\s?([\s\S]*)$/);
  if (paren) return { from: paren[1], dateRaw: paren[2], lines: [paren[3]] };
  // Name: text  (no date at all)
  const bare = line.match(/^([A-Za-zÀ-ÿ0-9 .'+_-]{1,40}):\s(.+)$/);
  if (bare) return { from: bare[1], dateRaw: null, lines: [bare[2]] };
  return null;
}

/**
 * Parse a pasted or exported conversation. `selfNames` are the names that mean "the client" (their own first name,
 * "Me", "Yo"), which is the only thing that decides direction; anything else is incoming.
 */
export function parseConversation(text: string, selfNames: string[] = ['me', 'yo'], importedAt = new Date().toISOString()): ParsedConversation {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const drafts: Draft[] = [];
  let unparsed = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const opened = openMessage(line.trimStart());
    if (opened) { drafts.push(opened); continue; }
    const last = drafts[drafts.length - 1];
    if (last) last.lines.push(line);              // a continuation: keep it with its message
    else { drafts.push({ from: 'Unknown', dateRaw: null, lines: [line] }); unparsed++; }
  }
  if (drafts.length === 0) return EMPTY;

  const participants: string[] = [];
  let undated = 0;
  const messages: ParsedMessage[] = drafts.map((d) => {
    const from = d.from.trim() || 'Unknown';
    if (!participants.includes(from)) participants.push(from);
    const sentAt = readDate(d.dateRaw);
    if (!sentAt) undated++;
    const body = d.lines.join('\n').trim();
    return {
      direction: isSelf(from, selfNames) ? 'outgoing' : 'incoming',
      fromLabel: from, toLabel: null, sentAt: sentAt ?? importedAt, subject: null, body,
      hasAttachments: ATTACHMENT_HINT.test(body),
    };
  });
  const dates = messages.map((m) => m.sentAt).sort();
  return { messages, participants, firstAt: dates[0] ?? null, lastAt: dates[dates.length - 1] ?? null, unparsedLines: unparsed, undatedMessages: undated };
}

/** The standard WhatsApp .txt export is the dash format with its own system lines; those are kept as messages. */
export function parseWhatsAppExport(text: string, selfNames: string[] = ['me', 'yo'], importedAt?: string): ParsedConversation {
  return parseConversation(text, selfNames, importedAt);
}

interface LooseRow { [key: string]: unknown }

const pick = (row: LooseRow, keys: string[]): string | null => {
  for (const k of Object.keys(row)) if (keys.includes(k.trim().toLowerCase())) { const v = row[k]; if (v != null && String(v).length > 0) return String(v); }
  return null;
};

/** Split one CSV line, honouring quotes. */
function csvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function fromRows(rows: LooseRow[], selfNames: string[], importedAt: string): ParsedConversation {
  const participants: string[] = [];
  let undated = 0;
  const messages: ParsedMessage[] = rows.map((r): ParsedMessage => {
    const from = pick(r, ['from', 'sender', 'author', 'de', 'remitente']) ?? 'Unknown';
    if (!participants.includes(from)) participants.push(from);
    const sentAt = readDate(pick(r, ['date', 'sent_at', 'timestamp', 'time', 'datetime', 'fecha']));
    if (!sentAt) undated++;
    const body = pick(r, ['text', 'body', 'message', 'content', 'mensaje', 'texto']) ?? '';
    const to = pick(r, ['to', 'recipient', 'para']);
    const direction = pick(r, ['direction', 'type']);
    return {
      direction: direction ? (/out|sent|enviado/i.test(direction) ? 'outgoing' : 'incoming') : isSelf(from, selfNames) ? 'outgoing' : 'incoming',
      fromLabel: from, toLabel: to, sentAt: sentAt ?? importedAt,
      subject: pick(r, ['subject', 'asunto']), body, hasAttachments: /true|1|yes/i.test(pick(r, ['has_attachments', 'attachments']) ?? ''),
    };
  }).filter((m) => m.body.trim().length > 0);
  const dates = messages.map((m) => m.sentAt).sort();
  return { messages, participants, firstAt: dates[0] ?? null, lastAt: dates[dates.length - 1] ?? null, unparsedLines: 0, undatedMessages: undated };
}

/** A phone export file: .json (array of message objects), .csv (date / from / text columns) or .txt (the line formats). */
export function parseExportFile(fileName: string, text: string, selfNames: string[] = ['me', 'yo'], importedAt = new Date().toISOString()): ParsedConversation {
  const name = fileName.toLowerCase();
  if (name.endsWith('.json')) {
    try {
      const parsed: unknown = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : (parsed as { messages?: unknown }).messages;
      if (Array.isArray(rows)) return fromRows(rows as LooseRow[], selfNames, importedAt);
    } catch { /* fall through to the text parser: a broken export is still readable as lines */ }
    return parseConversation(text, selfNames, importedAt);
  }
  if (name.endsWith('.csv')) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return EMPTY;
    const header = csvLine(lines[0]).map((h) => h.trim());
    const rows = lines.slice(1).map((l) => Object.fromEntries(csvLine(l).map((v, i) => [header[i] ?? `col${i}`, v])) as LooseRow);
    return fromRows(rows, selfNames, importedAt);
  }
  return parseConversation(text, selfNames, importedAt);
}

/** "7 messages · Jan 12 to Sep 8 · Dana, Property manager" - the summary shown before anything is saved. */
export function summarise(parsed: ParsedConversation, fmt: (iso: string | null) => string): { count: number; range: string; participants: string } {
  return {
    count: parsed.messages.length,
    range: parsed.firstAt ? `${fmt(parsed.firstAt)} → ${fmt(parsed.lastAt)}` : '—',
    participants: parsed.participants.join(', '),
  };
}
