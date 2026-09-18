/**
 * P-01 landing content: the educate-first funnel (steps, board stages, video curriculum).
 * Everything here is *as indexed* from the firm's current site (docs/reference/firm-site-digest.md, D-025):
 * prices and video order are unconfirmed and the UI always labels them "as listed on the current site".
 */
import type { Bi } from '../../i18n/types';

/** The ten board stages the store is organised by (docs/game-board/README.md phases, store categories in the digest). */
export const STAGE_IDS = ['notice', 'served', 'quash', 'demurrer', 'answer', 'default', 'discovery', 'msj', 'trial', 'appeal'] as const;
export type StageId = (typeof STAGE_IDS)[number];

export interface StageSku { sku: string; name: Bi; price: string | null }
export interface Stage {
  id: StageId;
  label: Bi;
  /** One line a renter recognises themselves in. */
  where: Bi;
  /** What the firm does at this square. */
  does: Bi;
  /** Store items indexed under this stage today (prices "as listed", never confirmed). */
  skus: StageSku[];
}

export const STAGES: Stage[] = [
  { id: 'notice', label: { en: 'A notice on my door', es: 'Un aviso en mi puerta' },
    where: { en: 'Three-day pay-or-quit, perform-or-quit, or a 30 / 60 / 90-day notice to move.', es: 'Aviso de tres días para pagar o desalojar, de cumplir o desalojar, o de 30 / 60 / 90 días.' },
    does: { en: 'Read the notice against the statute: the exact amount, the period, who signed it, how it was delivered. Most cases are won or lost on the notice.', es: 'Revisamos el aviso frente a la ley: el monto exacto, el período, quién lo firmó y cómo se entregó.' },
    skus: [{ sku: '101', name: { en: 'Initial consultation with an attorney (30 min)', es: 'Consulta inicial con abogado (30 min)' }, price: '$165' }, { sku: '110', name: { en: 'Simple letter to the landlord', es: 'Carta simple al arrendador' }, price: null }] },
  { id: 'served', label: { en: 'I was served papers', es: 'Me entregaron papeles' },
    where: { en: 'A summons and an unlawful detainer complaint. The clock is now in court days, not calendar days.', es: 'Una citación y una demanda de desalojo. El reloj corre en días hábiles de corte.' },
    does: { en: 'Work out the real response date, then choose the move: motion to quash, demurrer or answer. The current site states a ten-court-day window (AB 2347) — we verify it against the statute before it drives a deadline.', es: 'Calculamos la fecha real de respuesta y elegimos la jugada: moción para anular, excepción o contestación.' },
    skus: [{ sku: '101', name: { en: 'Initial consultation with an attorney (30 min)', es: 'Consulta inicial con abogado (30 min)' }, price: '$165' }] },
  { id: 'quash', label: { en: 'They served it wrong', es: 'La entrega fue incorrecta' },
    where: { en: 'Nobody handed it to you, it went to the wrong person, or the proof of service does not match what happened.', es: 'Nadie te lo entregó, fue a la persona equivocada, o la prueba de entrega no coincide.' },
    does: { en: 'File a motion to quash service of summons. Done right it resets the case and buys weeks.', es: 'Presentamos una moción para anular la entrega de la citación.' },
    skus: [{ sku: '150', name: { en: 'Normal motion to quash', es: 'Moción normal para anular' }, price: '$250' }, { sku: '151', name: { en: 'Delta motion to quash', es: 'Moción delta para anular' }, price: '$350' }, { sku: '160', name: { en: 'Petition for writ of mandate (limited)', es: 'Petición de auto de mandato (limitada)' }, price: '$600' }] },
  { id: 'demurrer', label: { en: 'Their complaint is defective', es: 'La demanda tiene defectos' },
    where: { en: 'The complaint itself does not state a case: wrong notice, missing element, contradictory dates.', es: 'La demanda no expone un caso: aviso incorrecto, elemento faltante, fechas contradictorias.' },
    does: { en: 'Demur to the complaint. The current site describes this as buying about six more weeks.', es: 'Presentamos una excepción (demurrer) a la demanda.' },
    skus: [{ sku: '370', name: { en: 'Demurrer to the complaint', es: 'Excepción a la demanda' }, price: '$500' }] },
  { id: 'answer', label: { en: 'I need to answer', es: 'Necesito contestar' },
    where: { en: 'The response date is close and the defenses have to be on paper.', es: 'La fecha de respuesta está cerca y las defensas deben estar por escrito.' },
    does: { en: 'Draft an answer with every affirmative defense the facts support, and request a jury trial when it helps.', es: 'Redactamos la contestación con cada defensa afirmativa que los hechos permitan.' },
    skus: [{ sku: '400', name: { en: 'Answer to unlawful detainer complaint', es: 'Contestación a la demanda de desalojo' }, price: '$250' }, { sku: '040', name: { en: 'Basic eviction defense kit', es: 'Kit básico de defensa' }, price: null }, { sku: '042', name: { en: 'Deluxe eviction defense kit', es: 'Kit deluxe de defensa' }, price: '$120' }] },
  { id: 'default', label: { en: 'A default was entered', es: 'Se registró un incumplimiento' },
    where: { en: 'The deadline passed, or the clerk entered default by mistake. A lockout can follow fast.', es: 'Pasó el plazo, o el secretario registró el incumplimiento por error.' },
    does: { en: 'Move for relief from default and, when the sheriff is coming, an ex parte application for a stay.', es: 'Pedimos alivio del incumplimiento y, si viene el alguacil, una solicitud ex parte de suspensión.' },
    skus: [{ sku: '201', name: { en: 'Default relief motion and stay', es: 'Moción de alivio y suspensión' }, price: '$500' }, { sku: '205', name: { en: 'Ex parte application for stay', es: 'Solicitud ex parte de suspensión' }, price: '$175' }, { sku: '200', name: { en: "Correcting the court clerk's mistakes", es: 'Corregir errores del secretario' }, price: '$200' }] },
  { id: 'discovery', label: { en: 'Discovery is running', es: 'La etapa de discovery' },
    where: { en: 'Both sides can demand documents and answers. In an eviction it closes five days before trial.', es: 'Ambas partes pueden exigir documentos y respuestas. Cierra cinco días antes del juicio.' },
    does: { en: 'Send our requests, answer theirs, gather your evidence into one binder, and move to compel when they stall.', es: 'Enviamos nuestras solicitudes, respondemos las suyas y reunimos tu evidencia en una carpeta.' },
    skus: [{ sku: '252', name: { en: 'Requests for production', es: 'Solicitudes de producción' }, price: null }, { sku: '300', name: { en: 'Responses to their discovery', es: 'Respuestas a su discovery' }, price: null }, { sku: '299', name: { en: 'Ex parte to continue trial and advance motion to compel', es: 'Ex parte para aplazar juicio y adelantar moción' }, price: null }] },
  { id: 'msj', label: { en: 'Summary judgment', es: 'Juicio sumario' },
    where: { en: 'One side says the facts are not really in dispute and asks the judge to decide without a trial.', es: 'Una parte dice que los hechos no están en disputa y pide al juez decidir sin juicio.' },
    does: { en: 'Oppose theirs with declarations and evidence, or bring ours when their own paperwork proves the defense.', es: 'Nos oponemos con declaraciones y evidencia, o presentamos la nuestra.' },
    skus: [{ sku: '425', name: { en: 'Motion for summary judgment (minimum)', es: 'Moción de juicio sumario (mínimo)' }, price: '$600' }] },
  { id: 'trial', label: { en: 'Trial is set', es: 'Hay fecha de juicio' },
    where: { en: 'Trial is set within about 20 days of the answer. Jury trial documents are due before it.', es: 'El juicio se fija a unos 20 días de la contestación.' },
    does: { en: 'Prepare the jury trial packet, unique instructions, exhibits and the witness plan. A court appearance can be arranged.', es: 'Preparamos el paquete de juicio con jurado, instrucciones, pruebas y el plan de testigos.' },
    skus: [{ sku: '460', name: { en: 'Initial jury trial documents', es: 'Documentos iniciales de juicio con jurado' }, price: '$660' }, { sku: '461', name: { en: 'Unique jury instructions (each)', es: 'Instrucciones únicas (cada una)' }, price: '$330' }, { sku: '041', name: { en: 'Eviction trial kit', es: 'Kit de juicio' }, price: '$100' }, { sku: '450', name: { en: 'Court appearance (minimum)', es: 'Comparecencia (mínimo)' }, price: '$330' }] },
  { id: 'appeal', label: { en: 'I lost — what now?', es: 'Perdí, ¿y ahora?' },
    where: { en: 'A judgment against you, a lockout date, or a result worth appealing.', es: 'Una sentencia en contra, una fecha de desalojo, o un resultado apelable.' },
    does: { en: 'New trial motion, stay pending appeal, or turn the case around and sue the landlord for what they did.', es: 'Moción de nuevo juicio, suspensión durante la apelación, o demandar al arrendador.' },
    skus: [{ sku: '520', name: { en: 'Motion for new trial', es: 'Moción de nuevo juicio' }, price: null }, { sku: '610', name: { en: 'Stay pending appeal (minimum)', es: 'Suspensión durante apelación (mínimo)' }, price: null }, { sku: '705', name: { en: 'Complaint against the landlord (simple)', es: 'Demanda contra el arrendador (simple)' }, price: '$900' }] },
];

export interface Lesson { id: string; series: Bi; title: Bi; minutes: number | null; stage: StageId }

/**
 * Curriculum preview (digest §5). Series A "Winning Your Eviction" (2023), Series B the procedural "Eviction Series",
 * Series C the 2025 refresh. Order and running times are unconfirmed; the player itself is Pass 2 (C-40).
 */
export const LESSONS: Lesson[] = [
  { id: 'a1', series: { en: 'Winning your eviction', es: 'Gana tu desalojo' }, title: { en: 'Part 1 · Taking control', es: 'Parte 1 · Tomar el control' }, minutes: null, stage: 'notice' },
  { id: 'a2', series: { en: 'Winning your eviction', es: 'Gana tu desalojo' }, title: { en: 'Part 2 · Nonpayment of rent', es: 'Parte 2 · Falta de pago' }, minutes: null, stage: 'notice' },
  { id: 'a4', series: { en: 'Winning your eviction', es: 'Gana tu desalojo' }, title: { en: 'Part 4 · The notice to quit', es: 'Parte 4 · El aviso para desalojar' }, minutes: null, stage: 'notice' },
  { id: 'a6', series: { en: 'Winning your eviction', es: 'Gana tu desalojo' }, title: { en: 'Part 6 · No-fault eviction', es: 'Parte 6 · Desalojo sin culpa' }, minutes: null, stage: 'notice' },
  { id: 'a7', series: { en: 'Winning your eviction', es: 'Gana tu desalojo' }, title: { en: 'Part 7 · The game board', es: 'Parte 7 · El tablero' }, minutes: null, stage: 'served' },
  { id: 'b1', series: { en: 'Eviction series', es: 'Serie de desalojo' }, title: { en: 'Motion to quash', es: 'Moción para anular' }, minutes: null, stage: 'quash' },
  { id: 'b2', series: { en: 'Eviction series', es: 'Serie de desalojo' }, title: { en: 'Demurrer', es: 'Excepción (demurrer)' }, minutes: null, stage: 'demurrer' },
  { id: 'b4', series: { en: 'Eviction series', es: 'Serie de desalojo' }, title: { en: 'The answer', es: 'La contestación' }, minutes: null, stage: 'answer' },
  { id: 'b6', series: { en: 'Eviction series', es: 'Serie de desalojo' }, title: { en: 'Discovery', es: 'Discovery' }, minutes: null, stage: 'discovery' },
  { id: 'b8', series: { en: 'Eviction series', es: 'Serie de desalojo' }, title: { en: 'Trial', es: 'El juicio' }, minutes: null, stage: 'trial' },
  { id: 'c1', series: { en: 'Evictions (2025 refresh)', es: 'Desalojos (2025)' }, title: { en: 'The game board, updated', es: 'El tablero, actualizado' }, minutes: null, stage: 'served' },
  { id: 't1', series: { en: 'Topics', es: 'Temas' }, title: { en: 'Sue your landlord', es: 'Demanda a tu arrendador' }, minutes: null, stage: 'appeal' },
];

export interface HowStep { id: string; title: Bi; body: Bi; icon: 'video' | 'file-text' | 'phone' }
export const HOW_STEPS: HowStep[] = [
  { id: 'watch', icon: 'video', title: { en: 'Watch the free videos', es: 'Mira los videos gratis' }, body: { en: 'The whole eviction, explained by the attorney, before you pay anything. Rewind it, save it, watch it at 2am.', es: 'Todo el desalojo explicado por el abogado antes de pagar nada. Repítelo, guárdalo, míralo a las 2am.' } },
  { id: 'intake', icon: 'file-text', title: { en: 'Fill in the intake', es: 'Completa la admisión' }, body: { en: 'One form about your notice, your dates and your landlord. It becomes your case file, not an email attachment.', es: 'Un formulario sobre tu aviso, tus fechas y tu arrendador. Se convierte en tu expediente.' } },
  { id: 'consult', icon: 'phone', title: { en: 'Book 30 minutes with an attorney', es: 'Reserva 30 minutos con un abogado' }, body: { en: 'Phone or video, with a licensed California tenant attorney. You leave with the next move and what it costs.', es: 'Por teléfono o video con un abogado de inquilinos con licencia. Sales con la siguiente jugada y su costo.' } },
];
