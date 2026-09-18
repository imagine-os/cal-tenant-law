/** Deterministic PRNG (mulberry32) so every browser sees the same demo data. */
export function rng(seed = 20260918) {
  let a = seed >>> 0;
  const next = () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function at(day: Date, hh: number, mm = 0): string { const x = new Date(day); x.setHours(hh, mm, 0, 0); return x.toISOString(); }
