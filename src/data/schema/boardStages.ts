/**
 * Provisional Pass 1 board-stage reference; T-054 case domain (Fable) and GB-01 (nodes.json) supersede; keep ids.
 *
 * `cases.stage_node_id`, `documents.stage_node_id` and `lessons.stage_node_id` hold game-board node ids
 * (docs/game-board/nodes.json). The role homes need three things per square that the JSON does not carry yet: a short
 * bilingual label, the phase it belongs to (for grouping documents and assignments by stage), and plain-language
 * "what happened / what happens next" for the client app (C-01). They live here until the board module and the case
 * domain own them. Only the squares Pass 1 seeds are listed; `stageInfo()` humanises anything else.
 *
 * Nothing here is legal advice: the plain-language lines describe the procedural position, and the client app shows
 * them next to the firm's own curriculum (see docs/legal/ for the statutes and their currency flags).
 */
import type { Bi } from '../../i18n/types';

export interface StageInfo {
  label: Bi;
  /** Phase id from docs/game-board/nodes.json (start, quash, removal, demurrer, default, discovery, summary-judgment, trial, appeal, outcomes). */
  phase: string;
  /** What just happened, in plain words. */
  happened: Bi;
  /** What happens next, in plain words. */
  next: Bi;
}

export const BOARD_PHASE_LABEL: Record<string, Bi> = {
  start: { en: 'Start', es: 'Inicio' },
  quash: { en: 'Motion to quash', es: 'Moción para anular' },
  removal: { en: 'Removal / petition', es: 'Traslado / petición' },
  demurrer: { en: 'Demurrer', es: 'Excepción (demurrer)' },
  default: { en: 'Default', es: 'Rebeldía (default)' },
  discovery: { en: 'Discovery', es: 'Descubrimiento de pruebas' },
  'summary-judgment': { en: 'Summary judgment', es: 'Juicio sumario' },
  trial: { en: 'Trial', es: 'Juicio' },
  appeal: { en: 'Appeal', es: 'Apelación' },
  outcomes: { en: 'Outcomes', es: 'Resultados' },
  other: { en: 'Other squares', es: 'Otras casillas' },
};

export const BOARD_STAGES: Record<string, StageInfo> = {
  'start': { label: { en: 'Start', es: 'Inicio' }, phase: 'start',
    happened: { en: 'Your case has not started moving yet.', es: 'Su caso todavía no se ha movido.' },
    next: { en: 'Watch the free videos, then book a 30-minute consultation.', es: 'Vea los videos gratuitos y luego reserve una consulta de 30 minutos.' } },
  'eviction-notice-or-lease-ends': { label: { en: 'Eviction notice or lease ends', es: 'Aviso de desalojo o fin del contrato' }, phase: 'start',
    happened: { en: 'Your landlord gave you a notice (3, 30, 60 or 90 days) or your lease ended.', es: 'Su arrendador le entregó un aviso (3, 30, 60 o 90 días) o su contrato terminó.' },
    next: { en: 'Nothing is filed in court yet. We read the notice for defects and tell you what it actually requires.', es: 'Todavía no hay nada presentado en la corte. Revisamos el aviso para hallar defectos y le decimos qué exige realmente.' } },
  'summons-and-complaint-filed': { label: { en: 'Summons and complaint filed', es: 'Demanda y citación presentadas' }, phase: 'start',
    happened: { en: 'Your landlord filed an unlawful detainer case against you.', es: 'Su arrendador presentó un caso de desalojo (unlawful detainer) contra usted.' },
    next: { en: 'The clock does not start until you are properly served. We check how they serve you.', es: 'El plazo no empieza hasta que le notifiquen correctamente. Revisamos cómo le notifican.' } },
  'process-server-tries-to-serve-you': { label: { en: 'Process server tries to serve you', es: 'El notificador intenta entregarle los papeles' }, phase: 'start',
    happened: { en: 'Someone is trying to hand you the summons and complaint.', es: 'Alguien intenta entregarle la citación y la demanda.' },
    next: { en: 'How and when they serve you decides your deadline. Write down every attempt and tell us.', es: 'Cómo y cuándo le notifican determina su plazo. Anote cada intento y díganoslo.' } },
  'evaluate-service': { label: { en: 'Evaluate service', es: 'Evaluar la notificación' }, phase: 'start',
    happened: { en: 'We are checking whether the service of the papers was legally good.', es: 'Estamos revisando si la notificación de los papeles fue legalmente válida.' },
    next: { en: 'If service was bad, we file a motion to quash; if it was good, we answer or demur.', es: 'Si la notificación fue defectuosa, presentamos una moción para anular; si fue válida, contestamos o presentamos una excepción.' } },
  'service-bad-file-motion-to-quash': { label: { en: 'Service was bad: motion to quash', es: 'Notificación defectuosa: moción para anular' }, phase: 'quash',
    happened: { en: 'Service was defective, so we asked the court to throw it out.', es: 'La notificación fue defectuosa, así que pedimos a la corte que la anule.' },
    next: { en: 'The court sets a hearing. Until it is decided, no default can be entered against you.', es: 'La corte fija una audiencia. Hasta que se decida, no pueden declararle en rebeldía.' } },
  'motion-to-quash-hearing': { label: { en: 'Motion to quash hearing', es: 'Audiencia de la moción para anular' }, phase: 'quash',
    happened: { en: 'Your motion to quash is on the court’s calendar.', es: 'Su moción para anular está en el calendario de la corte.' },
    next: { en: 'If it is granted, service starts over. If it is denied, you get a short window to answer.', es: 'Si se concede, la notificación vuelve a empezar. Si se niega, tendrá un plazo corto para contestar.' } },
  'evaluate-complaint-for-demurrer': { label: { en: 'Evaluate the complaint', es: 'Evaluar la demanda' }, phase: 'demurrer',
    happened: { en: 'We are reading the complaint itself for legal defects.', es: 'Estamos revisando la demanda misma para hallar defectos legales.' },
    next: { en: 'If the complaint is defective we demur, which also buys about six weeks.', es: 'Si la demanda es defectuosa presentamos una excepción, que además gana unas seis semanas.' } },
  'demurrer': { label: { en: 'Demurrer', es: 'Excepción (demurrer)' }, phase: 'demurrer',
    happened: { en: 'We filed a demurrer: the complaint does not state a legal case even if every word were true.', es: 'Presentamos una excepción: la demanda no plantea un caso legal ni aunque todo fuera cierto.' },
    next: { en: 'The landlord may oppose; then a hearing. Sustained can end the case; overruled means we answer.', es: 'El arrendador puede oponerse; luego hay audiencia. Si se acoge, el caso puede terminar; si se rechaza, contestamos.' } },
  'answer-to-complaint': { label: { en: 'Answer to the complaint', es: 'Contestación a la demanda' }, phase: 'demurrer',
    happened: { en: 'Your answer is on file, so the case is contested and you cannot be defaulted.', es: 'Su contestación está presentada, el caso está en disputa y no pueden declararle en rebeldía.' },
    next: { en: 'Either side can now ask for a trial date, and discovery can start.', es: 'Cualquiera de las partes puede pedir fecha de juicio y puede empezar el descubrimiento de pruebas.' } },
  'default-entered-by-clerk': { label: { en: 'Default entered', es: 'Rebeldía declarada' }, phase: 'default',
    happened: { en: 'The clerk entered a default because no response was on file in time.', es: 'El secretario declaró la rebeldía porque no había respuesta presentada a tiempo.' },
    next: { en: 'We move fast: an ex parte stay and a motion to set the default aside.', es: 'Actuamos rápido: una solicitud ex parte de suspensión y una moción para anular la rebeldía.' } },
  'motion-for-relief-from-default': { label: { en: 'Motion for relief from default', es: 'Moción de relevo de la rebeldía' }, phase: 'default',
    happened: { en: 'We asked the court to undo the default and put the case back on track.', es: 'Pedimos a la corte anular la rebeldía y devolver el caso a su curso.' },
    next: { en: 'The landlord may oppose; the hearing decides whether you return to your prior position.', es: 'El arrendador puede oponerse; la audiencia decide si regresa a su posición anterior.' } },
  'discovery-requests': { label: { en: 'Discovery requests', es: 'Solicitudes de pruebas' }, phase: 'discovery',
    happened: { en: 'We sent written questions and document demands to your landlord.', es: 'Enviamos preguntas escritas y solicitudes de documentos a su arrendador.' },
    next: { en: 'They must answer under oath. Good answers help you; no answers lead to a motion to compel.', es: 'Deben responder bajo juramento. Buenas respuestas le ayudan; sin respuestas, presentamos una moción para obligar.' } },
  'meet-and-confer-attempt': { label: { en: 'Meet and confer', es: 'Reunión de conciliación (meet and confer)' }, phase: 'discovery',
    happened: { en: 'We asked the other attorney to fix their answers before we go to the judge.', es: 'Pedimos al otro abogado corregir sus respuestas antes de acudir al juez.' },
    next: { en: 'If they do not, we file a motion to compel and ask to postpone the trial.', es: 'Si no lo hacen, presentamos una moción para obligar y pedimos posponer el juicio.' } },
  'motion-to-compel-and-postpone-trial': { label: { en: 'Motion to compel, postpone trial', es: 'Moción para obligar y posponer el juicio' }, phase: 'discovery',
    happened: { en: 'We asked the court to order real answers and to move the trial date.', es: 'Pedimos a la corte que ordene respuestas reales y que mueva la fecha del juicio.' },
    next: { en: 'The hearing decides. Granted usually means more time and better evidence.', es: 'La audiencia decide. Si se concede, normalmente hay más tiempo y mejores pruebas.' } },
  'summary-judgment-motion-filed-by-landlord': { label: { en: 'Landlord’s summary judgment motion', es: 'Moción de juicio sumario del arrendador' }, phase: 'summary-judgment',
    happened: { en: 'Your landlord asked the judge to decide the case without a jury.', es: 'Su arrendador pidió al juez decidir el caso sin jurado.' },
    next: { en: 'We prepare, file and serve an opposition with your evidence. Deadlines here are strict.', es: 'Preparamos, presentamos y notificamos una oposición con sus pruebas. Los plazos aquí son estrictos.' } },
  'prepare-file-serve-sj-opposition': { label: { en: 'Prepare the summary judgment opposition', es: 'Preparar la oposición al juicio sumario' }, phase: 'summary-judgment',
    happened: { en: 'We are writing your opposition and putting your evidence in declaration form.', es: 'Estamos redactando su oposición y poniendo sus pruebas en forma de declaración.' },
    next: { en: 'Send anything you have not sent yet. After the hearing, a denial sends the case to trial.', es: 'Envíe lo que aún no haya enviado. Tras la audiencia, si se niega, el caso va a juicio.' } },
  'jury-trial-requested': { label: { en: 'Jury trial requested', es: 'Juicio con jurado solicitado' }, phase: 'trial',
    happened: { en: 'We asked for a jury instead of a judge deciding alone.', es: 'Pedimos un jurado en lugar de que un juez decida solo.' },
    next: { en: 'The clerk sets a trial date and jury fees come due. Then we prepare the trial papers.', es: 'El secretario fija la fecha del juicio y vencen los honorarios del jurado. Luego preparamos los papeles del juicio.' } },
  'prepare-jury-trial-papers': { label: { en: 'Prepare the jury trial papers', es: 'Preparar los papeles del juicio con jurado' }, phase: 'trial',
    happened: { en: 'We are preparing the trial documents: exhibits, witnesses and jury instructions.', es: 'Estamos preparando los documentos del juicio: pruebas, testigos e instrucciones al jurado.' },
    next: { en: 'Pretrial conferences, then trial. We will tell you exactly when you must be available.', es: 'Conferencias previas y luego el juicio. Le diremos exactamente cuándo debe estar disponible.' } },
  'trial': { label: { en: 'Trial', es: 'Juicio' }, phase: 'trial',
    happened: { en: 'Your case is being tried.', es: 'Su caso está en juicio.' },
    next: { en: 'A win keeps you in your home; a loss leads to judgment, a writ and a 5-day notice.', es: 'Si gana, se queda en su hogar; si pierde, habrá sentencia, orden de ejecución y un aviso de 5 días.' } },
  'you-win': { label: { en: 'You win', es: 'Usted gana' }, phase: 'outcomes',
    happened: { en: 'You won. The eviction case against you failed.', es: 'Usted ganó. El caso de desalojo contra usted fracasó.' },
    next: { en: 'We can ask the court to make the landlord pay your costs, and look at suing them.', es: 'Podemos pedir a la corte que el arrendador pague sus costos y evaluar demandarlo.' } },
  'settlement-you-set-the-terms': { label: { en: 'Settlement on your terms', es: 'Acuerdo en sus términos' }, phase: 'outcomes',
    happened: { en: 'You settled on terms you chose instead of leaving it to a judge.', es: 'Llegó a un acuerdo en términos que usted eligió en vez de dejarlo al juez.' },
    next: { en: 'We put the agreement in writing and make sure it is actually performed.', es: 'Ponemos el acuerdo por escrito y nos aseguramos de que se cumpla.' } },
  'judgment-entered-writ-issued': { label: { en: 'Judgment entered, writ issued', es: 'Sentencia dictada, orden de ejecución' }, phase: 'trial',
    happened: { en: 'A judgment was entered and the court issued a writ of possession.', es: 'Se dictó sentencia y la corte emitió una orden de posesión.' },
    next: { en: 'The sheriff posts a 5-day notice to vacate. An appeal with a stay is the remaining move.', es: 'El sheriff coloca un aviso de 5 días para desalojar. Una apelación con suspensión es la jugada que queda.' } },
  'five-day-notice-to-vacate': { label: { en: '5-day notice to vacate', es: 'Aviso de 5 días para desalojar' }, phase: 'trial',
    happened: { en: 'The sheriff posted a 5-day notice to vacate.', es: 'El sheriff colocó un aviso de 5 días para desalojar.' },
    next: { en: 'Five days is short. Call us the day you see it: a stay must be requested immediately.', es: 'Cinco días es muy poco. Llámenos el mismo día: hay que pedir la suspensión de inmediato.' } },
  'notice-of-appeal': { label: { en: 'Notice of appeal', es: 'Notificación de apelación' }, phase: 'appeal',
    happened: { en: 'We filed a notice of appeal from the judgment.', es: 'Presentamos una notificación de apelación contra la sentencia.' },
    next: { en: 'We ask for a stay so you can stay while paying rent, then the briefs are written.', es: 'Pedimos una suspensión para que pueda quedarse pagando la renta y luego se redactan los escritos.' } },
  'foreclosure-tenants-remove-to-federal-court': { label: { en: 'Removal to federal court', es: 'Traslado a la corte federal' }, phase: 'removal',
    happened: { en: 'Because the property was foreclosed, the case can move to federal court.', es: 'Como la propiedad fue ejecutada, el caso puede pasar a la corte federal.' },
    next: { en: 'The federal court decides whether to keep the case or send it back.', es: 'La corte federal decide si conserva el caso o lo devuelve.' } },
  'you-stay-and-sue': { label: { en: 'You stay and sue', es: 'Se queda y demanda' }, phase: 'outcomes',
    happened: { en: 'You kept your home and now you are the one bringing a case.', es: 'Conservó su hogar y ahora usted es quien presenta un caso.' },
    next: { en: 'We draft the complaint for the harm the landlord caused.', es: 'Redactamos la demanda por el daño que causó el arrendador.' } },
};

const humanise = (id: string): string => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Never throws on an unknown node id: the board has 88 squares and Pass 1 only writes plain language for the seeded ones. */
export function stageInfo(id: string | null | undefined): StageInfo {
  if (id && BOARD_STAGES[id]) return BOARD_STAGES[id];
  const label = id ? humanise(id) : 'Not on the board yet';
  return {
    label: { en: label, es: label }, phase: 'other',
    happened: { en: 'This square is not written up in plain language yet.', es: 'Esta casilla aún no está explicada en lenguaje sencillo.' },
    next: { en: 'Your attorney will explain the next move on your consultation.', es: 'Su abogado le explicará el siguiente paso en su consulta.' },
  };
}
