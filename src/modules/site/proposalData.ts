/**
 * P-02 / P-03 / P-04 data: the departments x roles feature matrix, the promises, the development method, the
 * replacement map and the pass/status lookup read from docs/plan/tasks.json (D-014, so the proposal can never
 * disagree with the plan). Facts about the firm's current stack are "as indexed" (D-025) and carry a verified flag.
 */
import type { Bi } from '../../i18n/types';
import type { Role } from '../../auth/roles';
import plan from '../../../docs/plan/tasks.json';

/* ------------------------------------------------------------------ plan lookup */

export interface PlanTask { id: string; code: string; title: string; lane: string; pass: number; depends_on: string[]; model: string; status: string; size: string; deliverables?: string[]; acceptance?: string }
export interface PlanPass { id: number; title: string; goal: string; gate: string }

export const PASSES = plan.passes as PlanPass[];
export const TASKS = plan.tasks as PlanTask[];
export const PLAN_UNITS: string = plan.units;
export const PLAN_UPDATED: string = plan.updated_at;

export type ShipStatus = 'done' | 'doing' | 'planned';

/** Pass and status for a set of page codes: earliest pass, and the furthest-along status of its tasks. */
export function planFor(codes: string[]): { pass: number; status: ShipStatus; tasks: PlanTask[] } {
  const tasks = TASKS.filter((t) => codes.includes(t.code));
  if (!tasks.length) return { pass: 2, status: 'planned', tasks: [] };
  const pass = Math.min(...tasks.map((t) => t.pass));
  const inPass = tasks.filter((t) => t.pass === pass);
  const status: ShipStatus = inPass.every((t) => t.status === 'done') ? 'done' : inPass.some((t) => t.status !== 'todo') ? 'doing' : 'planned';
  return { pass, status, tasks };
}

/** Progress of one pass, from task statuses (P-04 roadmap). */
export function passProgress(passId: number): { total: number; done: number; doing: number; todo: number; percent: number; lanes: { lane: string; count: number }[] } {
  const rows = TASKS.filter((t) => t.pass === passId);
  const done = rows.filter((t) => t.status === 'done').length;
  const doing = rows.filter((t) => t.status === 'doing').length;
  const byLane = new Map<string, number>();
  for (const t of rows) byLane.set(t.lane, (byLane.get(t.lane) ?? 0) + 1);
  return {
    total: rows.length, done, doing, todo: rows.length - done - doing,
    percent: rows.length ? Math.round(((done + doing * 0.5) / rows.length) * 100) : 0,
    lanes: [...byLane.entries()].map(([lane, count]) => ({ lane, count })).sort((a, b) => b.count - a.count),
  };
}

/** First and last dependency tick used by a pass (units are ticks, never calendar days — D-013). */
export function passTicks(passId: number): { from: number; to: number } {
  const rows = TASKS.filter((t) => t.pass === passId) as (PlanTask & { tick?: number })[];
  const ticks = rows.map((t) => t.tick).filter((n): n is number => typeof n === 'number');
  if (!ticks.length) return { from: 0, to: 0 };
  return { from: Math.min(...ticks), to: Math.max(...ticks) };
}

/* ------------------------------------------------------------------ the matrix */

export const DEPARTMENTS = [
  { id: 'frontdesk', label: { en: 'Front desk', es: 'Recepción' } as Bi, icon: 'phone' },
  { id: 'legal', label: { en: 'Legal team', es: 'Equipo legal' } as Bi, icon: 'gavel' },
  { id: 'discovery', label: { en: 'Discovery', es: 'Discovery' } as Bi, icon: 'search' },
  { id: 'documents', label: { en: 'Documents & pleadings', es: 'Documentos y alegatos' } as Bi, icon: 'file-text' },
  { id: 'learning', label: { en: 'Client learning', es: 'Aprendizaje del cliente' } as Bi, icon: 'video' },
  { id: 'finance', label: { en: 'Owner & finance', es: 'Dirección y finanzas' } as Bi, icon: 'dollar' },
  { id: 'marketing', label: { en: 'Marketing', es: 'Marketing' } as Bi, icon: 'megaphone' },
  { id: 'manual', label: { en: 'Operations manual', es: 'Manual de operaciones' } as Bi, icon: 'book' },
  { id: 'opposition', label: { en: 'Opposing counsel', es: 'Abogado contrario' } as Bi, icon: 'scale' },
] as const;
export type DepartmentId = (typeof DEPARTMENTS)[number]['id'];

/** The seven role columns of the matrix (the nine roles minus super admin, which sees everything, and public). */
export const MATRIX_ROLES: Role[] = ['owner', 'attorney', 'paralegal', 'front_desk', 'marketing', 'client', 'opposing_counsel'];

export interface Feature { id: string; department: DepartmentId; roles: Role[]; label: Bi; what: Bi; codes: string[] }

export const FEATURES: Feature[] = [
  // Front desk
  { id: 'intake-queue', department: 'frontdesk', roles: ['front_desk', 'paralegal'], codes: ['F-10'], label: { en: 'Intake queue', es: 'Cola de admisión' }, what: { en: 'Initial and follow-up consultation forms arrive as records, not emails: triage, deduplicate, convert to a client and a case.', es: 'Los formularios llegan como registros, no como correos: se clasifican, se deduplican y se convierten en cliente y caso.' } },
  { id: 'phone-intake', department: 'frontdesk', roles: ['client'], codes: ['F-10'], label: { en: 'Intake from your phone', es: 'Admisión desde el teléfono' }, what: { en: 'The renter fills one form, in English or Spanish, and it becomes their case file. No copy emailed into a void.', es: 'El inquilino llena un formulario, en inglés o español, y se convierte en su expediente.' } },
  { id: 'scheduling', department: 'frontdesk', roles: ['front_desk', 'attorney', 'client'], codes: ['F-11'], label: { en: 'Consultation scheduling', es: 'Agenda de consultas' }, what: { en: 'Attorney availability across the network, phone or video, reminders, reschedules, and the prepaid 30-minute block attached to the case.', es: 'Disponibilidad de abogados en la red, teléfono o video, recordatorios y el bloque prepagado de 30 minutos.' } },
  { id: 'call-log', department: 'frontdesk', roles: ['front_desk', 'owner'], codes: ['F-12'], label: { en: 'Call log & directory', es: 'Registro de llamadas' }, what: { en: 'Every call logged against a person and a case, with hotline minutes and notes in the same record.', es: 'Cada llamada registrada con persona y caso, con minutos de la línea y notas.' } },
  { id: 'hotline', department: 'frontdesk', roles: ['front_desk', 'client'], codes: ['F-21'], label: { en: 'Hotline minutes', es: 'Minutos de la línea' }, what: { en: 'The paid hotline runs inside the system: click to call, minutes metered against the deposit, notes land on the case.', es: 'La línea de pago funciona dentro del sistema: llamada con un clic, minutos medidos y notas en el caso.' } },
  { id: 'today-screen', department: 'frontdesk', roles: ['front_desk', 'owner'], codes: ['F-01'], label: { en: 'Today on the wall screen', es: 'Hoy en la pantalla' }, what: { en: 'A 4K-legible board of the day: consultations, callbacks, payments pending, intake waiting. Readable from across the room.', es: 'Un tablero del día legible en 4K: consultas, llamadas, pagos pendientes y admisiones en espera.' } },
  { id: 'unified-inbox', department: 'frontdesk', roles: ['front_desk', 'attorney', 'marketing'], codes: ['F-20'], label: { en: 'Unified inbox', es: 'Bandeja unificada' }, what: { en: 'Email, SMS, WhatsApp and voicemail in one queue, assigned, with the case one click away.', es: 'Correo, SMS, WhatsApp y buzón en una sola cola, asignados, con el caso a un clic.' } },
  // Legal team
  { id: 'case-list', department: 'legal', roles: ['attorney', 'owner'], codes: ['L-10'], label: { en: 'Cases', es: 'Casos' }, what: { en: 'Every matter with its board position, parties, next deadline and who is on it — filterable by office.', es: 'Cada caso con su posición en el tablero, partes, próximo plazo y responsable.' } },
  { id: 'case-file', department: 'legal', roles: ['attorney', 'paralegal'], codes: ['L-10', 'L-11'], label: { en: 'Case file & parties', es: 'Expediente y partes' }, what: { en: 'One record per case: tenants, co-tenants, landlord, manager, opposing counsel, judge, court, with documents and comms attached.', es: 'Un registro por caso: inquilinos, arrendador, administrador, abogado contrario, juez y corte.' } },
  { id: 'deadline-radar', department: 'legal', roles: ['owner', 'attorney', 'paralegal', 'client'], codes: ['L-20'], label: { en: 'Deadline radar', es: 'Radar de plazos' }, what: { en: 'Court days, holidays and service-method extensions computed by an engine where every rule cites a statute row in the legal memory — and shows it.', es: 'Días hábiles, feriados y extensiones por método de entrega, con cada regla citando la ley.' } },
  { id: 'assignments', department: 'legal', roles: ['owner', 'attorney', 'paralegal'], codes: ['L-22'], label: { en: 'Assignments', es: 'Asignaciones' }, what: { en: 'Who does what, by case and board stage, with workload per person and clean hand-offs.', es: 'Quién hace qué, por caso y etapa, con carga por persona y entregas claras.' } },
  { id: 'late-work', department: 'legal', roles: ['owner'], codes: ['O-10'], label: { en: 'Late-work radar', es: 'Radar de atrasos' }, what: { en: '"Anything running late, anything where the lawyers need help" — overdue and at-risk work across every office, with escalation.', es: 'Todo lo atrasado y en riesgo en cada oficina, con escalamiento.' } },
  { id: 'timeline', department: 'legal', roles: ['attorney', 'client'], codes: ['L-12'], label: { en: 'Case timeline', es: 'Línea de tiempo' }, what: { en: 'Lanes by actor — tenant, landlord, court — so you can see who did what, when, and what it triggered.', es: 'Carriles por actor: inquilino, arrendador y corte.' } },
  { id: 'board-position', department: 'legal', roles: ['client', 'attorney'], codes: ['GB-02'], label: { en: 'Where am I on the board', es: 'Dónde estoy en el tablero' }, what: { en: 'The eviction game board with this case on it: the square you are on, the path you took and the moves still open.', es: 'El tablero del desalojo con este caso: tu casilla, el camino recorrido y las jugadas posibles.' } },
  { id: 'legal-memory', department: 'legal', roles: ['attorney', 'paralegal'], codes: ['K-10'], label: { en: 'Legal memory', es: 'Memoria legal' }, what: { en: 'Statute index with a verified-on date per row and an append-only law-change log, so a rule that went stale is visible before it is used.', es: 'Índice de leyes con fecha de verificación y registro de cambios.' } },
  { id: 'research', department: 'legal', roles: ['attorney'], codes: ['L-60'], label: { en: 'Research seam', es: 'Investigación' }, what: { en: 'Search statutes, cases and local rules through a provider; findings are proposed to the legal memory and an attorney verifies them.', es: 'Búsqueda de leyes y casos; los hallazgos se proponen y un abogado los verifica.' } },
  // Discovery
  { id: 'gather', department: 'discovery', roles: ['paralegal', 'client'], codes: ['C-21'], label: { en: 'Document gathering', es: 'Recolección de documentos' }, what: { en: 'Staff ask for what is missing; the renter photographs it from their phone; reminders chase the rest.', es: 'El equipo pide lo que falta; el inquilino lo fotografía desde el teléfono; los recordatorios hacen el resto.' } },
  { id: 'binder', department: 'discovery', roles: ['owner', 'attorney', 'paralegal', 'client'], codes: ['C-20'], label: { en: 'The binder', es: 'La carpeta' }, what: { en: 'Everything the case has, organised by board stage, with what is still missing shown as a gap rather than remembered.', es: 'Todo lo del caso, por etapa del tablero, mostrando lo que falta.' } },
  { id: 'our-discovery', department: 'discovery', roles: ['attorney', 'paralegal'], codes: ['L-30'], label: { en: 'Our discovery', es: 'Nuestro discovery' }, what: { en: 'Requests for admission, interrogatories and requests for production tracked from sent to answered to compelled.', es: 'Solicitudes de admisión, interrogatorios y producción, seguidas hasta la respuesta.' } },
  { id: 'their-discovery', department: 'discovery', roles: ['attorney', 'paralegal', 'client'], codes: ['L-30'], label: { en: 'Their discovery to us', es: 'Su discovery hacia nosotros' }, what: { en: 'What the landlord asked, what the client must produce, and the deadline for each — in plain language for the renter.', es: 'Lo que pidió el arrendador y lo que el cliente debe producir, con su plazo.' } },
  { id: 'evidence', department: 'discovery', roles: ['paralegal', 'client'], codes: ['F-22', 'C-20'], label: { en: 'Email & text as evidence', es: 'Correos y textos como prueba' }, what: { en: 'Import threads, tag them to the case, keep chain-of-custody fields. The proof of the landlord’s promise stops living in someone’s phone.', es: 'Importa hilos, etiquétalos al caso y conserva la cadena de custodia.' } },
  { id: 'cutoffs', department: 'discovery', roles: ['attorney', 'paralegal'], codes: ['L-20'], label: { en: 'Cut-offs', es: 'Cierres' }, what: { en: 'Discovery closes five days before trial; the radar warns before it, not after.', es: 'El discovery cierra cinco días antes del juicio; el radar avisa antes.' } },
  // Documents & pleadings
  { id: 'templates', department: 'documents', roles: ['attorney', 'paralegal'], codes: ['S-10'], label: { en: 'Template catalog', es: 'Catálogo de plantillas' }, what: { en: 'Every pleading bound to a board node and a store item, with variables, versions and a preview on real pleading paper.', es: 'Cada alegato ligado a un nodo del tablero y a un producto, con variables y versiones.' } },
  { id: 'assembly', department: 'documents', roles: ['paralegal'], codes: ['S-11'], label: { en: 'Document assembly', es: 'Ensamblado de documentos' }, what: { en: 'Generate the draft from the case: parties, dates, court, caption and facts already filled in.', es: 'Genera el borrador desde el caso: partes, fechas, corte y hechos ya completados.' } },
  { id: 'pleading-paper', department: 'documents', roles: ['attorney', 'paralegal'], codes: ['S-12'], label: { en: 'Pleading paper editor', es: 'Editor de papel de alegatos' }, what: { en: 'Numbered-line pleading paper in the browser with PDF and DOCX export. This is what replaces WordPerfect.', es: 'Papel de alegatos con líneas numeradas en el navegador, con exportación a PDF y DOCX. Esto reemplaza WordPerfect.' } },
  { id: 'multi-editor', department: 'documents', roles: ['attorney', 'paralegal'], codes: ['S-12'], label: { en: 'Two people, one document', es: 'Dos personas, un documento' }, what: { en: 'Realtime co-editing with presence, comments and revisions, so an attorney and a paralegal finish a motion together.', es: 'Edición simultánea con presencia, comentarios y revisiones.' } },
  { id: 'drafting-assistant', department: 'documents', roles: ['attorney', 'paralegal'], codes: ['S-21'], label: { en: 'Drafting assistant', es: 'Asistente de redacción' }, what: { en: 'An agent proposes a draft from template, case facts and legal memory, citing its sources. Nothing is filed without attorney approval.', es: 'Un agente propone un borrador citando sus fuentes. Nada se presenta sin aprobación del abogado.' } },
  { id: 'signing', department: 'documents', roles: ['paralegal', 'client'], codes: ['C-61'], label: { en: 'Signing', es: 'Firma' }, what: { en: 'Engagement letters and settlement agreements signed in the app, filed into the binder, audit trail kept.', es: 'Cartas de contratación y acuerdos firmados en la app y archivados en la carpeta.' } },
  { id: 'served-docs', department: 'documents', roles: ['opposing_counsel'], codes: ['X-01'], label: { en: 'Documents served to them', es: 'Documentos entregados' }, what: { en: 'The landlord’s attorney sees exactly what was served and nothing else.', es: 'El abogado del arrendador ve exactamente lo entregado y nada más.' } },
  // Client learning
  { id: 'curriculum', department: 'learning', roles: ['client'], codes: ['C-40'], label: { en: 'The curriculum', es: 'El currículo' }, what: { en: 'The firm’s videos and articles as a real course mapped to board stages, free, with the next lesson chosen by where the case stands.', es: 'Los videos y artículos como un curso real ligado a las etapas del tablero.' } },
  { id: 'watched', department: 'learning', roles: ['attorney', 'client'], codes: ['C-40'], label: { en: 'What they have watched', es: 'Lo que ya vio' }, what: { en: 'Watched state per client, so the attorney starts the consultation where the videos stopped instead of repeating them.', es: 'Estado de visto por cliente, para que el abogado no repita los videos.' } },
  { id: 'drip', department: 'learning', roles: ['marketing', 'client'], codes: ['C-40'], label: { en: 'Dripped along the journey', es: 'Entregado por etapas' }, what: { en: 'Lessons released as the case moves, not dumped at signup.', es: 'Lecciones liberadas según avanza el caso.' } },
  { id: 'preconsult', department: 'learning', roles: ['front_desk', 'attorney'], codes: ['C-40'], label: { en: 'Pre-consultation check', es: 'Revisión previa' }, what: { en: 'Before the 30 minutes start, staff can see which lessons the caller already finished.', es: 'Antes de los 30 minutos, el equipo ve qué lecciones ya completó.' } },
  { id: 'tv-player', department: 'learning', roles: ['client'], codes: ['C-40'], label: { en: 'Watchable on a TV', es: 'Se ve en la TV' }, what: { en: 'The player is built for a remote and a d-pad from the start, not retrofitted.', es: 'El reproductor está hecho para control remoto desde el inicio.' } },
  // Owner & finance
  { id: 'revenue', department: 'finance', roles: ['owner'], codes: ['O-20'], label: { en: 'Revenue by SKU & stage', es: 'Ingresos por producto y etapa' }, what: { en: 'What the firm earns, by service, by board stage, by attorney, by office — and where it leaks.', es: 'Lo que factura el bufete por servicio, etapa, abogado y oficina.' } },
  { id: 'payouts', department: 'finance', roles: ['owner'], codes: ['O-20'], label: { en: 'Network payouts', es: 'Pagos a la red' }, what: { en: 'The regional attorneys are independent practitioners; what each is owed is computed, not reconciled by hand.', es: 'Lo que se debe a cada abogado regional se calcula, no se concilia a mano.' } },
  { id: 'cost-roadmap', department: 'finance', roles: ['attorney', 'client'], codes: ['C-30'], label: { en: 'Cost roadmap, if/then', es: 'Ruta de costos, si/entonces' }, what: { en: 'A calendar of what the case could cost depending on what the landlord does next — priced along the board, with the single next payment called out.', es: 'Un calendario de costos posibles según lo que haga el arrendador, con el próximo pago destacado.' } },
  { id: 'checkout', department: 'finance', roles: ['front_desk', 'client'], codes: ['C-50'], label: { en: 'Checkout & receipts', es: 'Pago y recibos' }, what: { en: 'One cart, one receipt, on the case. Hourly top-up SKUs give way to real time tracking.', es: 'Un carrito, un recibo, en el caso. Los productos de recarga dan paso al registro de tiempo real.' } },
  { id: 'store', department: 'finance', roles: ['marketing', 'client'], codes: ['P-10'], label: { en: 'Store by board stage', es: 'Tienda por etapa' }, what: { en: 'The ~40 services reorganised by where the case actually is, instead of duplicated across category URLs.', es: 'Los ~40 servicios reorganizados por la etapa real del caso.' } },
  { id: 'payments-pending', department: 'finance', roles: ['front_desk', 'owner'], codes: ['C-50'], label: { en: 'Payments pending', es: 'Pagos pendientes' }, what: { en: 'Who owes what before work starts, visible at the desk without opening a payment processor.', es: 'Quién debe qué antes de empezar, visible en recepción.' } },
  // Marketing
  { id: 'crm', department: 'marketing', roles: ['owner', 'marketing'], codes: ['MK-01'], label: { en: 'CRM & leads', es: 'CRM y prospectos' }, what: { en: 'Form fills, calls and city-page visits become leads with a stage, an owner and a next action.', es: 'Formularios, llamadas y visitas se convierten en prospectos con etapa y responsable.' } },
  { id: 'funnel', department: 'marketing', roles: ['owner', 'marketing'], codes: ['MK-01'], label: { en: 'Video → consult funnel', es: 'Embudo video → consulta' }, what: { en: 'Visitor to video to intake to consultation to client, measured, so content spend has a number next to it.', es: 'De visitante a video, admisión, consulta y cliente, todo medido.' } },
  { id: 'calendar', department: 'marketing', roles: ['marketing'], codes: ['MK-02'], label: { en: 'Content calendar', es: 'Calendario de contenido' }, what: { en: 'Videos, shorts and articles planned against the stages renters search for.', es: 'Videos, cortos y artículos planeados según lo que buscan los inquilinos.' } },
  { id: 'city-pages', department: 'marketing', roles: ['marketing'], codes: ['MK-02'], label: { en: 'City pages from data', es: 'Páginas de ciudad desde datos' }, what: { en: 'One row per city renders a landing page, instead of dozens of hand-copied WordPress pages splitting the same SEO.', es: 'Una fila por ciudad genera una página, en vez de decenas copiadas a mano.' } },
  { id: 'public-site', department: 'marketing', roles: ['marketing', 'client'], codes: ['P-01'], label: { en: 'The public site', es: 'El sitio público' }, what: { en: 'One URL scheme, one content source, the educate-first funnel, English and Spanish from the first screen.', es: 'Un solo esquema de URLs, una fuente de contenido, inglés y español desde la primera pantalla.' } },
  // Operations manual
  { id: 'manual-cover', department: 'manual', roles: ['owner', 'attorney', 'paralegal', 'front_desk', 'marketing'], codes: ['M-01'], label: { en: 'How the firm runs', es: 'Cómo funciona el bufete' }, what: { en: 'A chapter per department and per role: the actual procedure, not a binder nobody opens.', es: 'Un capítulo por departamento y rol: el procedimiento real.' } },
  { id: 'live-numbers', department: 'manual', roles: ['owner'], codes: ['M-01'], label: { en: 'Live numbers in the text', es: 'Cifras vivas en el texto' }, what: { en: 'The manual reads the system, so "we answer within X" is the measured number, not a typed one.', es: 'El manual lee el sistema, así que las cifras son medidas, no escritas.' } },
  { id: 'manual-es', department: 'manual', roles: ['front_desk', 'client'], codes: ['M-01'], label: { en: 'Spanish alongside English', es: 'Español junto al inglés' }, what: { en: 'Every chapter exists in both languages; the renter-facing parts are written for Spanish first.', es: 'Cada capítulo existe en ambos idiomas.' } },
  // Opposing counsel
  { id: 'scoped-case', department: 'opposition', roles: ['attorney', 'opposing_counsel'], codes: ['X-01'], label: { en: 'One case, nothing else', es: 'Un caso y nada más' }, what: { en: 'The landlord’s attorney gets a real portal scoped to the case they are on, enforced by row-level rules.', es: 'El abogado contrario recibe un portal limitado a su caso.' } },
  { id: 'service-ack', department: 'opposition', roles: ['attorney', 'opposing_counsel'], codes: ['X-10'], label: { en: 'Service with acknowledgement', es: 'Entrega con acuse' }, what: { en: 'Documents served through the portal are timestamped and acknowledged; no more "we never received it".', es: 'Los documentos entregados por el portal llevan sello de tiempo y acuse.' } },
  { id: 'meet-confer', department: 'opposition', roles: ['attorney', 'opposing_counsel'], codes: ['X-10'], label: { en: 'Meet-and-confer log', es: 'Registro de conferencias' }, what: { en: 'The record a judge asks for, written as it happens instead of reconstructed.', es: 'El registro que pide el juez, escrito mientras ocurre.' } },
  { id: 'proposed-dates', department: 'opposition', roles: ['opposing_counsel'], codes: ['X-10'], label: { en: 'Proposed dates', es: 'Fechas propuestas' }, what: { en: 'Continuances and stipulations proposed in writing, with both sides looking at the same calendar.', es: 'Aplazamientos y estipulaciones propuestos por escrito, con un solo calendario.' } },
];

export const featuresAt = (department: DepartmentId, role: Role): Feature[] => FEATURES.filter((f) => f.department === department && f.roles.includes(role));

/* ------------------------------------------------------------------ promises & method */

export interface Promise_ { id: string; icon: string; title: Bi; body: Bi; codes: string[] }
export const PROMISES: Promise_[] = [
  { id: 'radar', icon: 'clock', codes: ['L-20', 'O-10'], title: { en: 'A deadline radar that shows its work', es: 'Un radar de plazos que muestra su razonamiento' }, body: { en: 'Court days, holidays and service extensions computed by an engine; every deadline can name the statute it came from, and a rule nobody has verified this year says so out loud.', es: 'Días hábiles, feriados y extensiones calculados por un motor; cada plazo cita su ley y avisa si no está verificada.' } },
  { id: 'discovery', icon: 'search', codes: ['C-20', 'C-21', 'L-30'], title: { en: 'Discovery that gathers itself', es: 'Discovery que se reúne solo' }, body: { en: 'Requests to the client with reminders, uploads from a phone, email and text threads imported as evidence, and a binder that shows the gaps instead of hiding them.', es: 'Solicitudes con recordatorios, cargas desde el teléfono, correos y textos importados, y una carpeta que muestra los vacíos.' } },
  { id: 'costs', icon: 'dollar', codes: ['C-30'], title: { en: 'A cost roadmap with if/then', es: 'Una ruta de costos con si/entonces' }, body: { en: 'Priced along the game board: if they file this, it costs that, on about this date. The renter sees the single next payment and the range behind it.', es: 'Con precios a lo largo del tablero: si presentan esto, cuesta aquello, en esta fecha aproximada.' } },
  { id: 'pleading', icon: 'file-text', codes: ['S-10', 'S-11', 'S-12'], title: { en: 'Pleading paper without WordPerfect', es: 'Papel de alegatos sin WordPerfect' }, body: { en: 'Numbered-line pleading paper in the browser, assembled from the case, exported to PDF and DOCX, then co-edited by two people at once.', es: 'Papel con líneas numeradas en el navegador, ensamblado desde el caso y editado por dos personas a la vez.' } },
  { id: 'lms', icon: 'video', codes: ['C-40'], title: { en: 'The videos become a curriculum', es: 'Los videos se vuelven un currículo' }, body: { en: 'The same free education, finally tracked: mapped to board stages, watched state per client, and visible to the attorney before the consultation starts.', es: 'La misma educación gratuita, por fin medida y ligada a las etapas del tablero.' } },
  { id: 'comms', icon: 'message', codes: ['F-20', 'F-21', 'F-22', 'C-60'], title: { en: 'Every channel in one log', es: 'Todos los canales en un registro' }, body: { en: 'Phone, video with recording and summary, email, SMS and WhatsApp through one message log attached to the case — replacing the pay-per-minute hotline vendor and the separate meeting tool.', es: 'Teléfono, video con grabación y resumen, correo, SMS y WhatsApp en un registro ligado al caso.' } },
  { id: 'appliance', icon: 'cpu', codes: ['P-04'], title: { en: 'It can boot on its own hardware', es: 'Puede arrancar en su propio equipo' }, body: { en: 'The end state is an appliance: a machine in the office that boots straight into CTL OS. Every pass before it builds the seams so that is a build, not a rewrite.', es: 'El estado final es un equipo que arranca directo en CTL OS.' } },
];

export interface MethodItem { id: string; title: Bi; body: Bi }
export const METHOD: MethodItem[] = [
  { id: 'hub', title: { en: 'One hub, every role', es: 'Un centro, todos los roles' }, body: { en: 'From a single screen you can enter the system as the owner, an attorney, a paralegal, the front desk, a renter or the opposing counsel, and see exactly what they see.', es: 'Desde una sola pantalla puedes entrar como cualquier rol y ver exactamente lo que ve.' } },
  { id: 'devmode', title: { en: 'Dev mode on any page', es: 'Modo constructor en cualquier página' }, body: { en: 'Turn it on and every page shows its own specification: what it is for, what data it touches, which rules it implements and every action it exposes.', es: 'Actívalo y cada página muestra su especificación completa.' } },
  { id: 'annotations', title: { en: 'You comment on the product itself', es: 'Comentas sobre el producto mismo' }, body: { en: 'Testers pin a comment, a request or a bug to the element they are looking at. Agents triage from that list and write the decision down before changing anything.', es: 'Los evaluadores fijan comentarios al elemento que ven; los agentes deciden y lo registran antes de cambiar algo.' } },
  { id: 'docs', title: { en: 'Documented in the same turn', es: 'Documentado en el mismo turno' }, body: { en: 'Every prompt, reply, decision, changelog entry and page document lands in the repository with the work, never afterwards. The plan you are reading is the plan the builders read.', es: 'Cada instrucción, decisión y documento se guarda junto con el trabajo, nunca después.' } },
  { id: 'models', title: { en: 'The right model per job', es: 'El modelo correcto por trabajo' }, body: { en: 'Judgment, architecture and shared code go to the strongest model; modules and pages to the builder model; mechanical passes (screenshots, QA matrices, Spanish fill) to the fast one. Every reply says which did the work.', es: 'Criterio y arquitectura al modelo más fuerte; módulos al constructor; pasadas mecánicas al rápido.' } },
  { id: 'quality', title: { en: 'Phone to 4K TV, every page', es: 'Del teléfono a la TV 4K' }, body: { en: 'Seven widths from 360 to 3840 are checked automatically, in light and dark, with a legibility floor so a wall screen is readable from ten feet.', es: 'Siete anchos de 360 a 3840 se verifican automáticamente, en claro y oscuro.' } },
];

/* ------------------------------------------------------------------ replacement map (P-03) */

export type ReplaceKind = 'replaced' | 'kept' | 'partly';
export interface Replacement {
  id: string;
  today: string;
  /** How the fact was established: seen verbatim in indexed pages, inferred, or told to us by Justin. */
  evidence: 'indexed' | 'inferred' | 'client';
  doesToday: Bi;
  pain: Bi;
  replacement: Bi;
  codes: string[];
  kind: ReplaceKind;
  /** What survives as an integration seam rather than being replaced. */
  seam?: Bi;
}

export const REPLACEMENTS: Replacement[] = [
  { id: 'wordpress', today: 'WordPress + cms. subdomain + legacy .htm pages', evidence: 'indexed', kind: 'replaced', codes: ['P-01', 'MK-02'],
    doesToday: { en: 'Hosts the public site, the articles and the city pages across three different URL schemes.', es: 'Aloja el sitio público, los artículos y las páginas de ciudad en tres esquemas de URL.' },
    pain: { en: 'The same content lives at three addresses; SEO is split and no visitor has any state.', es: 'El mismo contenido vive en tres direcciones; el SEO se divide y ningún visitante tiene estado.' },
    replacement: { en: 'The public site module: one URL scheme, content from data, city pages generated from rows, English and Spanish from the first screen.', es: 'El módulo del sitio público: un esquema de URLs y contenido desde datos.' } },
  { id: 'ecwid', today: 'Ecwid store', evidence: 'indexed', kind: 'replaced', codes: ['P-10'],
    doesToday: { en: 'Sells roughly forty SKU-numbered services, duplicated across category URLs.', es: 'Vende unos cuarenta servicios numerados, duplicados en varias categorías.' },
    pain: { en: 'Products appear several times, prices sit outside the case, and an 800-series of top-up SKUs stands in for time tracking.', es: 'Los productos se repiten, los precios viven fuera del caso y hay SKUs de recarga en vez de registro de tiempo.' },
    replacement: { en: 'Store by board stage, backed by the same catalog the templates and the cost roadmap read.', es: 'Tienda por etapa del tablero, con el mismo catálogo que leen las plantillas y la ruta de costos.' } },
  { id: 'paypal', today: 'PayPal and card checkout', evidence: 'indexed', kind: 'partly', codes: ['C-50'],
    doesToday: { en: 'Takes payment for consultations and documents.', es: 'Cobra consultas y documentos.' },
    pain: { en: 'Payment has no link to a case, a receipt or the work it authorises.', es: 'El pago no está ligado al caso ni al trabajo que autoriza.' },
    replacement: { en: 'Checkout and receipts inside the case, with real time tracking replacing the top-up SKUs.', es: 'Pago y recibos dentro del caso, con registro de tiempo real.' },
    seam: { en: 'Stripe stays, as the payment and payroll provider behind the seam.', es: 'Stripe se mantiene como proveedor de pagos y nómina.' } },
  { id: 'teams', today: 'Microsoft Teams', evidence: 'indexed', kind: 'replaced', codes: ['C-60'],
    doesToday: { en: 'Carries the video half of the 30-minute consultations.', es: 'Lleva la parte de video de las consultas de 30 minutos.' },
    pain: { en: 'Nothing is recorded into the case; the attorney retypes the call from memory.', es: 'Nada queda grabado en el caso; el abogado reescribe la llamada de memoria.' },
    replacement: { en: 'In-app video: schedule, join, record, transcribe and summarise straight onto the case timeline.', es: 'Video en la app: agenda, unión, grabación, transcripción y resumen en la línea de tiempo.' } },
  { id: 'voicestamps', today: 'VoiceStamps hotline billing', evidence: 'indexed', kind: 'replaced', codes: ['F-21'],
    doesToday: { en: 'Meters the paid legal hotline in ten-minute blocks against a card deposit.', es: 'Mide la línea legal de pago en bloques de diez minutos contra un depósito.' },
    pain: { en: 'A second billing system, separate from consultations, with call notes nowhere near the case.', es: 'Un segundo sistema de cobro, separado de las consultas.' },
    replacement: { en: 'Telephone through the comms seam: click to call, minutes metered, notes and recording on the case, one bill.', es: 'Telefonía dentro del sistema: llamada con un clic, minutos medidos y notas en el caso.' } },
  { id: 'scheduler', today: 'Online scheduling system (vendor not identified)', evidence: 'inferred', kind: 'replaced', codes: ['F-11'],
    doesToday: { en: 'Books the consultation slot after the store payment.', es: 'Reserva la cita después del pago.' },
    pain: { en: 'A fourth tool in the buying path, unaware of attorney workload or the case.', es: 'Una cuarta herramienta en el camino de compra, ajena a la carga del abogado.' },
    replacement: { en: 'Scheduling against real attorney availability across the network, with reminders and the prepaid block on the case.', es: 'Agenda con disponibilidad real de la red, recordatorios y el bloque prepagado en el caso.' } },
  { id: 'forms', today: 'Intake forms provider (vendor not identified)', evidence: 'inferred', kind: 'replaced', codes: ['F-10'],
    doesToday: { en: 'Collects the initial and follow-up consultation forms and emails a copy.', es: 'Recoge los formularios de consulta y envía una copia por correo.' },
    pain: { en: 'The answers arrive as an email, so the case starts as an attachment.', es: 'Las respuestas llegan como correo, así que el caso empieza como adjunto.' },
    replacement: { en: 'Intake as records: triaged in a queue, converted into a client and a case with one action.', es: 'Admisión como registros: en cola, convertidos en cliente y caso con una acción.' } },
  { id: 'youtube', today: 'YouTube-hosted curriculum', evidence: 'indexed', kind: 'partly', codes: ['C-40'],
    doesToday: { en: 'Hosts the free pre-consultation videos that the whole funnel depends on.', es: 'Aloja los videos gratuitos de los que depende todo el embudo.' },
    pain: { en: 'No order, no progress, no idea who watched what before a consultation.', es: 'Sin orden, sin progreso y sin saber quién vio qué antes de la consulta.' },
    replacement: { en: 'A learning module: lessons mapped to board stages, watched state per client, next lesson chosen by case position.', es: 'Un módulo de aprendizaje ligado a las etapas, con estado de visto por cliente.' },
    seam: { en: 'YouTube stays as public distribution and reach; the tracked curriculum lives in the client app.', es: 'YouTube se mantiene para difusión pública; el currículo medido vive en la app.' } },
  { id: 'wordperfect', today: 'WordPerfect pleading paper', evidence: 'client', kind: 'replaced', codes: ['S-10', 'S-11', 'S-12'],
    doesToday: { en: 'Every pleading is hand-drafted on numbered-line paper in a desktop word processor.', es: 'Cada alegato se redacta a mano en un procesador de texto de escritorio.' },
    pain: { en: 'No templates tied to the board stage or the service sold, no assembly from case data, no two people in one document.', es: 'Sin plantillas ligadas a la etapa, sin ensamblado y sin edición simultánea.' },
    replacement: { en: 'Template catalog per board node, assembly from the case, a browser pleading-paper editor with PDF / DOCX export, then realtime co-editing.', es: 'Catálogo de plantillas, ensamblado, editor en el navegador y edición simultánea.' } },
  { id: 'emailsms', today: 'Separate email and SMS tools', evidence: 'inferred', kind: 'replaced', codes: ['F-20', 'F-22'],
    doesToday: { en: 'Carry the day-to-day back and forth with clients.', es: 'Llevan el ida y vuelta diario con los clientes.' },
    pain: { en: 'Threads live in individual inboxes; evidence and instructions are lost when someone is out.', es: 'Los hilos viven en bandejas individuales; la evidencia se pierde.' },
    replacement: { en: 'One message log per case across email, SMS and WhatsApp, with a shared staff inbox and assignment.', es: 'Un registro de mensajes por caso con bandeja compartida y asignación.' } },
  { id: 'spreadsheets', today: 'Spreadsheets for deadlines, assignments and revenue', evidence: 'inferred', kind: 'replaced', codes: ['L-20', 'L-22', 'O-20'],
    doesToday: { en: 'Hold whatever the calendar and the head do not.', es: 'Guardan lo que no cabe en el calendario ni en la memoria.' },
    pain: { en: 'They cannot compute court days, they do not warn, and only one person trusts them.', es: 'No calculan días hábiles, no avisan y solo una persona confía en ellas.' },
    replacement: { en: 'The deadline engine, the assignments board and the owner dashboards, all reading the same rows.', es: 'El motor de plazos, el tablero de asignaciones y los paneles del dueño.' } },
  { id: 'nothing', today: 'No client portal, no CRM, no project management', evidence: 'inferred', kind: 'replaced', codes: ['C-01', 'MK-01', 'PM-01'],
    doesToday: { en: 'The client asks by phone; the pipeline and the workload live in the attorney’s head.', es: 'El cliente pregunta por teléfono; el flujo vive en la cabeza del abogado.' },
    pain: { en: 'Every status question costs a call, and nothing is measurable.', es: 'Cada pregunta de estado cuesta una llamada y nada es medible.' },
    replacement: { en: 'A client app that answers "where is my case", a CRM for the funnel, and the project board the firm can watch this work on.', es: 'Una app del cliente, un CRM para el embudo y el tablero del proyecto.' } },
];

export interface Seam { id: string; name: string; why: Bi; pass: number }
export const SEAMS: Seam[] = [
  { id: 'stripe', name: 'Stripe', pass: 4, why: { en: 'Payments, refunds and payouts to the network attorneys. Kept because a law firm should not build a card processor.', es: 'Pagos, reembolsos y liquidaciones a los abogados de la red.' } },
  { id: 'supabase', name: 'Supabase', pass: 4, why: { en: 'Database and authentication behind the same provider interface the mock data uses today, so nothing is rewritten to switch.', es: 'Base de datos y autenticación detrás de la misma interfaz que usan los datos simulados hoy.' } },
  { id: 'youtube-seam', name: 'YouTube', pass: 2, why: { en: 'Stays as the public distribution channel and the reach it already earns; the tracked curriculum is the in-app copy.', es: 'Se mantiene como canal público de difusión.' } },
  { id: 'efiling', name: 'Court e-filing', pass: 3, why: { en: 'A seam from the start so filing never becomes a rewrite when a court accepts an integration.', es: 'Una costura desde el inicio para que presentar nunca sea una reescritura.' } },
];

/* ------------------------------------------------------------------ what we need from the firm (P-04) */

export interface AskItem { id: string; title: Bi; why: Bi; blocks: string[] }
export const ASKS: AskItem[] = [
  { id: 'site-access', blocks: ['P-01', 'P-02', 'MK-02'], title: { en: 'Access to the real site', es: 'Acceso al sitio real' }, why: { en: 'caltenantlaw.com is blocked from the build environment, so nothing visual has been observed. Allow the domain, or share the home page source, the store, the offices page and the videos page, and the brand, the video order and the eighth office stop being guesses.', es: 'El sitio está bloqueado desde el entorno de construcción; nada visual se ha observado.' } },
  { id: 'prices', blocks: ['P-10', 'C-30'], title: { en: 'Confirm the prices', es: 'Confirmar los precios' }, why: { en: 'Every price in this proposal is as last indexed on the current site — the $165 consultation, the $330 hourly rate, the $60 per ten minutes and the full SKU table. They will not appear as facts anywhere until the firm confirms them.', es: 'Cada precio aquí es el último indexado; no se presentará como un hecho hasta que el bufete lo confirme.' } },
  { id: 'names', blocks: ['P-02'], title: { en: 'Permission for attorney names', es: 'Permiso para los nombres de los abogados' }, why: { en: 'Every person in the demo is fictional on purpose. Say the word and the real network attorneys and offices can appear in the proposal and the offices page.', es: 'Toda persona en la demo es ficticia a propósito.' } },
  { id: 'legal-owner', blocks: ['L-20', 'K-10'], title: { en: 'Who verifies the law', es: 'Quién verifica la ley' }, why: { en: 'The deadline engine will not treat a rule as current until a named person at the firm has verified it and dated it. We need that person.', es: 'El motor de plazos no tratará una regla como vigente hasta que alguien del bufete la verifique y la feche.' } },
  { id: 'board-edges', blocks: ['GB-01', 'GB-02'], title: { en: 'Confirm the board edges', es: 'Confirmar las conexiones del tablero' }, why: { en: 'The game board has been transcribed into data from the poster. Thirty minutes with the author confirming which squares connect to which turns it into the spine of the whole case model.', es: 'El tablero ya está transcrito a datos; falta confirmar qué casillas conectan con cuáles.' } },
];

export interface FeedbackKind { id: 'comment' | 'request' | 'bug'; label: Bi; body: Bi }
export const FEEDBACK_KINDS_INFO: FeedbackKind[] = [
  { id: 'comment', label: { en: 'Comment', es: 'Comentario' }, body: { en: 'Anything you notice. Signals, not orders — they are read and grouped.', es: 'Lo que notes. Señales, no órdenes.' } },
  { id: 'request', label: { en: 'Request', es: 'Solicitud' }, body: { en: 'Something you want changed or added. Requests from the firm are binding and go straight onto the board.', es: 'Algo que quieres cambiar o añadir. Las del bufete son vinculantes.' } },
  { id: 'bug', label: { en: 'Bug', es: 'Error' }, body: { en: 'Something broken. It arrives with the element, the page, the screen width and the theme already attached.', es: 'Algo roto. Llega con el elemento, la página, el ancho y el tema adjuntos.' } },
];
