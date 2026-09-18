import { useEffect, useState } from 'react';

/** True while the window is at or under `bp` px. Used by the canvas (list view) and the simulator (compact controls). */
export function useNarrow(bp: number): boolean {
  const [narrow, setNarrow] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(`(max-width: ${bp}px)`).matches));
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const h = () => setNarrow(mq.matches);
    mq.addEventListener('change', h);
    setNarrow(mq.matches);
    return () => mq.removeEventListener('change', h);
  }, [bp]);
  return narrow;
}
