/** Enrollment choices made before the account existed (email confirmation pending). */
export const PENDING_KEY = 'deema-pending-enrollments';

export interface PendingEnrollment {
  kind: 'track' | 'workshop';
  ref: string;
}

export function readPending(raw: string | null): PendingEnrollment[] {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((p): p is PendingEnrollment => (p?.kind === 'track' || p?.kind === 'workshop') && typeof p?.ref === 'string')
      : [];
  } catch {
    return [];
  }
}
