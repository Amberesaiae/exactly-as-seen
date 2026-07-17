/**
 * Remember the flock the farmer just created / selected so Feed, Care, Eggs
 * open on the right batch in multi-flock farms (live-audit residual).
 */
const KEY = 'lf:preferred_batch_id';

export function setPreferredBatchId(batchId: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (!batchId) {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    sessionStorage.setItem(KEY, batchId);
  } catch {
    /* private mode */
  }
}

export function getPreferredBatchId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Pick preferred id if still in list; else null. */
export function resolvePreferredBatchId(activeIds: string[]): string | null {
  const pref = getPreferredBatchId();
  if (pref && activeIds.includes(pref)) return pref;
  return null;
}
