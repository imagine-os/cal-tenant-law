/**
 * Ops-manual seed: intentionally empty. Reading progress belongs to the person reading, so a fresh demo database
 * starts with nobody having read anything; M-01 and M-02 create rows as people mark chapters read.
 */
import type { SeedCtx } from './index';

export const order = 120;

export function seed(_ctx: SeedCtx): void {
  // no rows: manual_progress fills up as demo users read chapters (M-01 / M-02).
}
