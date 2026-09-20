/**
 * Role flows for the canvas flows layer (D-21; prompt 0006: "flow chart lines to show the flow of what each type of
 * user can do as a second level of ability in the canvas"). Data only: one flow per role, nodes are pages (by page
 * code and path), actions, decisions or hand-offs to another role; edges use the game board's KEY colours so the
 * canvas draws them with the tokens GameBoard already uses (`--board-normal-*`, `--board-positive-*`,
 * `--board-negative-*`; a hand-off uses the jump colour `--board-jump-*`).
 *
 * Codes that exist today use their real paths. Codes being built this pass (L-13, L-14, S-13, C-11, F-12, F-14, F-15,
 * F-13, S-21, C-20, C-21, C-22, C-40, L-31, O-10, O-20, X-10, X-11, F-10, F-11, MK-02) carry `planned: true` and the
 * path the build plan reserves for them; the module that ships the page owns the final path and may correct it here
 * in the same turn (the canvas resolves a node by code first, path second).
 */
import type { Role } from '../auth/roles';
import type { Bi } from '../i18n/types';

export type FlowNodeKind = 'page' | 'action' | 'decision' | 'handoff';
export type FlowEdgeKind = 'normal' | 'positive' | 'negative' | 'handoff';

export interface FlowNode {
  id: string;
  /** Page code, e.g. 'F-12'; actions and decisions carry the code of the page they happen on. */
  code: string;
  path: string;
  label: Bi;
  kind: FlowNodeKind;
  /** The page is planned this pass and not built yet; the canvas shows it as a dashed frame. */
  planned?: boolean;
  /** For handoff nodes: the role the work goes to. */
  toRole?: Role;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: Bi;
  /** KEY colour: normal (the usual path), positive (in the tenant's favour / approved), negative (rejected / late), handoff (jump to another role). */
  kind: FlowEdgeKind;
  /** Cross-role hand-off target (drawn to that role's flow when both are visible). */
  toRole?: Role;
}

export interface RoleFlow {
  role: Role;
  title: Bi;
  /** Page code the role starts on. */
  entry: string;
  steps: FlowNode[];
  edges: FlowEdge[];
}

const bi = (en: string, es: string): Bi => ({ en, es });
const page = (id: string, code: string, path: string, en: string, es: string, planned = false): FlowNode => ({ id, code, path, label: bi(en, es), kind: 'page', ...(planned ? { planned } : {}) });
const action = (id: string, code: string, path: string, en: string, es: string, planned = false): FlowNode => ({ id, code, path, label: bi(en, es), kind: 'action', ...(planned ? { planned } : {}) });
const decision = (id: string, code: string, path: string, en: string, es: string, planned = false): FlowNode => ({ id, code, path, label: bi(en, es), kind: 'decision', ...(planned ? { planned } : {}) });
const handoff = (id: string, code: string, path: string, toRole: Role, en: string, es: string): FlowNode => ({ id, code, path, label: bi(en, es), kind: 'handoff', toRole });
const e = (from: string, to: string, kind: FlowEdgeKind = 'normal', label?: [string, string], toRole?: Role): FlowEdge => ({ from, to, kind, ...(label ? { label: bi(label[0], label[1]) } : {}), ...(toRole ? { toRole } : {}) });

/** Reserved paths for the pages being built this pass (see file header). */
export const PLANNED_PATHS: Record<string, string> = {
  'L-13': '/counsel/pipeline', 'L-14': '/counsel/orders/:orderId', 'S-13': '/assist/queue', 'C-11': '/app/orders', 'F-14': '/desk/orders',
  'F-12': '/desk/calls', 'F-15': '/desk/follow-ups', 'F-13': '/desk/clients', 'F-10': '/desk/intake', 'F-11': '/desk/schedule',
  'S-21': '/assist/drafting', 'C-20': '/app/binder/map', 'C-21': '/app/requests', 'C-22': '/app/binder/add', 'C-40': '/app/learn/next', 'L-31': '/counsel/binder/:caseId',
  'O-10': '/owner/radar', 'O-20': '/owner/revenue', 'X-10': '/opposition/service', 'X-11': '/opposition/meet-confer', 'MK-02': '/marketing/content',
};
const P = PLANNED_PATHS;

export const ROLE_FLOWS: Record<Role, RoleFlow> = {
  client: {
    role: 'client', title: bi('Client: from finding help to a filed document', 'Cliente: de buscar ayuda a un documento presentado'), entry: 'P-01',
    steps: [
      page('c_site', 'P-01', '/site', 'Find help', 'Buscar ayuda'),
      page('c_videos', 'C-40', P['C-40'], 'Watch the videos for my stage', 'Ver los videos de mi etapa', true),
      page('c_services', 'P-10', '/site/services', 'Pick a service by board stage', 'Elegir un servicio por etapa'),
      action('c_buy', 'P-11', '/site/services/:sku', 'Buy the service', 'Comprar el servicio'),
      handoff('c_intake', 'F-10', P['F-10'], 'front_desk', 'Intake with the front desk', 'Admisión con recepción'),
      page('c_home', 'C-01', '/app', 'My case and what is next', 'Mi caso y lo que sigue'),
      page('c_orders', 'C-11', P['C-11'], 'My orders and their status', 'Mis pedidos y su estado', true),
      action('c_answer', 'C-21', P['C-21'], 'Answer questions, upload what is asked', 'Responder y subir lo pedido', true),
      decision('c_review', 'C-11', P['C-11'], 'Review the draft', 'Revisar el borrador', true),
      action('c_approve', 'C-11', P['C-11'], 'Approve', 'Aprobar', true),
      action('c_changes', 'C-11', P['C-11'], 'Request changes', 'Pedir cambios', true),
      page('c_binder', 'C-02', '/app/binder', 'My binder', 'Mi carpeta'),
      page('c_pay', 'C-04', '/app/pay', 'Pay', 'Pagar'),
    ],
    edges: [
      e('c_site', 'c_videos'), e('c_videos', 'c_services'), e('c_services', 'c_buy'), e('c_buy', 'c_intake', 'handoff', ['order created', 'pedido creado'], 'front_desk'),
      e('c_intake', 'c_home'), e('c_home', 'c_orders'), e('c_orders', 'c_answer', 'normal', ['waiting on you', 'esperando tu respuesta']), e('c_answer', 'c_orders'),
      e('c_orders', 'c_review', 'normal', ['draft ready', 'borrador listo']), e('c_review', 'c_approve', 'positive'), e('c_review', 'c_changes', 'negative'), e('c_changes', 'c_orders', 'normal', ['we redraft', 'lo corregimos']),
      e('c_approve', 'c_binder', 'positive', ['filed copy lands here', 'la copia presentada llega aquí']), e('c_home', 'c_pay'),
    ],
  },
  front_desk: {
    role: 'front_desk', title: bi('Front desk: a call comes in', 'Recepción: entra una llamada'), entry: 'F-01',
    steps: [
      page('f_home', 'F-01', '/desk', 'Today at the desk', 'Hoy en recepción'),
      page('f_call', 'F-12', P['F-12'], 'Incoming call', 'Llamada entrante', true),
      decision('f_match', 'F-12', P['F-12'], 'Known caller?', '¿Cliente conocido?', true),
      page('f_status', 'F-14', P['F-14'], 'Order status: whose turn, since when', 'Estado del pedido: de quién es el turno', true),
      action('f_confirm', 'F-14', P['F-14'], 'Confirm who has it and tell the caller', 'Confirmar quién lo tiene y decirlo', true),
      action('f_followup', 'F-15', P['F-15'], 'Create a follow-up', 'Crear un seguimiento', true),
      page('f_followups', 'F-15', P['F-15'], 'Follow-ups due', 'Seguimientos pendientes', true),
      action('f_consult', 'F-11', P['F-11'], 'Schedule a consultation', 'Agendar una consulta', true),
      page('f_intake', 'F-10', P['F-10'], 'Intake form', 'Formulario de admisión', true),
      page('f_clients', 'F-13', P['F-13'], 'Client directory', 'Directorio de clientes', true),
      handoff('f_to_attorney', 'L-13', P['L-13'], 'attorney', 'New order lands on the attorney board', 'El pedido nuevo llega al tablero del abogado'),
    ],
    edges: [
      e('f_home', 'f_call'), e('f_call', 'f_match'), e('f_match', 'f_status', 'positive', ['matched by phone', 'reconocido por teléfono']), e('f_match', 'f_consult', 'negative', ['new caller', 'persona nueva']),
      e('f_status', 'f_confirm'), e('f_confirm', 'f_followup', 'normal', ['something is owed', 'falta algo']), e('f_followup', 'f_followups'), e('f_status', 'f_clients'),
      e('f_consult', 'f_intake'), e('f_intake', 'f_to_attorney', 'handoff', ['order created', 'pedido creado'], 'attorney'),
    ],
  },
  attorney: {
    role: 'attorney', title: bi('Attorney: one document, start to done', 'Abogado: un documento, de inicio a fin'), entry: 'L-01',
    steps: [
      page('l_home', 'L-01', '/counsel', 'Home: late work first', 'Inicio: lo atrasado primero'),
      page('l_pipeline', 'L-13', P['L-13'], 'Pipeline board', 'Tablero de pedidos', true),
      page('l_order', 'L-14', P['L-14'], 'Order detail', 'Detalle del pedido', true),
      page('l_draft', 'S-21', P['S-21'], 'Drafting studio', 'Estudio de redacción', true),
      action('l_ask', 'L-14', P['L-14'], 'Send questions to the client', 'Enviar preguntas al cliente', true),
      handoff('l_client_review', 'C-11', P['C-11'], 'client', 'Client reviews the draft', 'El cliente revisa el borrador'),
      decision('l_client_verdict', 'L-14', P['L-14'], 'Approved?', '¿Aprobado?', true),
      handoff('l_supervisor', 'L-13', P['L-13'], 'owner', 'Supervisor review', 'Revisión del supervisor'),
      action('l_sign', 'L-14', P['L-14'], 'Sign the final', 'Firmar la versión final', true),
      action('l_file', 'L-14', P['L-14'], 'File or schedule filing', 'Presentar o programar', true),
      handoff('l_serve', 'S-13', P['S-13'], 'paralegal', 'Paralegal serves and files proof', 'El asistente notifica y presenta la prueba'),
      action('l_done', 'L-14', P['L-14'], 'Done', 'Terminado', true),
      page('l_board', 'GB-02', '/board/case/:caseId', 'Where the case is on the board', 'Dónde está el caso en el tablero'),
    ],
    edges: [
      e('l_home', 'l_pipeline'), e('l_pipeline', 'l_order'), e('l_order', 'l_ask', 'normal', ['details missing', 'faltan datos']), e('l_ask', 'l_order', 'normal', ['waiting on client', 'esperando al cliente']),
      e('l_order', 'l_draft'), e('l_draft', 'l_client_review', 'handoff', ['send for review', 'enviar a revisión'], 'client'), e('l_client_review', 'l_client_verdict'),
      e('l_client_verdict', 'l_supervisor', 'positive', ['approved', 'aprobado'], 'owner'), e('l_client_verdict', 'l_draft', 'negative', ['changes requested', 'pidió cambios']),
      e('l_supervisor', 'l_sign', 'positive'), e('l_supervisor', 'l_draft', 'negative', ['supervisor changes', 'cambios del supervisor']),
      e('l_sign', 'l_file'), e('l_file', 'l_serve', 'handoff', undefined, 'paralegal'), e('l_serve', 'l_done', 'positive'), e('l_order', 'l_board'),
    ],
  },
  paralegal: {
    role: 'paralegal', title: bi('Paralegal: gather, assemble, serve, file the proof', 'Asistente: recopilar, armar, notificar, probar'), entry: 'S-01',
    steps: [
      page('s_home', 'S-01', '/assist', 'Home: documents to prepare by stage', 'Inicio: documentos por etapa'),
      page('s_queue', 'S-13', P['S-13'], 'My queue', 'Mi cola', true),
      action('s_gather', 'L-14', P['L-14'], 'Gather client details', 'Recopilar datos del cliente', true),
      handoff('s_client', 'C-21', P['C-21'], 'client', 'Client answers and uploads', 'El cliente responde y sube'),
      action('s_assemble', 'S-21', P['S-21'], 'Assemble from the template', 'Armar desde la plantilla', true),
      handoff('s_attorney', 'L-14', P['L-14'], 'attorney', 'Attorney review', 'Revisión del abogado'),
      action('s_serve', 'S-13', P['S-13'], 'Serve', 'Notificar', true),
      action('s_proof', 'S-13', P['S-13'], 'File the proof of service', 'Presentar la prueba de notificación', true),
      page('s_binder', 'L-31', P['L-31'], 'Binder', 'Carpeta', true),
    ],
    edges: [
      e('s_home', 's_queue'), e('s_queue', 's_gather'), e('s_gather', 's_client', 'handoff', ['requests sent', 'solicitudes enviadas'], 'client'), e('s_client', 's_assemble', 'positive', ['all received', 'todo recibido']),
      e('s_assemble', 's_attorney', 'handoff', undefined, 'attorney'), e('s_queue', 's_serve', 'normal', ['final signed', 'final firmada']), e('s_serve', 's_proof'), e('s_proof', 's_binder', 'positive'),
    ],
  },
  owner: {
    role: 'owner', title: bi('Owner: radar, pipeline, revenue, plan', 'Propietario: radar, pedidos, ingresos, plan'), entry: 'O-01',
    steps: [
      page('o_home', 'O-01', '/owner', 'Home', 'Inicio'),
      page('o_radar', 'O-10', P['O-10'], 'Late-work radar', 'Radar de atrasos', true),
      page('o_pipeline', 'L-13', P['L-13'], 'Pipeline overview, every office', 'Vista de pedidos de todas las oficinas', true),
      action('o_supervise', 'L-14', P['L-14'], 'Supervisor review', 'Revisión como supervisor', true),
      page('o_revenue', 'O-20', P['O-20'], 'Revenue by SKU and stage', 'Ingresos por servicio y etapa', true),
      page('o_plan', 'PM-01', '/plan', 'The build plan', 'El plan de construcción'),
    ],
    edges: [e('o_home', 'o_radar'), e('o_radar', 'o_pipeline', 'negative', ['late orders', 'pedidos atrasados']), e('o_pipeline', 'o_supervise'), e('o_home', 'o_revenue'), e('o_home', 'o_plan')],
  },
  super_admin: {
    role: 'super_admin', title: bi('Super admin: hub, dev tools, canvas, plan', 'Superadministrador: hub, herramientas, lienzo, plan'), entry: 'HUB-01',
    steps: [
      page('a_hub', 'HUB-01', '/', 'Hub: enter as any role', 'Hub: entrar como cualquier rol'),
      page('a_dev', 'D-03', '/dev', 'Dev tools and specs', 'Herramientas y especificaciones'),
      page('a_canvas', 'D-21', '/dev/canvas', 'Canvas with role flows', 'Lienzo con flujos por rol'),
      page('a_sim', 'D-22', '/dev/simulator', 'Simulator', 'Simulador'),
      page('a_plan', 'PM-01', '/plan', 'Plan', 'Plan'),
      page('a_feedback', 'A-05', '/admin/feedback', 'Triage annotations', 'Triaje de anotaciones'),
    ],
    edges: [e('a_hub', 'a_dev'), e('a_dev', 'a_canvas'), e('a_canvas', 'a_sim'), e('a_hub', 'a_plan'), e('a_dev', 'a_feedback')],
  },
  opposing_counsel: {
    role: 'opposing_counsel', title: bi('Opposing counsel: served, acknowledge, confer', 'Abogado contrario: notificado, acusar recibo, conferir'), entry: 'X-01',
    steps: [
      page('x_home', 'X-01', '/opposition', 'Documents served on me', 'Documentos que me notificaron'),
      page('x_service', 'X-10', P['X-10'], 'Service detail and proof', 'Detalle y prueba de notificación', true),
      action('x_ack', 'X-10', P['X-10'], 'Acknowledge receipt', 'Acusar recibo', true),
      page('x_confer', 'X-11', P['X-11'], 'Meet and confer', 'Reunión para conferir', true),
      handoff('x_to_attorney', 'L-14', P['L-14'], 'attorney', 'Our attorney sees the acknowledgement', 'Nuestro abogado ve el acuse'),
    ],
    edges: [e('x_home', 'x_service'), e('x_service', 'x_ack', 'positive'), e('x_ack', 'x_to_attorney', 'handoff', undefined, 'attorney'), e('x_home', 'x_confer')],
  },
  marketing: {
    role: 'marketing', title: bi('Marketing: site, videos, leads', 'Marketing: sitio, videos, prospectos'), entry: 'MK-01',
    steps: [
      page('m_site', 'P-01', '/site', 'The public site', 'El sitio público'),
      page('m_videos', 'C-40', P['C-40'], 'The free video library', 'La videoteca gratuita', true),
      page('m_leads', 'MK-01', '/marketing', 'Leads and funnel', 'Prospectos y embudo', true),
      page('m_content', 'MK-02', P['MK-02'], 'Content calendar', 'Calendario de contenido', true),
      handoff('m_to_desk', 'F-10', P['F-10'], 'front_desk', 'Lead becomes an intake', 'El prospecto pasa a admisión'),
    ],
    edges: [e('m_site', 'm_videos'), e('m_videos', 'm_leads', 'positive', ['form fill', 'formulario enviado']), e('m_leads', 'm_to_desk', 'handoff', undefined, 'front_desk'), e('m_leads', 'm_content')],
  },
  public: {
    role: 'public', title: bi('Visitor: site, videos, store, consultation', 'Visitante: sitio, videos, tienda, consulta'), entry: 'P-01',
    steps: [
      page('p_site', 'P-01', '/site', 'Landing', 'Inicio'),
      page('p_board', 'GB-01', '/board', 'The eviction game board', 'El tablero del desalojo'),
      page('p_videos', 'C-40', P['C-40'], 'Free videos', 'Videos gratuitos', true),
      page('p_store', 'P-10', '/site/services', 'Services by stage', 'Servicios por etapa'),
      page('p_how', 'P-12', '/site/how-it-works', 'How it works', 'Cómo funciona'),
      action('p_consult', 'P-11', '/site/services/:sku', 'Book the consultation', 'Reservar la consulta'),
      handoff('p_to_client', 'C-01', '/app', 'client', 'Becomes a client', 'Se convierte en cliente'),
    ],
    edges: [e('p_site', 'p_board'), e('p_site', 'p_videos'), e('p_videos', 'p_store'), e('p_store', 'p_how'), e('p_how', 'p_consult'), e('p_consult', 'p_to_client', 'handoff', ['consultation before documents', 'consulta antes que documentos'], 'client')],
  },
};

/** Every page code any flow touches, with whether it is planned (for the canvas to draw dashed frames). */
export function flowCodes(): { code: string; path: string; planned: boolean; roles: Role[] }[] {
  const seen = new Map<string, { code: string; path: string; planned: boolean; roles: Role[] }>();
  for (const flow of Object.values(ROLE_FLOWS)) {
    for (const n of flow.steps) {
      const cur = seen.get(n.code) ?? { code: n.code, path: n.path, planned: !!n.planned, roles: [] };
      if (!cur.roles.includes(flow.role)) cur.roles.push(flow.role);
      seen.set(n.code, cur);
    }
  }
  return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

/** Edges that leave one role's flow for another's (the cross-role lines on the canvas). */
export const handoffEdges = (): (FlowEdge & { fromRole: Role })[] =>
  Object.values(ROLE_FLOWS).flatMap((f) => f.edges.filter((x) => x.kind === 'handoff' && x.toRole).map((x) => ({ ...x, fromRole: f.role })));
