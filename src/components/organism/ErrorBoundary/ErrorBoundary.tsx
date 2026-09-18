import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../../atom/Button/Button';
import { EmptyState } from '../../molecule/EmptyState/EmptyState';
import './ErrorBoundary.css';

export interface ErrorBoundaryProps { children: ReactNode; /** Reset key: a new value clears the error (App passes the route path). */ resetKey?: string; label?: string }
interface State { error: Error | null }

/** Catches a render error inside one page so a broken page never blanks the whole shell; offers reload and back-to-hub. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[petrock] page error', error, info.componentStack); }
  componentDidUpdate(prev: ErrorBoundaryProps) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="errbound" role="alert">
        <EmptyState icon="warning" title={this.props.label ?? 'This page hit an error'} body={error.message}
          action={<div className="row wrap"><Button onClick={() => this.setState({ error: null })}>Try again</Button><Button variant="secondary" onClick={() => { window.location.hash = '#/'; this.setState({ error: null }); }}>Back to hub</Button></div>} />
        <details className="errbound-details"><summary className="xs muted">Stack</summary><pre className="errbound-pre">{error.stack}</pre></details>
      </div>
    );
  }
}
