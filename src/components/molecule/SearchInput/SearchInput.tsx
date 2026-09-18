import { useEffect, useState, type FormEvent } from 'react';
import { Input } from '../../atom/Input/Input';
import { IconButton } from '../../atom/IconButton/IconButton';
import './SearchInput.css';

export interface SearchInputProps { value: string; onChange: (v: string) => void; onSubmit?: (v: string) => void; placeholder?: string; label: string; debounce?: number; className?: string }

/** Search field with icon, debounce, clear button and Enter to submit. Controlled; the parent filters. */
export function SearchInput({ value, onChange, onSubmit, placeholder, label, debounce = 150, className = '' }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { if (local === value) return; const t = setTimeout(() => onChange(local), debounce); return () => clearTimeout(t); }, [local, value, onChange, debounce]);
  const submit = (e: FormEvent) => { e.preventDefault(); onChange(local); onSubmit?.(local); };
  return (
    <form className={`searchinput ${className}`} role="search" onSubmit={submit}>
      <Input icon="search" type="search" aria-label={label} placeholder={placeholder ?? label} value={local} onChange={(e) => setLocal(e.target.value)} />
      {local && <IconButton icon="close" label="Clear search" size="sm" className="searchinput-clear" onClick={() => { setLocal(''); onChange(''); }} />}
    </form>
  );
}
