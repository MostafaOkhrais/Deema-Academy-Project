import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** False until the two PUBLIC_SUPABASE_* variables are set (see .env.example). */
export const accountsEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Single browser client. Throws if accounts are not configured. */
export function supabase(): SupabaseClient {
  if (!accountsEnabled) throw new Error('Supabase is not configured');
  client ??= createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
