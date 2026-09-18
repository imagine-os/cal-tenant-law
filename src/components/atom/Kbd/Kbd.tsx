import type { ReactNode } from 'react';
import './Kbd.css';
/** Keyboard key cap for shortcuts ("Ctrl + ."). */
export function Kbd({ children }: { children: ReactNode }) { return <kbd className="kbd">{children}</kbd>; }
