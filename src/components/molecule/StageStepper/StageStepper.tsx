import { useEffect, useRef } from 'react';
import { Icon } from '../../atom/Icon/Icon';
import './StageStepper.css';

export type StageStepState = 'done' | 'current' | 'todo' | 'skipped';
export interface StageStep {
  id: string;
  label: string;
  /** Second line under the label: the client-facing wording, a date, a name. */
  sublabel?: string;
  state: StageStepState;
  /** Group heading this step belongs to (Intake, Drafting, ...); consecutive steps sharing one render under a single heading. */
  group?: string;
}
export interface StageStepperProps {
  steps: StageStep[];
  /** Selecting a step (open its detail); the stepper never moves an order by itself. */
  onSelect?: (id: string) => void;
  /** Accessible name of the whole track. */
  ariaLabel: string;
  /** Stack vertically (phones do this anyway under 640 px). */
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
}

/**
 * A long pipeline track as a readable stepper: numbered dots on a rail, the stage name, an optional second line
 * (the client-facing wording on L-14, a date on C-11) and optional group headings. The library `Stepper` draws a
 * short numbered flow with one label per step; a document order has eighteen stages in six groups and needs the
 * current one findable at a glance, which is why this exists next to it rather than inside it.
 *
 * Scrolls horizontally on narrow screens and keeps the current step in view; stacks vertically under 640 px.
 */
export function StageStepper({ steps, onSelect, ariaLabel, orientation = 'horizontal', size = 'md' }: StageStepperProps) {
  const railRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = currentRef.current, rail = railRef.current;
    if (!el || !rail || orientation !== 'horizontal') return;
    const left = el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
  }, [steps, orientation]);

  let lastGroup: string | undefined;
  return (
    <ol ref={railRef} className={`stagestepper is-${orientation} is-${size}`} aria-label={ariaLabel}>
      {steps.map((s, i) => {
        const newGroup = s.group && s.group !== lastGroup;
        lastGroup = s.group;
        const inner = (
          <>
            <span className="stagestepper-dot" aria-hidden="true">{s.state === 'done' ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="stagestepper-text">
              <span className="stagestepper-label">{s.label}</span>
              {s.sublabel && <span className="stagestepper-sub">{s.sublabel}</span>}
            </span>
          </>
        );
        return (
          <li key={s.id} ref={s.state === 'current' ? currentRef : undefined} className={`stagestepper-step is-${s.state}`}
            aria-current={s.state === 'current' ? 'step' : undefined}>
            {newGroup && <span className="stagestepper-group">{s.group}</span>}
            {onSelect
              ? <button type="button" className="stagestepper-body" onClick={() => onSelect(s.id)}>{inner}</button>
              : <span className="stagestepper-body">{inner}</span>}
          </li>
        );
      })}
    </ol>
  );
}
