import { supabase } from './supabase';
import type { Enrollment, EnrollmentStatus, Profile, Certificate } from './accounts';

export interface AdminEnrollment extends Enrollment {
  profiles: Pick<Profile, 'full_name' | 'email' | 'phone' | 'major'> | null;
}

/** All of these rely on row level security: a non-admin simply gets no rows / an error. */
export async function fetchAllEnrollments(): Promise<AdminEnrollment[]> {
  const { data, error } = await supabase()
    .from('enrollments')
    .select('*, profiles(full_name, email, phone, major)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as unknown as AdminEnrollment[];
}

export async function setEnrollmentStatus(id: string, status: EnrollmentStatus) {
  const { error } = await supabase().from('enrollments').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function fetchMembers(): Promise<Profile[]> {
  const { data, error } = await supabase().from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function issueCertificate(userId: string, title: string, ref: string): Promise<Certificate> {
  const { data, error } = await supabase()
    .from('certificates').insert({ user_id: userId, title, ref }).select().single();
  if (error) throw error;
  return data as Certificate;
}

export interface Question {
  id: string;
  question: string;
  contact: string;
  created_at: string;
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase().from('questions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Question[];
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase().from('questions').delete().eq('id', id);
  if (error) throw error;
}
