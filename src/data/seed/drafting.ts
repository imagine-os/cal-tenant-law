/**
 * Drafting seed (order 85, after pipeline 80 so the orders and client requests exist): ten document templates with
 * real skeleton text, their variables, the questions we ask a client before each one can be written, a
 * recommendations checklist and the statute rows they lean on; twelve California landlord-tenant precedents, all
 * unverified; six drafts on seeded orders across the studio's states; and draft questions in every state.
 *
 * Fixed ids other modules may rely on: templates `tpl_answer_ud`, `tpl_demurrer_ud`, `tpl_motion_quash`,
 * `tpl_motion_strike`, `tpl_form_rogs`, `tpl_motion_compel`, `tpl_opp_msj`, `tpl_trial_brief`, `tpl_notice_appeal`,
 * `tpl_demand_letter`; precedents `pre_001..pre_012`; drafts `drf_0131` (Answer, with the client), `drf_0128`
 * (motion to compel, rush, being written), `drf_0117` (motion to strike), `drf_0119` (demurrer, awaiting the
 * supervisor), `drf_0136` (motion to quash, blocked on the client), `drf_0109` (demand letter, finished);
 * draft questions `dqn_001..dqn_014`.
 *
 * Everything legal here is unverified (D-019, RULE-DRAFT-02 / 04): statute_refs name rows in
 * docs/legal/statute-index.md whose verified_on is null, and every precedent ships verified: false. The skeleton
 * text is a drafting starting point written for this demo, not a form the firm has approved.
 */
import type { SeedCtx } from './index';
import { addDays, at } from './rng';
import type { ChecklistItem, DocBlock, TemplateQuestion, TemplateVariable } from '../schema/drafting';

export const order = 85;

const NET = 'ten_network';

// --- small builders ---------------------------------------------------------------------------------------------
const b = (id: string, type: DocBlock['type'], text: string): DocBlock => ({ id, type, text });
const v = (key: string, label: string, type: TemplateVariable['type'], source: TemplateVariable['source'], required = true, extra: Partial<TemplateVariable> = {}): TemplateVariable => ({ key, label, type, source, required, ...extra });
const q = (id: string, text: string, why: string, kind: TemplateQuestion['kind'] = 'question', required = true): TemplateQuestion => ({ id, text, why, kind, required });
const ck = (id: string, text: string, rule_ref: string): ChecklistItem => ({ id, text, rule_ref });

/** Variables every pleading on California pleading paper needs; the studio fills them from the case, client and order rows. */
const CAPTION_VARS: TemplateVariable[] = [
  v('attorney_name', 'Attorney of record', 'text', 'order'),
  v('bar_number', 'State Bar number', 'text', 'order'),
  v('firm_name', 'Firm name', 'text', 'order'),
  v('firm_address', 'Firm address', 'text', 'order'),
  v('firm_phone', 'Firm phone', 'text', 'order'),
  v('firm_email', 'Firm email', 'text', 'order'),
  v('court', 'Court', 'court', 'case'),
  v('county', 'County', 'text', 'case'),
  v('plaintiff', 'Plaintiff (landlord)', 'party', 'case'),
  v('defendant', 'Defendant (our client)', 'party', 'client'),
  v('case_number', 'Case number', 'text', 'order'),
  v('today', 'Date of signature', 'date', 'manual', false, { hint: 'Defaults to today when the draft is printed' }),
];
const HEARING_VARS: TemplateVariable[] = [
  v('hearing_date', 'Hearing date and time', 'date', 'order', false),
  v('dept', 'Department', 'text', 'order', false),
  v('judge', 'Judge', 'text', 'order', false),
];
const SIGNATURE = (role: string) => b('sig', 'signature', `Dated: {{today}}\n\n{{firm_name}}\n\n\nBy: ______________________________\n{{attorney_name}}\nAttorney for ${role} {{defendant}}`);
const POS = b('pos', 'paragraph', 'PROOF OF SERVICE — attached separately. The paralegal assembles it at the filing stage; it is not part of this draft.');

interface TemplateSpec {
  id: string; code: string; title: string; kind: string; nodes: string[]; form: string | null; sku: string | null;
  blocks: DocBlock[]; vars: TemplateVariable[]; questions: TemplateQuestion[]; checklist: ChecklistItem[]; statutes: string[];
  ver: number; status: 'draft' | 'published'; notes: string;
}

const TEMPLATES: TemplateSpec[] = [
  // 1 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_answer_ud', code: 'TPL-ANSWER-UD', title: 'Answer to Unlawful Detainer Complaint', kind: 'pleading',
    nodes: ['answer-to-complaint'], form: 'UD-105', sku: '400', ver: 4, status: 'published',
    notes: 'Use when the response window is still open and there is no service defect worth a motion to quash. The Judicial Council form UD-105 covers the same ground; this pleading-paper version is used when the defenses need room. Check the response deadline before anything else (CCP §1167, 10 court days after service).',
    blocks: [
      b('h1', 'heading', 'ANSWER TO COMPLAINT FOR UNLAWFUL DETAINER'),
      b('p1', 'paragraph', 'Defendant {{defendant}} ("Defendant") answers the complaint for unlawful detainer filed by plaintiff {{plaintiff}} ("Plaintiff") as follows:'),
      b('h2', 'heading', 'GENERAL DENIAL'),
      b('n1', 'numbered', 'Defendant generally denies each allegation of the complaint and denies that Plaintiff is entitled to possession, to the rent claimed, to damages, to costs or to attorney fees.'),
      b('h3', 'heading', 'AFFIRMATIVE DEFENSES'),
      b('n2', 'numbered', 'FIRST AFFIRMATIVE DEFENSE (defective notice): The notice on which the complaint rests did not state the exact amount of rent due for the period claimed, and demanded more than was owed. A notice that overstates the rent will not support an unlawful detainer (CCP §1161).'),
      b('n3', 'numbered', 'SECOND AFFIRMATIVE DEFENSE (notice not served as required): The notice was not served in any manner permitted by law; it was {{notice_service_facts}} (CCP §1162).'),
      b('n4', 'numbered', 'THIRD AFFIRMATIVE DEFENSE (breach of the implied warranty of habitability): The premises were not tenantable during the period claimed. The conditions were: {{habitability_facts}}. Defendant gave Plaintiff notice of them on {{repair_notice_date}} (CC §1941 / §1941.1; CCP §1174.2).'),
      b('n5', 'numbered', 'FOURTH AFFIRMATIVE DEFENSE (rent excused): Plaintiff\'s own breach prevented Defendant\'s performance, excusing the rent demanded (CC §1511).'),
      b('n6', 'numbered', 'FIFTH AFFIRMATIVE DEFENSE (retaliation): The proceeding was brought in retaliation for Defendant\'s complaints about the condition of the premises made on {{repair_notice_date}} (CC §1942.5).'),
      b('n7', 'numbered', 'SIXTH AFFIRMATIVE DEFENSE (waiver by acceptance of rent): Plaintiff accepted rent for a period after the notice expired, reinstating the tenancy (CC §1945).'),
      b('n8', 'numbered', 'SEVENTH AFFIRMATIVE DEFENSE (owner and agent not disclosed): Plaintiff did not disclose the name and address of the owner or of the person authorised to receive notices, as the statute requires (CC §1962).'),
      b('n9', 'numbered', 'EIGHTH AFFIRMATIVE DEFENSE (unlawful late fees in the amount demanded): The sum demanded includes late charges that are not a reasonable estimate of any loss and may not be demanded as rent (CC §1671).'),
      b('n10', 'numbered', 'NINTH AFFIRMATIVE DEFENSE (no just cause stated): The tenancy is covered and the notice states no ground permitted by law (CC §1946.2).'),
      b('n11', 'numbered', 'TENTH AFFIRMATIVE DEFENSE (rent above the lawful ceiling): The rent demanded exceeds what may lawfully be charged for this unit (CC §1947.12).'),
      b('h4', 'heading', 'PRAYER'),
      b('p2', 'paragraph', 'Defendant asks that Plaintiff take nothing; that the court award possession to Defendant; that Defendant recover costs of suit and attorney fees if the lease or the law allows them; and for any other relief the court finds proper.'),
      SIGNATURE('Defendant'),
      b('pb', 'pagebreak', ''),
      POS,
    ],
    vars: [...CAPTION_VARS,
      v('notice_service_facts', 'How the notice actually reached the client', 'text', 'manual', true, { hint: 'e.g. "left in the mailbox with no copy mailed"' }),
      v('habitability_facts', 'Conditions and dates', 'text', 'manual', false),
      v('repair_notice_date', 'Date the client told the landlord', 'date', 'manual', false),
    ],
    questions: [
      q('aq1', 'When were you served with the summons and complaint, and how did they reach you?', 'The response window runs from service, and how the papers reached you decides whether a motion to quash comes before the answer (CCP §1167, §1162).'),
      q('aq2', 'Do you have the notice the landlord gave you? Please upload it, front and back, with the envelope.', 'Nearly every defense starts with what the notice says and how it arrived.', 'item'),
      q('aq3', 'Upload the summons and complaint you were served with.', 'We need the case number, the court and exactly what is alleged.', 'item'),
      q('aq4', 'Names of every adult living in the unit.', 'Anyone not named in the complaint has their own rights, and we may need a prejudgment claim for them.'),
      q('aq5', 'What is your monthly rent, when was it last paid, and how much does the landlord say you owe?', 'A notice that demands the wrong amount will not support an eviction.'),
      q('aq6', 'Upload your lease or rental agreement and any rent receipts or bank records for the last 12 months.', 'The lease sets the terms; the records show what was actually paid.', 'item'),
      q('aq7', 'List every repair problem, when it started and when you told the landlord.', 'This is the habitability defense; dates matter more than adjectives.'),
      q('aq8', 'Do you have photos, texts or emails about the repairs or about the landlord\'s conduct?', 'Contemporaneous messages are the strongest proof we can file.', 'item', false),
      q('aq9', 'Has the landlord accepted any money from you after the notice period ended?', 'Accepting rent after the notice expires can reinstate the tenancy.'),
      q('aq10', 'Has the landlord ever threatened you, entered without notice, or cut off a utility?', 'It can turn a defense into a claim of your own.', 'question', false),
    ],
    checklist: [
      ck('ac1', 'Confirm the response deadline: 10 court days after service, counted with the court-day rules.', 'CCP §1167'),
      ck('ac2', 'Check the notice for the exact amount, the period and the three-day count before relying on the notice defense.', 'CCP §1161'),
      ck('ac3', 'Check how the notice was served before pleading the service defense.', 'CCP §1162'),
      ck('ac4', 'Strike any affirmative defense the client\'s facts do not support; an unsupported defense costs credibility.', 'RULE-DRAFT-05'),
      ck('ac5', 'If the tenancy is covered, check whether the notice states a permitted ground.', 'CC §1946.2'),
      ck('ac6', 'If habitability is pleaded, the repair dates and the notice to the landlord must be in the file.', 'CC §1941 / §1941.1'),
      ck('ac7', 'Decide whether to demand a jury trial in the same filing.', 'CCP §1170.5'),
    ],
    statutes: ['CCP §1167', 'CCP §1161', 'CCP §1162', 'CCP §1170', 'CC §1941 / §1941.1', 'CCP §1174.2', 'CC §1511', 'CC §1942.5', 'CC §1945', 'CC §1962', 'CC §1671', 'CC §1946.2', 'CC §1947.12'],
  },
  // 2 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_demurrer_ud', code: 'TPL-DEMURRER-UD', title: 'Demurrer to Unlawful Detainer Complaint', kind: 'pleading',
    nodes: ['demurrer', 'evaluate-complaint-for-demurrer'], form: null, sku: '370', ver: 3, status: 'published',
    notes: 'A demurrer tests the complaint on its face: what is attached, what is alleged, who is suing. It is filed instead of an answer, within the same response window. Check whether a meet-and-confer requirement applies in unlawful detainer before filing (CCP §430.10 et seq., unverified).',
    blocks: [
      b('h1', 'heading', 'DEMURRER TO COMPLAINT FOR UNLAWFUL DETAINER; MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p1', 'paragraph', 'TO PLAINTIFF AND TO PLAINTIFF\'S ATTORNEY OF RECORD: PLEASE TAKE NOTICE that on {{hearing_date}}, in Department {{dept}} of this court, defendant {{defendant}} will and does demur to the complaint of plaintiff {{plaintiff}}.'),
      b('h2', 'heading', 'DEMURRER'),
      b('n1', 'numbered', 'GROUND ONE: The complaint does not state facts sufficient to constitute a cause of action for unlawful detainer, because {{ground_one}}.'),
      b('n2', 'numbered', 'GROUND TWO: The notice attached to the complaint is defective on its face: {{notice_defect}}.'),
      b('n3', 'numbered', 'GROUND THREE: Plaintiff lacks the capacity to sue, because {{capacity_defect}}.'),
      b('h3', 'heading', 'MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p2', 'paragraph', 'I. STATEMENT OF FACTS. {{facts}}'),
      b('p3', 'paragraph', 'II. A COMPLAINT THAT RESTS ON A DEFECTIVE NOTICE FAILS ON ITS FACE. An unlawful detainer complaint stands or falls with the notice it attaches; a notice that misstates the amount, the period or the parties does not support the action (CCP §1161; CCP §1166).'),
      b('p4', 'paragraph', 'III. THE COMPLAINT DOES NOT PLEAD WHAT THE STATUTE REQUIRES. {{argument}}'),
      b('p5', 'paragraph', 'IV. CONCLUSION. The demurrer should be sustained. Defendant asks that it be sustained without leave to amend, or in the alternative with leave limited to the defects identified above.'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('ground_one', 'First ground, one sentence', 'text', 'manual'),
      v('notice_defect', 'What is wrong with the notice', 'text', 'manual'),
      v('capacity_defect', 'Capacity problem, if any', 'text', 'manual', false),
      v('facts', 'Statement of facts', 'text', 'manual'),
      v('argument', 'Argument section', 'text', 'manual'),
    ],
    questions: [
      q('dq1', 'Upload every page of the complaint, including the notice and any exhibits attached to it.', 'A demurrer is decided on what the complaint says and attaches; we cannot argue about a page we have not read.', 'item'),
      q('dq2', 'When were you served, and how?', 'The demurrer is due in the same window as the answer.'),
      q('dq3', 'Is the person or company suing you the same one named on your lease and on your rent receipts?', 'A landlord doing business under an unregistered name, or a stranger to the lease, cannot maintain the action.'),
      q('dq4', 'Does the notice attached to the complaint match the notice you actually received?', 'A different or altered notice is a ground of its own.'),
      q('dq5', 'Upload your lease and the last twelve months of rent records.', 'They show who the landlord is and what the rent was.', 'item'),
      q('dq6', 'Has anyone from the landlord\'s side told you the amount was wrong, or offered to fix it?', 'It goes to the notice defect and to settlement.', 'question', false),
      q('dq7', 'Do you know whether the property is registered with the city or under a local rent ordinance?', 'Some ordinances require the complaint to plead compliance.', 'question', false),
    ],
    checklist: [
      ck('dc1', 'Attach or quote the defective notice; the argument must be visible on the face of the complaint.', 'CCP §1166'),
      ck('dc2', 'Reserve the hearing date before the notice is served; unlawful detainer calendars move fast.', 'CCP §1167.4'),
      ck('dc3', 'Check whether the meet-and-confer requirement applies in unlawful detainer.', 'CCP §430.10 et seq.'),
      ck('dc4', 'Plan the response window if the demurrer is overruled.', 'CCP §1167.3'),
      ck('dc5', 'Consider filing a motion to strike with the demurrer rather than after it.', 'CCP §430.10 et seq.'),
    ],
    statutes: ['CCP §430.10 et seq.', 'CCP §1166', 'CCP §1161', 'CCP §1167', 'CCP §1167.3', 'CCP §1167.4', 'B&P §17918', 'CC §1962'],
  },
  // 3 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_motion_quash', code: 'TPL-MTQ', title: 'Motion to Quash Service of Summons', kind: 'motion',
    nodes: ['service-bad-file-motion-to-quash', 'evaluate-service'], form: null, sku: '150', ver: 5, status: 'published',
    notes: 'First move when the papers did not reach the client the way the law requires. It is filed instead of an answer and it stops the clock while it is pending. The client declaration is the motion: get the dates and the physical facts exactly right.',
    blocks: [
      b('h1', 'heading', 'NOTICE OF MOTION AND MOTION TO QUASH SERVICE OF SUMMONS; DECLARATION OF {{defendant}}; MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p1', 'paragraph', 'TO PLAINTIFF AND TO PLAINTIFF\'S ATTORNEY OF RECORD: PLEASE TAKE NOTICE that on {{hearing_date}} in Department {{dept}} of this court, defendant {{defendant}} will move to quash the service of summons in this action.'),
      b('p2', 'paragraph', 'The motion is made on the ground that the summons and complaint were not served in any manner authorised by law, so the court has not acquired jurisdiction over Defendant (CCP §418.10; CCP §1167.4).'),
      b('h2', 'heading', 'DECLARATION OF {{defendant}}'),
      b('n1', 'numbered', 'I am the defendant in this action. I make this declaration of my own knowledge and could testify to it.'),
      b('n2', 'numbered', 'I live at {{service_address}}. {{residency_facts}}'),
      b('n3', 'numbered', 'No one handed me the summons and complaint. {{how_papers_arrived}}'),
      b('n4', 'numbered', 'I first saw the papers on {{date_found}}. {{discovery_facts}}'),
      b('n5', 'numbered', 'I did not receive a copy by mail, and no copy was left with anyone at my home (CCP §1162).'),
      b('n6', 'numbered', 'I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.'),
      b('p3', 'paragraph', 'Executed on {{today}} at {{county}} County, California.\n\n\n______________________________\n{{defendant}}'),
      b('h3', 'heading', 'MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p4', 'paragraph', 'I. Service of summons must follow the statute; substantial compliance is not enough when nothing in the record shows the papers reached the defendant in a permitted manner. A motion to quash is the way to raise it, and in unlawful detainer the motion is heard on a short calendar (CCP §418.10; CCP §1167.4).'),
      b('p5', 'paragraph', 'II. {{argument}}'),
      b('p6', 'paragraph', 'III. CONCLUSION. Defendant asks the court to quash the service of summons and to award Defendant the response time the statute provides if the motion is denied.'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('service_address', 'Address where service was attempted', 'text', 'client'),
      v('residency_facts', 'Who lives there and the layout', 'text', 'manual', false),
      v('how_papers_arrived', 'What actually happened', 'text', 'manual'),
      v('date_found', 'Date the client found the papers', 'date', 'manual'),
      v('discovery_facts', 'How the client found them', 'text', 'manual', false),
      v('argument', 'Argument section', 'text', 'manual'),
    ],
    questions: [
      q('mq1', 'Take a photo of the envelope the papers came in, front and back, and upload it.', 'The envelope often shows the date and the manner of delivery, which is the whole motion.', 'item'),
      q('mq2', 'What date did the papers appear, and where exactly did you find them?', 'The declaration has to say this precisely; "some time last week" will not do.'),
      q('mq3', 'Did anyone hand the papers to you or to anyone at your home?', 'Personal or substituted service defeats the motion; we need to know before we file.'),
      q('mq4', 'Did a second copy arrive by mail? If so, upload it with the envelope.', 'Post-and-mail service is only good if the mailing happened.', 'item'),
      q('mq5', 'Who else lives at the unit, and what are their ages?', 'Substituted service on a competent adult member of the household counts.'),
      q('mq6', 'Was anyone home on the days the process server says they tried?', 'Reasonable diligence is part of what we test.'),
      q('mq7', 'Do you have a doorbell camera, building entry log or security footage from those days?', 'It is the strongest answer to a proof of service.', 'item', false),
      q('mq8', 'Have you told the court or the landlord anything in writing about this case yet?', 'Appearing generally can waive the objection; we need to know first.'),
    ],
    checklist: [
      ck('qc1', 'File before any general appearance; a general appearance waives the objection.', 'CCP §418.10'),
      ck('qc2', 'Reserve the hearing date: the unlawful detainer motion is heard on a short calendar.', 'CCP §1167.4'),
      ck('qc3', 'Compare the declaration with the process server\'s proof of service line by line.', 'CCP §1162'),
      ck('qc4', 'Plan the response window if the motion is denied.', 'CCP §1167.3'),
      ck('qc5', 'If the motion is denied, consider the writ petition and its deadline.', 'CCP §418.10'),
    ],
    statutes: ['CCP §418.10', 'CCP §1167.4', 'CCP §1162', 'CCP §1167.3', 'CCP §1167'],
  },
  // 4 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_motion_strike', code: 'TPL-MTS', title: 'Motion to Strike Portions of the Complaint', kind: 'motion',
    nodes: ['demurrer'], form: null, sku: '380', ver: 2, status: 'published',
    notes: 'Filed with the demurrer, not after it. Use it for prayer items with no basis: attorney fees where no lease clause or statute allows them, punitive damages, holdover damages calculated on the wrong figure.',
    blocks: [
      b('h1', 'heading', 'NOTICE OF MOTION AND MOTION TO STRIKE PORTIONS OF THE COMPLAINT; MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p1', 'paragraph', 'TO PLAINTIFF AND TO PLAINTIFF\'S ATTORNEY OF RECORD: PLEASE TAKE NOTICE that on {{hearing_date}} in Department {{dept}} of this court, defendant {{defendant}} will move to strike the portions of the complaint listed below.'),
      b('h2', 'heading', 'PORTIONS TO BE STRICKEN'),
      b('n1', 'numbered', 'Paragraph {{para_fees}} and the corresponding prayer for attorney fees: no lease provision and no statute allows fees on this claim.'),
      b('n2', 'numbered', 'Paragraph {{para_damages}}: the daily damages figure rests on a rent amount the notice itself contradicts (CCP §1161).'),
      b('n3', 'numbered', 'Paragraph {{para_other}}: {{other_reason}}.'),
      b('h3', 'heading', 'MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p2', 'paragraph', 'I. A prayer for relief the law does not allow is properly stricken rather than answered, so the issues at trial are the real ones. {{argument}}'),
      b('p3', 'paragraph', 'II. CONCLUSION. Defendant asks that the identified paragraphs and prayer items be stricken.'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('para_fees', 'Paragraph number: fees', 'text', 'manual'),
      v('para_damages', 'Paragraph number: damages', 'text', 'manual'),
      v('para_other', 'Paragraph number: other', 'text', 'manual', false),
      v('other_reason', 'Why the other paragraph should go', 'text', 'manual', false),
      v('argument', 'Argument section', 'text', 'manual'),
    ],
    questions: [
      q('sq1', 'Upload your lease, including every page and any addendum.', 'An attorney-fee clause is either in the lease or it is not; we need to see it.', 'item'),
      q('sq2', 'What is your actual monthly rent, and has it changed in the last two years?', 'The daily damages figure is built on it.'),
      q('sq3', 'Did you receive any written rent increase notices? Upload them.', 'An increase that was not noticed properly cannot set the figure.', 'item', false),
      q('sq4', 'Has the landlord charged you late fees, and how much?', 'Fees rolled into the rent demand are a separate ground.'),
      q('sq5', 'Are there charges on the complaint you do not recognise?', 'Point us at them; we will check each one.'),
      q('sq6', 'Did you ever sign anything agreeing to pay the landlord\'s legal costs?', 'It is the other half of the fee question.'),
    ],
    checklist: [
      ck('tc1', 'File with the demurrer so both are heard together.', 'CCP §430.10 et seq.'),
      ck('tc2', 'Quote each portion to be stricken by page and line; a general attack will be denied.', 'RULE-DRAFT-05'),
      ck('tc3', 'Check the late-fee figures before attacking the rent amount.', 'CC §1671'),
      ck('tc4', 'Confirm the hearing date is inside the unlawful detainer calendar rules.', 'CCP §1167.4'),
    ],
    statutes: ['CCP §430.10 et seq.', 'CCP §1161', 'CC §1671', 'CCP §1167.4', 'CC §3302'],
  },
  // 5 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_form_rogs', code: 'TPL-DISC-ROGS', title: 'Form Interrogatories Cover and Special Interrogatories, Set One', kind: 'discovery',
    nodes: ['discovery-requests'], form: 'DISC-003', sku: '254', ver: 3, status: 'published',
    notes: 'The cover page that goes with the Judicial Council unlawful detainer form interrogatories, plus the shell for special interrogatories. Discovery responses are shortened in unlawful detainer (CCP §1170.8, unverified) — calendar the response date the day it goes out.',
    blocks: [
      b('h1', 'heading', 'DEFENDANT\'S FORM INTERROGATORIES — UNLAWFUL DETAINER, SET ONE, AND SPECIAL INTERROGATORIES, SET ONE, TO PLAINTIFF {{plaintiff}}'),
      b('p1', 'paragraph', 'PROPOUNDING PARTY: Defendant {{defendant}}\nRESPONDING PARTY: Plaintiff {{plaintiff}}\nSET NUMBER: One'),
      b('p2', 'paragraph', 'Defendant requests that Plaintiff answer the attached Judicial Council form interrogatories for unlawful detainer, and the special interrogatories below, separately and in writing, under oath, within the time the statute allows for unlawful detainer (CCP §1170.8).'),
      b('h2', 'heading', 'DEFINITIONS'),
      b('n1', 'numbered', '"THE PREMISES" means {{service_address}}.'),
      b('n2', 'numbered', '"THE NOTICE" means the notice attached to the complaint in this action.'),
      b('n3', 'numbered', '"YOU" means Plaintiff and anyone acting on Plaintiff\'s behalf, including any manager or agent.'),
      b('h3', 'heading', 'SPECIAL INTERROGATORIES'),
      b('n4', 'numbered', 'State the exact amount of rent YOU contend was due for each month claimed in THE NOTICE.'),
      b('n5', 'numbered', 'State every payment YOU received for THE PREMISES in the twelve months before THE NOTICE, with the date and amount of each.'),
      b('n6', 'numbered', 'Describe how THE NOTICE was served, stating the date, the time, the person who served it and the manner of service.'),
      b('n7', 'numbered', 'IDENTIFY every person who has managed THE PREMISES in the last two years and state whether each held a real estate licence.'),
      b('n8', 'numbered', 'IDENTIFY every complaint about the condition of THE PREMISES YOU received in the last two years and state what YOU did about each.'),
      b('n9', 'numbered', 'State whether THE PREMISES have been inspected by any code enforcement or health agency in the last two years, and describe the result.'),
      b('n10', 'numbered', 'State the basis for each charge other than base rent that appears in THE NOTICE.'),
      b('n11', 'numbered', 'IDENTIFY the owner of record of THE PREMISES and state the date and manner in which that name and address were given to Defendant.'),
      b('n12', 'numbered', '{{extra_rogs}}'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS,
      v('service_address', 'The premises', 'text', 'client'),
      v('extra_rogs', 'Additional interrogatories for this case', 'text', 'manual', false),
    ],
    questions: [
      q('rq1', 'Upload the rent ledger or bank records for the last twelve months.', 'We ask the landlord for their version; yours is what we compare it against.', 'item'),
      q('rq2', 'What is the address of the unit exactly as it appears on your lease?', 'Every definition in the discovery hangs on it.'),
      q('rq3', 'Who collects the rent and who do you call about repairs?', 'Managers and agents are named in the interrogatories.'),
      q('rq4', 'Have you complained about the unit to the city, the county or a health department?', 'A code case is a document request of its own.'),
      q('rq5', 'Upload every written complaint you made to the landlord about repairs.', 'These become exhibits and follow-up requests.', 'item'),
      q('rq6', 'Did you ever pay in cash? If so, do you have receipts?', 'Cash payments are the usual dispute; receipts settle it.', 'question', false),
    ],
    checklist: [
      ck('rc1', 'Calendar the shortened response date the day the set goes out.', 'CCP §1170.8'),
      ck('rc2', 'Check the discovery cut-off against the trial date before serving.', 'CCP §1170.8'),
      ck('rc3', 'Serve the Judicial Council form interrogatories with this cover page, not instead of it.', 'CCP §2030 / §2031 / §2033'),
      ck('rc4', 'Plan the follow-up interrogatory to every denial in the requests for admission.', 'Form Interrogatories 17.1'),
    ],
    statutes: ['CCP §1170.8', 'CCP §2030 / §2031 / §2033', 'Form Interrogatories 17.1', 'CCP §2024.020', 'B&P §10130 / §10131'],
  },
  // 6 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_motion_compel', code: 'TPL-COMPEL', title: 'Motion to Compel Further Responses', kind: 'motion',
    nodes: ['motion-to-compel-and-postpone-trial', 'meet-and-confer-attempt'], form: null, sku: '316', ver: 4, status: 'published',
    notes: 'Used when responses arrive but are objections or evasions. A meet-and-confer letter has to go out first and be attached. In unlawful detainer the trial date usually has to move with the motion; say so in the notice.',
    blocks: [
      b('h1', 'heading', 'NOTICE OF MOTION AND MOTION TO COMPEL FURTHER RESPONSES; SEPARATE STATEMENT; DECLARATION OF COUNSEL'),
      b('p1', 'paragraph', 'TO PLAINTIFF AND TO PLAINTIFF\'S ATTORNEY OF RECORD: PLEASE TAKE NOTICE that on {{hearing_date}} in Department {{dept}} of this court, defendant {{defendant}} will move for an order compelling further responses to {{discovery_set}}, and for an order continuing the trial date so the responses can be used.'),
      b('p2', 'paragraph', 'The motion is made on the ground that the responses served on {{response_date}} consist of objections and evasive answers without substantive content (CCP §2030.290 / §2031.300).'),
      b('h2', 'heading', 'DECLARATION OF COUNSEL (MEET AND CONFER)'),
      b('n1', 'numbered', 'I am the attorney of record for Defendant. I make this declaration of my own knowledge.'),
      b('n2', 'numbered', 'On {{discovery_served_date}} I served {{discovery_set}} on Plaintiff.'),
      b('n3', 'numbered', 'On {{response_date}} Plaintiff served the responses attached as Exhibit A.'),
      b('n4', 'numbered', 'On {{meet_confer_date}} I sent the meet-and-confer letter attached as Exhibit B. {{meet_confer_result}}'),
      b('n5', 'numbered', 'I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct. Executed on {{today}}.'),
      b('h3', 'heading', 'SEPARATE STATEMENT'),
      b('p3', 'paragraph', 'For each request in dispute: the request in full, the response in full, and why a further response is required. {{separate_statement}}'),
      b('h4', 'heading', 'MEMORANDUM OF POINTS AND AUTHORITIES'),
      b('p4', 'paragraph', 'I. An objection that is not justified and an answer that does not answer are both grounds for a further response. {{argument}}'),
      b('p5', 'paragraph', 'II. The trial date should move so the answers can be used. Discovery in unlawful detainer closes shortly before trial, and a motion that is heard after the cut-off is worth nothing (CCP §1170.8).'),
      b('p6', 'paragraph', 'III. CONCLUSION. Defendant asks for an order compelling further verified responses without objections, for a continuance of the trial, and for sanctions if the court finds the responses were not substantially justified.'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('discovery_set', 'Which set is at issue', 'select', 'manual', true, { options: ['Form Interrogatories, Set One', 'Special Interrogatories, Set One', 'Requests for Production, Set One', 'Requests for Admission, Set One'] }),
      v('discovery_served_date', 'Date the set was served', 'date', 'manual'),
      v('response_date', 'Date the responses arrived', 'date', 'manual'),
      v('meet_confer_date', 'Date of the meet-and-confer letter', 'date', 'manual'),
      v('meet_confer_result', 'What came of it', 'text', 'manual', false),
      v('separate_statement', 'Separate statement body', 'text', 'manual'),
      v('argument', 'Argument section', 'text', 'manual'),
    ],
    questions: [
      q('cq1', 'Did the landlord or the manager give you any documents directly, outside the case?', 'If they handed you what they now say does not exist, the motion writes itself.', 'question', false),
      q('cq2', 'Upload anything you received from the landlord since the case started.', 'It goes in as an exhibit.', 'item', false),
      q('cq3', 'Is your trial date still the one on the notice? Please confirm the date.', 'The motion asks to move it; we cannot ask for the wrong date.'),
      q('cq4', 'Are there documents you know exist that the landlord has not produced?', 'Name them and we will ask for them specifically.'),
      q('cq5', 'Have you spoken to the landlord or their lawyer since the responses arrived?', 'Anything said can go in the meet-and-confer declaration.'),
    ],
    checklist: [
      ck('mc1', 'Attach the meet-and-confer letter and the responses as exhibits.', 'CCP §2030.290 / §2031.300'),
      ck('mc2', 'Ask for the trial continuance in the same notice, not separately.', 'CCP §1170.8'),
      ck('mc3', 'Check the discovery cut-off; a hearing after it is worthless.', 'CCP §2024.020'),
      ck('mc4', 'The separate statement must quote each request and response in full.', 'RULE-DRAFT-05'),
      ck('mc5', 'If nothing at all was served, this is the wrong motion — use the no-response motion.', 'CCP §2030.290 / §2031.300'),
    ],
    statutes: ['CCP §2030.290 / §2031.300', 'CCP §1170.8', 'CCP §2024.020', 'CCP §2033.280 (deemed admitted)', 'CCP §2030 / §2031 / §2033'],
  },
  // 7 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_opp_msj', code: 'TPL-OPP-MSJ', title: 'Opposition to Motion for Summary Judgment', kind: 'pleading',
    nodes: ['prepare-file-serve-sj-opposition', 'summary-judgment-motion-filed-by-landlord'], form: null, sku: '425', ver: 3, status: 'published',
    notes: 'Summary judgment in unlawful detainer moves on very short notice (CCP §1170.7, unverified): the opposition, the separate statement and the client declaration all have to be ready at once. One disputed material fact is enough; find it and build the whole opposition around it.',
    blocks: [
      b('h1', 'heading', 'DEFENDANT\'S OPPOSITION TO PLAINTIFF\'S MOTION FOR SUMMARY JUDGMENT; SEPARATE STATEMENT OF DISPUTED MATERIAL FACTS; DECLARATION OF {{defendant}}'),
      b('p1', 'paragraph', 'Defendant {{defendant}} opposes Plaintiff {{plaintiff}}\'s motion for summary judgment, set for hearing on {{hearing_date}} in Department {{dept}}.'),
      b('h2', 'heading', 'INTRODUCTION'),
      b('p2', 'paragraph', 'Summary judgment is not available where a material fact is genuinely disputed. Here at least {{dispute_count}} facts central to the claim are disputed on the evidence: {{disputed_summary}} (CCP §1170.7).'),
      b('h3', 'heading', 'SEPARATE STATEMENT OF DISPUTED MATERIAL FACTS'),
      b('p3', 'paragraph', 'Each of Plaintiff\'s asserted facts, Defendant\'s response, and the evidence relied on. {{separate_statement}}'),
      b('h4', 'heading', 'ARGUMENT'),
      b('p4', 'paragraph', 'I. THE NOTICE IS DISPUTED ON ITS FACE. {{argument_notice}}'),
      b('p5', 'paragraph', 'II. HABITABILITY IS A DISPUTED QUESTION OF FACT. The condition of the premises and what the landlord knew are classic jury questions (CC §1941 / §1941.1; CCP §1174.2).'),
      b('p6', 'paragraph', 'III. {{argument_other}}'),
      b('h5', 'heading', 'DECLARATION OF {{defendant}}'),
      b('n1', 'numbered', 'I am the defendant. I make this declaration of my own knowledge and could testify to it.'),
      b('n2', 'numbered', '{{declaration_facts}}'),
      b('n3', 'numbered', 'I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct. Executed on {{today}}.'),
      b('p7', 'paragraph', 'CONCLUSION. The motion should be denied and the case set for trial.'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('dispute_count', 'How many facts are disputed', 'text', 'manual'),
      v('disputed_summary', 'One sentence on the disputes', 'text', 'manual'),
      v('separate_statement', 'Separate statement body', 'text', 'manual'),
      v('argument_notice', 'Notice argument', 'text', 'manual'),
      v('argument_other', 'Third argument', 'text', 'manual', false),
      v('declaration_facts', 'Client declaration facts', 'text', 'manual'),
    ],
    questions: [
      q('oq1', 'Read the landlord\'s declaration and tell us every sentence you disagree with, and why.', 'One genuinely disputed fact defeats the motion; your own words are the evidence.'),
      q('oq2', 'Upload any photos, texts, emails or repair requests from the period the motion covers.', 'A declaration without documents is easy to attack.', 'item'),
      q('oq3', 'Were you home on the dates the landlord says you were served or spoken to?', 'Dates are the easiest disputes to prove.'),
      q('oq4', 'Do you have witnesses — neighbours, family, a repair worker — who saw the conditions?', 'We may need a short declaration from each.'),
      q('oq5', 'Can you sign a declaration this week? The hearing calendar is short.', 'Summary judgment in eviction cases moves on days, not weeks.'),
      q('oq6', 'Upload every rent payment record for the period the motion covers.', 'If the amount is disputed, the records are the dispute.', 'item'),
    ],
    checklist: [
      ck('oc1', 'Confirm the short notice period for summary judgment in unlawful detainer.', 'CCP §1170.7'),
      ck('oc2', 'The separate statement must answer every asserted fact; an unanswered fact is deemed undisputed.', 'RULE-DRAFT-05'),
      ck('oc3', 'Every disputed fact must cite evidence in the record, not argument.', 'RULE-DRAFT-05'),
      ck('oc4', 'Get the client declaration signed before the filing date, not on it.', 'RULE-DRAFT-01'),
      ck('oc5', 'If the motion is granted, the appeal and stay clock starts immediately.', 'CCP §1176'),
    ],
    statutes: ['CCP §1170.7', 'CC §1941 / §1941.1', 'CCP §1174.2', 'CCP §1161', 'CCP §1176'],
  },
  // 8 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_trial_brief', code: 'TPL-TRIAL-BRIEF', title: 'Trial Brief', kind: 'pleading',
    nodes: ['prepare-jury-trial-papers', 'trial-set-by-clerk'], form: null, sku: '460', ver: 2, status: 'published',
    notes: 'Filed with the trial documents. Keep it short and factual: the judge reads it the morning of trial. The exhibit list and witness list travel with it but are separate documents.',
    blocks: [
      b('h1', 'heading', 'DEFENDANT\'S TRIAL BRIEF'),
      b('p1', 'paragraph', 'Trial date: {{trial_date}} · Department {{dept}} · {{judge}}'),
      b('h2', 'heading', 'I. NATURE OF THE CASE'),
      b('p2', 'paragraph', 'Plaintiff {{plaintiff}} seeks possession of {{service_address}} on a notice served {{notice_date}}. Defendant {{defendant}} has lived there since {{move_in_date}}. {{case_summary}}'),
      b('h3', 'heading', 'II. ISSUES FOR TRIAL'),
      b('n1', 'numbered', 'Whether the notice stated the correct amount for the correct period (CCP §1161).'),
      b('n2', 'numbered', 'Whether the notice was served in a manner the statute permits (CCP §1162).'),
      b('n3', 'numbered', 'Whether the premises were tenantable during the period claimed, and by how much the rent should be reduced (CC §1941 / §1941.1; CCP §1174.2).'),
      b('n4', 'numbered', '{{extra_issue}}'),
      b('h4', 'heading', 'III. DEFENDANT\'S EVIDENCE'),
      b('p3', 'paragraph', '{{evidence_summary}}'),
      b('h5', 'heading', 'IV. LEGAL DISCUSSION'),
      b('p4', 'paragraph', '{{argument}}'),
      b('h6', 'heading', 'V. RELIEF REQUESTED'),
      b('p5', 'paragraph', 'Judgment for Defendant; in the alternative, a reduction of the rent found due to reflect the condition of the premises, and relief from forfeiture on payment of the reduced amount (CCP §1179).'),
      SIGNATURE('Defendant'),
    ],
    vars: [...CAPTION_VARS, ...HEARING_VARS,
      v('trial_date', 'Trial date', 'date', 'order'),
      v('service_address', 'The premises', 'text', 'client'),
      v('notice_date', 'Date of the notice', 'date', 'manual'),
      v('move_in_date', 'Move-in date', 'date', 'client'),
      v('case_summary', 'Two sentences on the case', 'text', 'manual'),
      v('extra_issue', 'Additional issue for trial', 'text', 'manual', false),
      v('evidence_summary', 'What the evidence shows', 'text', 'manual'),
      v('argument', 'Legal discussion', 'text', 'manual'),
    ],
    questions: [
      q('tq1', 'Confirm the exact date you moved in and the rent you paid at the start.', 'The brief opens with it and the judge checks it against the lease.'),
      q('tq2', 'Upload every photo and video of the conditions, with the dates they were taken.', 'The exhibit list is built from these.', 'item'),
      q('tq3', 'List the witnesses who can testify, with what each one saw.', 'We subpoena from this list.'),
      q('tq4', 'Are you available for the whole trial day, and do you need an interpreter?', 'The court needs notice for an interpreter.'),
      q('tq5', 'Upload the repair requests and the landlord\'s replies in date order.', 'The habitability issue is decided on the timeline.', 'item'),
      q('tq6', 'If the court finds some rent is owed, what could you pay and by when?', 'It is the relief-from-forfeiture question and it is asked at trial.'),
      q('tq7', 'Has anything changed at the unit since the case was filed?', 'A repair made last week changes the argument.', 'question', false),
    ],
    checklist: [
      ck('bc1', 'Confirm the trial-setting rules and the date before filing.', 'CCP §1170.5'),
      ck('bc2', 'File the exhibit list, witness list and any jury instructions with the brief.', 'CACI jury instructions'),
      ck('bc3', 'Include the relief-from-forfeiture request; it is easy to lose by omission.', 'CCP §1179'),
      ck('bc4', 'Check every rent figure in the brief against the ledger exhibit.', 'RULE-DRAFT-05'),
      ck('bc5', 'If a jury was demanded, confirm the demand and the fees are on file.', 'CCP §1170.5'),
    ],
    statutes: ['CCP §1170.5', 'CCP §1161', 'CCP §1162', 'CC §1941 / §1941.1', 'CCP §1174.2', 'CCP §1179', 'CACI jury instructions'],
  },
  // 9 -------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_notice_appeal', code: 'TPL-NOA', title: 'Notice of Appeal (Limited Civil)', kind: 'pleading',
    nodes: ['notice-of-appeal'], form: 'APP-102', sku: '600', ver: 2, status: 'published',
    notes: 'One page, and the deadline is the whole document. Verify the appeal deadline against the current rule before filing, and file the stay request the same day if the client is still in the unit (CCP §1176, unverified).',
    blocks: [
      b('h1', 'heading', 'NOTICE OF APPEAL'),
      b('p1', 'paragraph', 'NOTICE IS HEREBY GIVEN that defendant {{defendant}} appeals to the Appellate Division of the Superior Court of California, County of {{county}}, from the judgment entered in this action on {{judgment_date}}.'),
      b('n1', 'numbered', 'The judgment appealed from is a judgment after {{judgment_type}}.'),
      b('n2', 'numbered', 'The appeal is taken from the whole of the judgment.'),
      b('n3', 'numbered', 'Appellant elects to proceed on {{record_type}}.'),
      b('n4', 'numbered', 'Appellant requests a stay of enforcement pending appeal and will file the request separately (CCP §1176).'),
      SIGNATURE('Appellant'),
      b('pb', 'pagebreak', ''),
      b('p2', 'paragraph', 'NOTICE OF DESIGNATION OF THE RECORD ON APPEAL — filed with this notice. STATEMENT ON APPEAL — filed with this notice where the election requires it.'),
    ],
    vars: [...CAPTION_VARS,
      v('judgment_date', 'Date judgment was entered', 'date', 'manual'),
      v('judgment_type', 'What produced the judgment', 'select', 'manual', true, { options: ['trial', 'default', 'summary judgment', 'a ruling on a motion'] }),
      v('record_type', 'Record on appeal', 'select', 'manual', true, { options: ['a statement on appeal', 'a reporter\'s transcript', 'an agreed statement'] }),
    ],
    questions: [
      q('nq1', 'Upload the judgment and the notice of entry of judgment, with the dates visible.', 'The deadline is counted from these and nothing else.', 'item'),
      q('nq2', 'What date did you receive the notice of entry of judgment, and how?', 'It can change the deadline; we need it in writing.'),
      q('nq3', 'Are you still living in the unit?', 'It decides whether the stay request goes in today.'),
      q('nq4', 'Was there a court reporter at the trial or hearing?', 'It decides which kind of record we elect.'),
      q('nq5', 'Can you pay rent into court during the appeal, and how much per month?', 'A stay pending appeal usually depends on it.'),
      q('nq6', 'Has the sheriff posted anything on your door? Upload a photo if so.', 'A posted notice to vacate changes what we file first.', 'item'),
    ],
    checklist: [
      ck('nc1', 'Verify the appeal deadline against the current rule before filing; it is jurisdictional.', 'CCP §904.2 / Cal. Rules of Court 8.822'),
      ck('nc2', 'File the stay request in the trial court the same day if the client is still in the unit.', 'CCP §1176'),
      ck('nc3', 'File the designation of the record and the statement on appeal with the notice.', 'CCP §904.2 / Cal. Rules of Court 8.822'),
      ck('nc4', 'If the trial court denies the stay, calendar the appellate-court request immediately.', 'Cal. Rules of Court / Writ of Supersedeas'),
    ],
    statutes: ['CCP §904.2 / Cal. Rules of Court 8.822', 'CCP §1176', 'Cal. Rules of Court / Writ of Supersedeas', 'CCP §1174'],
  },
  // 10 ------------------------------------------------------------------------------------------------------------
  {
    id: 'tpl_demand_letter', code: 'TPL-DEMAND-REPAIRS', title: 'Demand Letter to Landlord: Repairs and Habitability', kind: 'letter',
    nodes: ['eviction-notice-or-lease-ends', 'you-stay-and-sue'], form: null, sku: '111', ver: 6, status: 'published',
    notes: 'Not a court document: firm letterhead, not pleading paper. Send it certified with a copy by email, and keep the proof — the letter is the notice that later supports repair-and-deduct, rent withholding or a retaliation claim.',
    blocks: [
      b('h1', 'heading', 'RE: HABITABILITY AND REPAIRS AT {{service_address}} — DEMAND FOR REPAIR'),
      b('p1', 'paragraph', '{{today}}\n\n{{landlord_name}}\n{{landlord_address}}\n\nSent by certified mail and email.'),
      b('p2', 'paragraph', 'Dear {{landlord_name}}:\n\nThis firm represents {{defendant}}, your tenant at {{service_address}}. Please direct all further communication about this matter to this office.'),
      b('h2', 'heading', 'THE CONDITIONS'),
      b('p3', 'paragraph', '{{conditions}}'),
      b('h3', 'heading', 'NOTICE ALREADY GIVEN'),
      b('p4', 'paragraph', 'Our client told you about these conditions on {{repair_notice_date}}, and again since. {{notice_history}}'),
      b('h4', 'heading', 'WHAT THE LAW REQUIRES'),
      b('p5', 'paragraph', 'A residential landlord must keep the premises tenantable, and the list of conditions that make a unit untenantable is set by statute (CC §1941 / §1941.1). Where a landlord does not repair after reasonable notice, a tenant may repair and deduct within the statutory limits (CC §1942), and rent may be excused where the landlord\'s breach prevents performance (CC §1511). A landlord may not demand rent while cited conditions remain unrepaired (CC §1942.4), and may not retaliate against a tenant for making these complaints (CC §1942.5).'),
      b('h5', 'heading', 'WHAT WE ASK'),
      b('n1', 'numbered', 'Repair the conditions listed above within {{deadline_days}} days of this letter.'),
      b('n2', 'numbered', 'Confirm in writing to this office when each repair will be made and by whom.'),
      b('n3', 'numbered', 'Credit our client {{credit_request}} for the period the unit has been in this condition.'),
      b('n4', 'numbered', 'Give 24 hours\' written notice before any entry, and enter only for the purposes the statute allows (CC §1954).'),
      b('p6', 'paragraph', 'If we do not hear from you by {{response_deadline}}, our client will consider every remedy available, including repair and deduct, rent withholding, a claim for the reduced value of the tenancy, and a report to code enforcement. This letter is not a threat; it is notice, and it will be an exhibit.'),
      b('p7', 'paragraph', 'Sincerely,\n\n\n{{attorney_name}}\n{{firm_name}}\nCounsel for {{defendant}}'),
    ],
    vars: [
      v('attorney_name', 'Attorney signing', 'text', 'order'),
      v('firm_name', 'Firm name', 'text', 'order'),
      v('firm_address', 'Firm address', 'text', 'order'),
      v('firm_phone', 'Firm phone', 'text', 'order'),
      v('firm_email', 'Firm email', 'text', 'order'),
      v('defendant', 'Our client', 'party', 'client'),
      v('service_address', 'The premises', 'text', 'client'),
      v('landlord_name', 'Landlord or manager', 'party', 'manual'),
      v('landlord_address', 'Where to send it', 'text', 'manual'),
      v('conditions', 'The conditions, one per line with dates', 'text', 'manual'),
      v('repair_notice_date', 'When the client first told them', 'date', 'manual'),
      v('notice_history', 'What happened since', 'text', 'manual', false),
      v('deadline_days', 'Days to repair', 'text', 'manual'),
      v('credit_request', 'Credit or rent reduction asked for', 'text', 'manual', false),
      v('response_deadline', 'Reply-by date', 'date', 'manual'),
      v('today', 'Date of the letter', 'date', 'manual', false),
    ],
    questions: [
      q('lq1', 'List every problem in the unit, room by room, with the date each one started.', 'The letter is only as good as the list; vague complaints get vague answers.'),
      q('lq2', 'Upload photos or video of each condition, with the dates.', 'They are attached to the letter and become exhibits later.', 'item'),
      q('lq3', 'When and how did you first tell the landlord or the manager? Upload the texts or emails.', 'The date of notice is what makes the remedies available.', 'item'),
      q('lq4', 'What is the landlord\'s or manager\'s full name and the address for notices?', 'A letter to the wrong address is not notice.'),
      q('lq5', 'Has any city or county inspector been out? Upload the report or the case number.', 'A citation changes what the landlord may demand.', 'item', false),
      q('lq6', 'What is your monthly rent, and is it current?', 'The credit we ask for is calculated from it.'),
      q('lq7', 'Have you paid for any repairs yourself? Upload the receipts.', 'These are the repair-and-deduct amounts.', 'item', false),
    ],
    checklist: [
      ck('lc1', 'Send certified with a copy by email, and keep both proofs in the binder.', 'RULE-DRAFT-05'),
      ck('lc2', 'Check the repair-and-deduct limits before stating an amount.', 'CC §1942'),
      ck('lc3', 'Name the statutory conditions that actually apply; do not list the whole statute.', 'CC §1941 / §1941.1'),
      ck('lc4', 'Warn the client that a demand letter can draw a retaliatory notice, and that retaliation is itself unlawful.', 'CC §1942.5'),
      ck('lc5', 'If an inspector has cited the unit, say so; it changes what the landlord may demand.', 'CC §1942.4'),
    ],
    statutes: ['CC §1941 / §1941.1', 'CC §1942', 'CC §1511', 'CC §1942.4', 'CC §1942.5', 'CC §1954', 'Health & Safety Code §17920.3', 'CC §1927'],
  },
];

// --- precedents ---------------------------------------------------------------------------------------------------
interface PrecedentSpec { id: string; title: string; citation: string; court: string; year: number; summary: string; holding: string; tags: string[]; nodes: string[]; statutes: string[] }

const PRECEDENTS: PrecedentSpec[] = [
  { id: 'pre_001', title: 'Green v. Superior Court', citation: 'Green v. Superior Court (1974) 10 Cal.3d 616', court: 'California Supreme Court', year: 1974,
    summary: 'Generally cited in California for the implied warranty of habitability in residential tenancies and for the proposition that its breach may be raised in an unlawful detainer.',
    holding: 'Cite when habitability is pleaded as a defense to a nonpayment eviction; pair it with the statutory conditions.', tags: ['habitability-repairs'], nodes: ['answer-to-complaint', 'prepare-jury-trial-papers'], statutes: ['CC §1941 / §1941.1', 'CCP §1174.2'] },
  { id: 'pre_002', title: 'Kwok v. Bergren', citation: 'Kwok v. Bergren (1982) 130 Cal.App.3d 596', court: 'California Court of Appeal', year: 1982,
    summary: 'Generally cited in discussions of defects in the notice that precedes an unlawful detainer and the consequences of a notice that does not meet the statute.',
    holding: 'Cite in the notice-defect defense and in a demurrer that attacks the notice attached to the complaint.', tags: ['unlawful-detainer-procedure'], nodes: ['answer-to-complaint', 'demurrer'], statutes: ['CCP §1161'] },
  { id: 'pre_003', title: 'Liebovich v. Shahrokhkhany', citation: 'Liebovich v. Shahrokhkhany (1997) 56 Cal.App.4th 511', court: 'California Court of Appeal', year: 1997,
    summary: 'Generally cited in discussions of who may bring an unlawful detainer and how the landlord and the tenancy must be identified in the notice and complaint.',
    holding: 'Cite when the party suing is not the party on the lease, or the notice names the wrong landlord.', tags: ['unlawful-detainer-procedure'], nodes: ['demurrer', 'answer-to-complaint'], statutes: ['CCP §1161', 'CC §1962'] },
  { id: 'pre_004', title: 'Borsuk v. Appellate Division', citation: 'Borsuk v. Appellate Division (2015) 242 Cal.App.4th 607', court: 'California Court of Appeal', year: 2015,
    summary: 'Generally cited in discussions of what a motion to quash may and may not be used for in an unlawful detainer, and of the alternative routes for attacking a defective complaint.',
    holding: 'Read together with Stancil before choosing between a motion to quash and a demurrer.', tags: ['unlawful-detainer-procedure'], nodes: ['service-bad-file-motion-to-quash', 'demurrer'], statutes: ['CCP §418.10', 'CCP §1167.4'] },
  { id: 'pre_005', title: 'Hinman v. Wagnon', citation: 'Hinman v. Wagnon (1959) 172 Cal.App.2d 24', court: 'California Court of Appeal', year: 1959,
    summary: 'Generally cited in discussions of waiver, where a landlord accepts rent for a period after the notice has expired.',
    holding: 'Cite in the waiver defense when rent was taken after the notice period ran.', tags: ['unlawful-detainer-procedure'], nodes: ['answer-to-complaint'], statutes: ['CC §1945', 'CCP §1161'] },
  { id: 'pre_006', title: 'Losornio v. Motta', citation: 'Losornio v. Motta (1998) 67 Cal.App.4th 110', court: 'California Court of Appeal', year: 1998,
    summary: 'Generally cited in discussions of the pleading and proof required of a landlord where a local ordinance or a statute requires a stated ground for the eviction.',
    holding: 'Cite when the notice states no permitted ground, or the complaint does not plead compliance with a local ordinance.', tags: ['rent-control-ab1482'], nodes: ['demurrer', 'answer-to-complaint'], statutes: ['CC §1946.2', 'Los Angeles RSO (LAMC ch. XV)'] },
  { id: 'pre_007', title: 'Palm Property Investments v. Yadegar', citation: 'Palm Property Investments v. Yadegar (2011) 194 Cal.App.4th 1419', court: 'California Court of Appeal', year: 2011,
    summary: 'Generally cited in discussions of habitability and of the effect of unpermitted or substandard conditions on what a landlord may recover.',
    holding: 'Cite alongside Green where the unit or a part of it was not lawfully habitable.', tags: ['habitability-repairs'], nodes: ['answer-to-complaint', 'prepare-file-serve-sj-opposition'], statutes: ['CC §1941 / §1941.1', 'Health & Safety Code §17920.3'] },
  { id: 'pre_008', title: 'Bevill v. Zoura', citation: 'Bevill v. Zoura (1994) 27 Cal.App.4th 694', court: 'California Court of Appeal', year: 1994,
    summary: 'Generally cited in discussions of a three-day notice that demands more rent than is actually due.',
    holding: 'The first case to reach for when the notice overstates the amount.', tags: ['unlawful-detainer-procedure'], nodes: ['answer-to-complaint', 'demurrer'], statutes: ['CCP §1161'] },
  { id: 'pre_009', title: 'Delta Imports v. Municipal Court', citation: 'Delta Imports v. Municipal Court (1983) 146 Cal.App.3d 1033', court: 'California Court of Appeal', year: 1983,
    summary: 'Generally cited in discussions of using a motion to quash to test an unlawful detainer complaint, and much discussed in the later cases on that question.',
    holding: 'Cite with Borsuk and Stancil; do not rely on it alone without checking the later authority.', tags: ['unlawful-detainer-procedure'], nodes: ['service-bad-file-motion-to-quash'], statutes: ['CCP §418.10', 'CCP §1167.4'] },
  { id: 'pre_010', title: 'Stancil v. Superior Court', citation: 'Stancil v. Superior Court (2021) 11 Cal.5th 381', court: 'California Supreme Court', year: 2021,
    summary: 'Generally cited in discussions of the proper use of a motion to quash in unlawful detainer and of how defects in the complaint should instead be raised.',
    holding: 'Read first when considering a motion to quash that attacks the complaint rather than service.', tags: ['unlawful-detainer-procedure'], nodes: ['service-bad-file-motion-to-quash', 'demurrer'], statutes: ['CCP §418.10', 'CCP §430.10 et seq.'] },
  { id: 'pre_011', title: 'Lamanna v. Vognar', citation: 'Lamanna v. Vognar (1993) 17 Cal.App.4th Supp. 4', court: 'Appellate Division, Superior Court', year: 1993,
    summary: 'Generally cited in discussions of the right to a jury trial in an unlawful detainer and of how and when it must be demanded.',
    holding: 'Cite when the jury demand or the fee timing is challenged.', tags: ['unlawful-detainer-procedure'], nodes: ['prepare-jury-trial-papers', 'jury-trial-requested'], statutes: ['CCP §1170.5'] },
  { id: 'pre_012', title: 'Levitz Furniture Co. v. Wingtip Communications', citation: 'Levitz Furniture Co. v. Wingtip Communications (2001) 86 Cal.App.4th 1035', court: 'California Court of Appeal', year: 2001,
    summary: 'Generally cited in discussions of summary judgment procedure in unlawful detainer, including the short notice the statute allows.',
    holding: 'Cite in the opposition when the timing or the notice of the motion is at issue.', tags: ['unlawful-detainer-procedure'], nodes: ['prepare-file-serve-sj-opposition', 'summary-judgment-motion-filed-by-landlord'], statutes: ['CCP §1170.7'] },
];

// --- drafts -------------------------------------------------------------------------------------------------------
interface DraftSpec {
  id: string; orderSeq: number; template: string; tenant: string; title: string; revision: number;
  status: 'editing' | 'sent_for_client_review' | 'approved' | 'final'; updatedDaysAgo: number; by: string;
  vars: Record<string, string>; hearing?: string | null; dept?: string | null; judge?: string | null;
}

const ATTORNEY_BLOCK: Record<string, string[]> = {
  ten_inland: ['Mateo Ruiz, Esq. (SBN 301244)', 'California Tenant Law', 'PO Box 2417', 'Idyllwild, CA 92549', 'Telephone: (951) 659-1234', 'Email: mateo@caltenantlaw.test', 'Attorney for Defendant'],
  ten_dtla: ['Priya Raghunathan, Esq. (SBN 248117)', 'California Tenant Law', '312 W. Fifth St. #512', 'Los Angeles, CA 90013', 'Telephone: (951) 659-1234', 'Email: priya@caltenantlaw.test', 'Attorney for Defendant'],
};
const COURT_OF: Record<string, string> = {
  ten_inland: 'SUPERIOR COURT OF THE STATE OF CALIFORNIA, COUNTY OF RIVERSIDE',
  ten_dtla: 'SUPERIOR COURT OF THE STATE OF CALIFORNIA, COUNTY OF LOS ANGELES',
};
const COUNTY_OF: Record<string, string> = { ten_inland: 'Riverside', ten_dtla: 'Los Angeles' };
const FIRM_VARS: Record<string, Record<string, string>> = {
  ten_inland: { attorney_name: 'Mateo Ruiz', bar_number: '301244', firm_name: 'California Tenant Law', firm_address: 'PO Box 2417, Idyllwild, CA 92549', firm_phone: '(951) 659-1234', firm_email: 'mateo@caltenantlaw.test' },
  ten_dtla: { attorney_name: 'Priya Raghunathan', bar_number: '248117', firm_name: 'California Tenant Law', firm_address: '312 W. Fifth St. #512, Los Angeles, CA 90013', firm_phone: '(951) 659-1234', firm_email: 'priya@caltenantlaw.test' },
};

const DRAFTS: DraftSpec[] = [
  { id: 'drf_0131', orderSeq: 131, template: 'tpl_answer_ud', tenant: 'ten_inland', title: 'Answer to Unlawful Detainer Complaint', revision: 1, status: 'sent_for_client_review', updatedDaysAgo: 7, by: 'usr_attorney',
    vars: { plaintiff: 'Sunset Park Holdings LLC', defendant: 'Dana Morales', notice_service_facts: 'taped to the door on a Sunday with no copy mailed', habitability_facts: 'a bathroom leak since November 2025, black mould behind the tile, and no heat from January to March 2026', repair_notice_date: '2025-11-14' } },
  { id: 'drf_0128', orderSeq: 128, template: 'tpl_motion_compel', tenant: 'ten_inland', title: 'Motion to Compel Further Responses', revision: 0, status: 'editing', updatedDaysAgo: 0, by: 'usr_attorney', dept: 'Dept. 4', judge: 'Hon. A. Whitfield',
    vars: { plaintiff: 'Coronado Ridge Properties LP', defendant: 'Marcus Ellery', discovery_set: 'Requests for Production, Set One', discovery_served_date: '2026-08-24', response_date: '2026-09-11', meet_confer_date: '2026-09-15', meet_confer_result: 'No substantive reply was received.' } },
  { id: 'drf_0117', orderSeq: 117, template: 'tpl_motion_strike', tenant: 'ten_dtla', title: 'Motion to Strike Portions of the Complaint', revision: 0, status: 'editing', updatedDaysAgo: 0, by: 'usr_atty_dtla', dept: 'Dept. 94',
    vars: { plaintiff: 'Figueroa Yards LLC', defendant: 'Tevin Boahene', para_fees: '12', para_damages: '9', argument: 'The lease contains no attorney-fee clause, and the daily damages figure uses a rent amount the notice itself contradicts.' } },
  { id: 'drf_0119', orderSeq: 119, template: 'tpl_demurrer_ud', tenant: 'ten_dtla', title: 'Demurrer to the Complaint', revision: 0, status: 'approved', updatedDaysAgo: 2, by: 'usr_atty_dtla', dept: 'Dept. 94',
    vars: { plaintiff: 'Figueroa Yards LLC', defendant: 'Tevin Boahene', ground_one: 'the complaint attaches a notice that demands rent for a period before the tenancy began', notice_defect: 'it demands $4,180 for March through May 2026, while the lease and the ledger show $1,395 per month for two of those months', capacity_defect: 'the plaintiff is not the owner named on the lease and no assignment is pleaded', facts: 'Defendant has rented the unit since March 2024. The notice attached to the complaint demands a sum that does not match any period of the tenancy.', argument: 'An unlawful detainer complaint rests on the notice it attaches. Where the notice on its face demands an amount the complaint\'s own allegations contradict, the complaint does not state a cause of action.' } },
  { id: 'drf_0136', orderSeq: 136, template: 'tpl_motion_quash', tenant: 'ten_inland', title: 'Motion to Quash Service of Summons', revision: 0, status: 'editing', updatedDaysAgo: 1, by: 'usr_paralegal',
    vars: { plaintiff: 'Hemet Valley Rentals Inc.', defendant: 'Yolanda Prieto-Nakamura', service_address: '4127 Alessandro Blvd., Apt. 12, Hemet, CA 92544', residency_facts: 'I live alone in a second-floor unit reached by a shared stair; the mailboxes are in the lobby.' } },
  { id: 'drf_0109', orderSeq: 109, template: 'tpl_demand_letter', tenant: 'ten_inland', title: 'Demand Letter to Landlord: Repairs and Habitability', revision: 0, status: 'final', updatedDaysAgo: 22, by: 'usr_attorney',
    vars: { defendant: 'Dana Morales', service_address: '9820 Vista Grande Dr., Apt. 4, Moreno Valley, CA 92553', landlord_name: 'Sunset Park Holdings LLC', landlord_address: '1140 E. Sixth St., Corona, CA 92879', conditions: 'Bathroom leak behind the tile, unrepaired since November 2025. Visible mould on the bathroom and bedroom walls. No heat from 4 January to 9 March 2026.', repair_notice_date: '2025-11-14', notice_history: 'Three further texts to the manager in December and January went unanswered.', deadline_days: '14', credit_request: 'a rent credit of 30 per cent for December 2025 through March 2026', response_deadline: '2026-08-29' } },
];

// --- draft questions ------------------------------------------------------------------------------------------------
interface DQSpec { id: string; draft: string; seq: number; question: string; kind: 'question' | 'item'; why: string; status: 'pending' | 'sent' | 'answered' | 'skipped'; answer?: string; request?: string; sentDaysAgo?: number; answeredDaysAgo?: number }

const DRAFT_QUESTIONS: DQSpec[] = [
  { id: 'dqn_001', draft: 'drf_0131', seq: 131, question: 'When were you served with the summons and complaint, and how did they reach you?', kind: 'question', why: 'The response window runs from service.', status: 'answered', answer: 'A man handed them to me at the door on 30 August, around 6pm.', request: 'crq_007', sentDaysAgo: 12, answeredDaysAgo: 10 },
  { id: 'dqn_002', draft: 'drf_0131', seq: 131, question: 'List every repair problem, when it started and when you told the landlord.', kind: 'question', why: 'This is the habitability defense; dates matter more than adjectives.', status: 'answered', answer: 'Bathroom leak from November 2025, mould behind the tile, no heat 4 Jan to 9 Mar. I texted the manager on 14 November and again twice in December.', request: 'crq_007', sentDaysAgo: 12, answeredDaysAgo: 10 },
  { id: 'dqn_003', draft: 'drf_0131', seq: 131, question: 'Has the landlord accepted any money from you after the notice period ended?', kind: 'question', why: 'Accepting rent after the notice expires can reinstate the tenancy.', status: 'sent', request: 'crq_001', sentDaysAgo: 6 },
  { id: 'dqn_004', draft: 'drf_0131', seq: 131, question: 'Do you have photos, texts or emails about the repairs?', kind: 'item', why: 'Contemporaneous messages are the strongest proof we can file.', status: 'pending' },
  { id: 'dqn_005', draft: 'drf_0136', seq: 136, question: 'Take a photo of the envelope the papers came in, front and back, and upload it.', kind: 'item', why: 'The envelope often shows the date and the manner of delivery, which is the whole motion.', status: 'sent', request: 'crq_004', sentDaysAgo: 9 },
  { id: 'dqn_006', draft: 'drf_0136', seq: 136, question: 'Who received the papers at your door?', kind: 'question', why: 'Personal or substituted service defeats the motion.', status: 'answered', answer: 'Nobody. They were left in the mailbox; I found them on the 8th.', request: 'crq_005', sentDaysAgo: 9, answeredDaysAgo: 8 },
  { id: 'dqn_007', draft: 'drf_0136', seq: 136, question: 'Did a second copy arrive by mail? If so, upload it with the envelope.', kind: 'item', why: 'Post-and-mail service is only good if the mailing happened.', status: 'pending' },
  { id: 'dqn_008', draft: 'drf_0136', seq: 136, question: 'Do you have a doorbell camera, building entry log or security footage from those days?', kind: 'item', why: 'It is the strongest answer to a proof of service.', status: 'pending' },
  { id: 'dqn_009', draft: 'drf_0136', seq: 136, question: 'Who else lives at the unit, and what are their ages?', kind: 'question', why: 'Substituted service on a competent adult member of the household counts.', status: 'skipped' },
  { id: 'dqn_010', draft: 'drf_0128', seq: 128, question: 'Is your trial date still the one on the notice? Please confirm the date.', kind: 'question', why: 'The motion asks to move it; we cannot ask for the wrong date.', status: 'pending' },
  { id: 'dqn_011', draft: 'drf_0128', seq: 128, question: 'Are there documents you know exist that the landlord has not produced?', kind: 'question', why: 'Name them and we will ask for them specifically.', status: 'pending' },
  { id: 'dqn_012', draft: 'drf_0117', seq: 117, question: 'Upload your lease, including every page and any addendum.', kind: 'item', why: 'An attorney-fee clause is either in the lease or it is not.', status: 'sent', sentDaysAgo: 1 },
  { id: 'dqn_013', draft: 'drf_0119', seq: 119, question: 'Does the notice attached to the complaint match the notice you actually received?', kind: 'question', why: 'A different or altered notice is a ground of its own.', status: 'answered', answer: 'No. The one they filed says $4,180. The one taped to my door said $2,790.', sentDaysAgo: 9, answeredDaysAgo: 7 },
  { id: 'dqn_014', draft: 'drf_0109', seq: 109, question: 'Have you paid for any repairs yourself? Upload the receipts.', kind: 'item', why: 'These are the repair-and-deduct amounts.', status: 'answered', answer: 'Yes, $184 for a space heater in January. Receipt uploaded.', sentDaysAgo: 30, answeredDaysAgo: 28 },
];

const wordsIn = (blocks: DocBlock[]): number => blocks.reduce((n, blk) => n + blk.text.split(/\s+/).filter(Boolean).length, 0);

export function seed(ctx: SeedCtx): void {
  const { add, now, db } = ctx;
  const ago = (days: number, hh = 11, mm = 0) => at(addDays(now, -days), hh, mm);
  const orderRows = db.orders ?? [];
  const caseNumberOf = (orderId: string): string => String(orderRows.find((o) => o.id === orderId)?.case_number ?? '');

  for (const t of TEMPLATES) {
    add('templates', {
      id: t.id, tenant_id: NET, code: t.code, title: t.title, document_kind: t.kind, board_node_ids: t.nodes,
      court_form_ref: t.form, sku: t.sku, body_blocks: t.blocks, variables: t.vars, questions: t.questions,
      checklist: t.checklist, statute_refs: t.statutes, template_version: t.ver, status: t.status, notes: t.notes,
      updated_at: ago(3 + (t.ver % 5), 14),
    });
  }

  for (const p of PRECEDENTS) {
    add('precedents', {
      id: p.id, tenant_id: NET, title: p.title, citation: p.citation, court: p.court, year: p.year,
      summary: p.summary, holding: p.holding, tags: p.tags, board_node_ids: p.nodes, statute_refs: p.statutes,
      url: null, verified: false, note: 'Verify the citation, the year and the holding in the reporter before this goes in a filing.',
    });
  }

  for (const d of DRAFTS) {
    const tpl = TEMPLATES.find((t) => t.id === d.template)!;
    const orderId = `ord_${String(d.orderSeq).padStart(4, '0')}`;
    const caseNumber = caseNumberOf(orderId);
    const vars: Record<string, string> = { ...FIRM_VARS[d.tenant], court: COURT_OF[d.tenant], county: COUNTY_OF[d.tenant], case_number: caseNumber, today: '', ...d.vars };
    add('drafts', {
      id: d.id, tenant_id: d.tenant, order_id: orderId, template_id: d.template, title: d.title, revision: d.revision,
      blocks: tpl.blocks.map((blk) => ({ ...blk })), status: d.status, word_count: wordsIn(tpl.blocks),
      updated_by_user_id: d.by, variables: vars,
      caption: {
        court: COURT_OF[d.tenant], county: COUNTY_OF[d.tenant],
        plaintiff: String(d.vars.plaintiff ?? ''), defendant: String(d.vars.defendant ?? ''),
        case_number: caseNumber, title: d.title.toUpperCase(),
        hearing_date: d.hearing ?? null, dept: d.dept ?? null, judge: d.judge ?? null,
        attorney_block: ATTORNEY_BLOCK[d.tenant],
      },
      created_at: ago(d.updatedDaysAgo + 3, 9), updated_at: ago(d.updatedDaysAgo, 16),
    });
  }

  for (const dq of DRAFT_QUESTIONS) {
    const d = DRAFTS.find((x) => x.id === dq.draft)!;
    add('draft_questions', {
      id: dq.id, tenant_id: d.tenant, draft_id: dq.draft, order_id: `ord_${String(dq.seq).padStart(4, '0')}`,
      question: dq.question, kind: dq.kind, why: dq.why, status: dq.status, answer: dq.answer ?? null,
      request_id: dq.request ?? null,
      sent_at: dq.sentDaysAgo != null ? ago(dq.sentDaysAgo, 10, 15) : null,
      answered_at: dq.answeredDaysAgo != null ? ago(dq.answeredDaysAgo, 19, 5) : null,
    });
  }
}
