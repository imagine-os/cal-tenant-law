import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import { Drawer } from '../Drawer/Drawer';
import { Button } from '../../atom/Button/Button';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Icon } from '../../atom/Icon/Icon';
import { Input } from '../../atom/Input/Input';
import { Textarea } from '../../atom/Textarea/Textarea';
import { Select } from '../../atom/Select/Select';
import { Spinner } from '../../atom/Spinner/Spinner';
import { Badge } from '../../atom/Badge/Badge';
import { useI18n } from '../../../i18n/I18nProvider';
import { fileSize, prepareFiles, type PreparedFile } from './fileIntake';
import './UploadSheet.css';

export interface UploadSheetPhase { id: string; label: string }

export interface UploadSheetSubmit {
  files: PreparedFile[];
  title: string;
  description: string;
  /** ISO date (yyyy-mm-dd) of when the thing happened, or null. */
  capturedAt: string | null;
  /** Board phase id the person chose, or null. */
  phase: string | null;
}

export interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called with the prepared files (hashed, images already downscaled) and the fields. */
  onSubmit: (value: UploadSheetSubmit) => void | Promise<void>;
  /** Sheet heading; defaults to "Add to your binder". */
  heading?: string;
  /** The request this answers, shown as a callout at the top. */
  prompt?: string | null;
  detail?: string | null;
  /** Board phases to file it under. */
  phases?: UploadSheetPhase[];
  defaultPhase?: string | null;
  /** Prefill for "when it happened" (yyyy-mm-dd). */
  defaultCapturedAt?: string;
  accept?: string;
  /** Offer the camera button (a phone opens the camera directly). */
  allowCamera?: boolean;
  /** The caller is writing; the sheet shows a spinner and blocks a second submit. */
  busy?: boolean;
}

const COPY = {
  heading: { en: 'Add to your binder', es: 'Agregar a su carpeta' },
  drop: { en: 'Drop files here, or use a button below', es: 'Suelte archivos aquí o use un botón abajo' },
  choose: { en: 'Choose files', es: 'Elegir archivos' },
  camera: { en: 'Take a photo', es: 'Tomar una foto' },
  paste: { en: 'Paste from clipboard', es: 'Pegar del portapapeles' },
  pasteHint: { en: 'You can also press Ctrl+V (Cmd+V) anywhere in this sheet.', es: 'También puede pulsar Ctrl+V (Cmd+V) en cualquier parte de esta hoja.' },
  reading: { en: 'Reading your files…', es: 'Leyendo sus archivos…' },
  chosen: { en: 'Chosen', es: 'Elegidos' },
  remove: { en: 'Remove', es: 'Quitar' },
  title: { en: 'What is it?', es: '¿Qué es?' },
  titleHint: { en: 'A few words, like "Mould behind the bathroom wall".', es: 'Unas palabras, por ejemplo "Moho detrás de la pared del baño".' },
  description: { en: 'Anything we should know', es: 'Algo que debamos saber' },
  when: { en: 'When did it happen?', es: '¿Cuándo pasó?' },
  whenHint: { en: 'The day of the photo, the notice or the message - not today.', es: 'El día de la foto, del aviso o del mensaje, no el de hoy.' },
  phase: { en: 'Where does it belong?', es: '¿A qué parte pertenece?' },
  phaseAuto: { en: 'Let the office decide', es: 'Que lo decida la oficina' },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  save: { en: 'Add to binder', es: 'Agregar a la carpeta' },
  noFiles: { en: 'Choose at least one file, or take a photo.', es: 'Elija al menos un archivo o tome una foto.' },
  hashed: { en: 'hashed', es: 'con huella' },
  privacy: { en: 'Your file stays on your device in this demo: we keep a small preview, its name, size and a fingerprint (SHA-256).', es: 'En esta demostración su archivo permanece en su dispositivo: guardamos una vista previa pequeña, el nombre, el tamaño y una huella (SHA-256).' },
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * The one way anything gets into the binder from a phone or a desk: pick files, take a photo, drag and drop or
 * paste, say what it is and when it happened, and save. Every route into the sheet has a button as well as a
 * gesture (P-03: nothing drag-only), the targets are 44 px, and the fields are ordinary labelled inputs so a
 * keyboard, a pen or a screen reader can complete it in order.
 *
 * The sheet does the browser-side work itself through `fileIntake.ts`: SHA-256 of the original bytes, a canvas
 * downscale of images to a small JPEG data URL, and the file's own timestamp offered as "when it happened"
 * (RULE-EVID-04). It never writes: the page decides which table the result belongs in.
 */
export function UploadSheet({
  open, onClose, onSubmit, heading, prompt, detail, phases = [], defaultPhase = null,
  defaultCapturedAt, accept = 'image/*,application/pdf', allowCamera = true, busy = false,
}: UploadSheetProps) {
  const { lang } = useI18n();
  const say = useCallback((k: keyof typeof COPY) => COPY[k][lang] ?? COPY[k].en, [lang]);
  const [files, setFiles] = useState<PreparedFile[]>([]);
  const [reading, setReading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(defaultCapturedAt ?? today());
  const [phase, setPhase] = useState<string>(defaultPhase ?? '');
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) return;
    setFiles([]); setTitle(''); setDescription(''); setWhen(defaultCapturedAt ?? today());
    setPhase(defaultPhase ?? ''); setDragging(false); setTouched(false);
  }, [open, defaultPhase, defaultCapturedAt]);

  const take = useCallback(async (list: FileList | File[] | null) => {
    const arr = list ? Array.from(list) : [];
    if (arr.length === 0) return;
    setReading(true);
    const prepared = await prepareFiles(arr);
    setFiles((prev) => [...prev, ...prepared]);
    setTitle((prev) => prev || prepared[0].fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '));
    const captured = prepared.find((p) => p.capturedAt)?.capturedAt;
    if (captured) setWhen(captured.slice(0, 10));
    setReading(false);
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); void take(e.dataTransfer?.files ?? null); };
  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData?.files ?? []);
    if (items.length > 0) { e.preventDefault(); void take(items); }
  };
  const pasteFromClipboard = async () => {
    try {
      const read = (navigator.clipboard as { read?: () => Promise<ClipboardItem[]> } | undefined)?.read;
      if (!read) return;
      const items = await read.call(navigator.clipboard);
      const out: File[] = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (!type) continue;
        const blob = await item.getType(type);
        out.push(new File([blob], `pasted-${Date.now()}.${type.split('/')[1]}`, { type }));
      }
      await take(out);
    } catch { /* clipboard blocked: the drop zone and the buttons still work */ }
  };

  const canSubmit = files.length > 0 && !reading && !busy;
  const phaseOptions = useMemo(() => [{ value: '', label: say('phaseAuto') }, ...phases.map((p) => ({ value: p.id, label: p.label }))], [phases, say]);

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    void onSubmit({ files, title: title.trim() || files[0].fileName, description: description.trim(), capturedAt: when || null, phase: phase || null });
  };

  return (
    <Drawer open={open} onClose={onClose} title={heading ?? say('heading')} width={520}
      footer={
        <div className="ups-foot">
          <Button variant="ghost" onClick={onClose}>{say('cancel')}</Button>
          <Button variant="primary" icon="upload" onClick={submit} disabled={!canSubmit} loading={busy}>{say('save')}</Button>
        </div>
      }>
      <div className="ups" onPaste={onPaste}>
        {prompt && (
          <div className="ups-prompt">
            <Icon name="question" size={18} aria-hidden />
            <div><strong>{prompt}</strong>{detail && <p>{detail}</p>}</div>
          </div>
        )}

        <div
          className={`ups-drop ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Icon name="upload" size={28} aria-hidden />
          <p className="ups-drop-text">{say('drop')}</p>
          <div className="ups-drop-buttons">
            <Button variant="secondary" icon="file-text" onClick={() => fileRef.current?.click()}>{say('choose')}</Button>
            {allowCamera && <Button variant="secondary" icon="image" onClick={() => cameraRef.current?.click()}>{say('camera')}</Button>}
            <Button variant="ghost" icon="copy" onClick={() => void pasteFromClipboard()}>{say('paste')}</Button>
          </div>
          <p className="ups-hint">{say('pasteHint')}</p>
          <input ref={fileRef} className="ups-file" type="file" accept={accept} multiple aria-label={say('choose')}
            onChange={(e) => { void take(e.target.files); e.target.value = ''; }} />
          <input ref={cameraRef} className="ups-file" type="file" accept="image/*" capture="environment" aria-label={say('camera')}
            onChange={(e) => { void take(e.target.files); e.target.value = ''; }} />
        </div>

        {reading && <p className="ups-reading"><Spinner size={16} /> {say('reading')}</p>}

        {files.length > 0 && (
          <ul className="ups-files" aria-label={say('chosen')}>
            {files.map((f) => (
              <li key={f.id} className="ups-file-row">
                {f.thumbnailDataUrl
                  ? <img className="ups-thumb" src={f.thumbnailDataUrl} alt="" />
                  : <span className="ups-thumb ups-thumb-generic"><Icon name="file-text" size={20} aria-hidden /></span>}
                <span className="ups-file-main">
                  <span className="ups-file-name">{f.fileName}</span>
                  <span className="ups-file-meta">{fileSize(f.sizeBytes)}{f.sha256 ? ` · ${say('hashed')} ${f.sha256.slice(0, 8)}…` : ''}</span>
                </span>
                <IconButton icon="trash" label={`${say('remove')} ${f.fileName}`} size="sm"
                  onClick={() => setFiles((prev) => prev.filter((p) => p.id !== f.id))} />
              </li>
            ))}
          </ul>
        )}

        {touched && files.length === 0 && <p className="ups-error" role="alert">{say('noFiles')}</p>}

        <Input label={say('title')} hint={say('titleHint')} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Textarea label={say('description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={600} />
        <Input label={say('when')} hint={say('whenHint')} type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
        {phases.length > 0 && <Select label={say('phase')} options={phaseOptions} value={phase} onChange={(e) => setPhase(e.target.value)} />}

        <p className="ups-privacy"><Badge tone="neutral" size="sm">{lang === 'es' ? 'Privacidad' : 'Privacy'}</Badge> {say('privacy')}</p>
      </div>
    </Drawer>
  );
}
