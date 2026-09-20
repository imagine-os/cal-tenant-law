/**
 * Turning a file a person picked into something the binder can store, in the browser and nowhere else.
 *
 * Three things happen to every file before it is saved (RULE-EVID-04): its bytes are hashed with SHA-256 so the firm
 * can show the original never changed, an image is drawn onto a canvas and squeezed into a small JPEG data URL for
 * the preview, and the file's own timestamp is offered as "when it happened" so a phone photo dates itself. The
 * original bytes are not uploaded anywhere: real file storage is a seam (T-072), and the demo keeps only the preview.
 *
 * Everything degrades rather than throws: no `crypto.subtle` (an insecure origin) means no hash, no canvas means no
 * thumbnail, and the caller still gets a usable record.
 */
export type IntakeKind = 'photo' | 'pdf' | 'document' | 'audio' | 'video' | 'other';

/** Demo budget for a stored preview; the schema column says the same. */
export const MAX_THUMBNAIL_BYTES = 60_000;

export interface PreparedFile {
  /** Local id for list keys; not a row id. */
  id: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  /** Hex digest of the original bytes, or null where crypto.subtle is unavailable. */
  sha256: string | null;
  /** Small JPEG data URL for images (<= MAX_THUMBNAIL_BYTES), null for everything else. */
  thumbnailDataUrl: string | null;
  kind: IntakeKind;
  /** The file's own last-modified date, offered as "when it happened". */
  capturedAt: string | null;
}

export function intakeKindFor(mime: string, fileName = ''): IntakeKind {
  const name = fileName.toLowerCase();
  if (mime.startsWith('image/')) return 'photo';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('text/') || /\.(docx?|rtf|txt|pages|odt)$/.test(name)) return 'document';
  return 'other';
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;
    const digest = await subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

/** Draw an image onto a canvas at most `maxEdge` across and step the JPEG quality down until it fits the budget. */
export async function downscaleImage(file: File, maxBytes = MAX_THUMBNAIL_BYTES, maxEdge = 720): Promise<string | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = url;
    });
    if (!img || !img.width || !img.height) return null;
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    let width = Math.max(1, Math.round(img.width * scale));
    let height = Math.max(1, Math.round(img.height * scale));
    for (const quality of [0.72, 0.6, 0.48, 0.36, 0.26]) {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxBytes) return dataUrl;
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
    return null;
  } catch { return null; }
  finally { URL.revokeObjectURL(url); }
}

let counter = 0;

export async function prepareFile(file: File): Promise<PreparedFile> {
  const mime = file.type || 'application/octet-stream';
  const kind = intakeKindFor(mime, file.name);
  let sha: string | null = null;
  try { sha = await sha256Hex(await file.arrayBuffer()); } catch { sha = null; }
  const thumbnailDataUrl = kind === 'photo' ? await downscaleImage(file) : null;
  return {
    id: `pf_${++counter}_${file.name}`,
    fileName: file.name, mime, sizeBytes: file.size, sha256: sha, thumbnailDataUrl, kind,
    capturedAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
  };
}

export async function prepareFiles(files: File[]): Promise<PreparedFile[]> {
  const out: PreparedFile[] = [];
  for (const f of files) out.push(await prepareFile(f));
  return out;
}

/** "2.1 MB" / "812 KB" - no library, no locale surprises. */
export function fileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
