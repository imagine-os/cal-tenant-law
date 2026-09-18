import { Icon } from '../../atom/Icon/Icon';
import './Stepper.css';

export interface StepperProps { steps: string[]; current: number; onStepClick?: (i: number) => void; compact?: boolean }

/** Flow progress (Figma Step Pointer 443:17984): 27 px filled primary circles with white numbers, 2 px track primary (done) / #D0D5DD (remaining), no labels on phones or when compact. */
export function Stepper({ steps, current, onStepClick, compact = false }: StepperProps) {
  return (
    <ol className={`stepper ${compact ? 'is-compact' : ''}`} aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const clickable = !!onStepClick && i < current;
        return (
          <li key={s} className={`step is-${state}`} aria-current={i === current ? 'step' : undefined}>
            <button type="button" className="step-btn" disabled={!clickable} onClick={() => onStepClick?.(i)}>
              <span className="step-dot" aria-hidden>{state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="step-label">{s}</span>
            </button>
            {i < steps.length - 1 && <span className="step-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
