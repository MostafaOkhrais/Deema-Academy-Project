import type { Session } from '@supabase/supabase-js';
import { supabase, accountsEnabled } from './supabase';
import { tracks } from '../data/tracks';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  city: string;
  status: string;
  major: string;
  year: string;
  role: 'member' | 'admin';
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Enrollment {
  id: string;
  user_id: string;
  kind: 'track' | 'workshop';
  ref: string;
  status: EnrollmentStatus;
  format: string;
  goal: string;
  ticket: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  title: string;
  ref: string;
  code: string;
  issued_at: string;
}

export const WORKSHOP_REF = 'graduation-project';
export const WORKSHOP_TITLE = 'ورشة مشروع التخرج المجانية';

export const statusLabel: Record<EnrollmentStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'غير مقبول',
  completed: 'مكتمل',
};

export function enrollmentTitle(e: Pick<Enrollment, 'kind' | 'ref'>): string {
  if (e.kind === 'workshop') return WORKSHOP_TITLE;
  return tracks.find((t) => t.id === e.ref)?.title ?? e.ref;
}

/** Turn Supabase/Postgres error messages into Arabic the member can act on. */
export function arabicError(error: { message?: string; code?: string } | null | undefined): string {
  const m = (error?.message ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (m.includes('email not confirmed')) return 'فعّل بريدك الإلكتروني أولاً من الرسالة التي أرسلناها لك.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.';
  if (m.includes('password') && (m.includes('short') || m.includes('at least'))) return 'كلمة المرور قصيرة، استخدم 8 أحرف على الأقل.';
  if (m.includes('rate limit') || m.includes('too many')) return 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة.';
  if (m.includes('duplicate') || error?.code === '23505') return 'هذا الطلب مسجّل لديك مسبقاً.';
  if (m.includes('too many questions')) return 'وصلتنا أسئلة كثيرة الآن، حاول بعد دقائق.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

export async function getSession(): Promise<Session | null> {
  if (!accountsEnabled) return null;
  const { data } = await supabase().auth.getSession();
  return data.session;
}

/** Send the visitor to /login when there is no session; returns the session otherwise. */
export async function requireSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/login?next=${next}`);
    return null;
  }
  return session;
}

/**
 * Post-login destination. Parsed the way the browser will parse it, and accepted only if it stays on
 * this origin: this rejects `//evil.com`, `/\evil.com`, `javascript:` and absolute URLs.
 */
export function safeNext(raw: string | null, fallback = '/account'): string {
  if (!raw) return fallback;
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith('/')) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** Public inbox: the visitor does not need an account. */
export async function submitQuestion(question: string, contact: string) {
  const { error } = await supabase().from('questions').insert({ question, contact });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'status' | 'major' | 'year'>>) {
  const { error } = await supabase().from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase()
    .from('enrollments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as Enrollment[];
}

export async function enroll(userId: string, kind: Enrollment['kind'], ref: string, extra: { format?: string; goal?: string } = {}) {
  const { error } = await supabase().from('enrollments').insert({ user_id: userId, kind, ref, ...extra });
  if (error && error.code !== '23505') throw error; // already enrolled is fine
}

export async function cancelEnrollment(id: string) {
  const { error } = await supabase().from('enrollments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCertificates(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase()
    .from('certificates').select('*').eq('user_id', userId).order('issued_at', { ascending: false });
  if (error) throw error;
  return data as Certificate[];
}

export async function signOut() {
  await supabase().auth.signOut();
  location.assign('/');
}
