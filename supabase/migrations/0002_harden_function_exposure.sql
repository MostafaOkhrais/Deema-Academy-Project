-- Applied after 0001. is_admin() is only needed by RLS policies, so it moves out of
-- the exposed API schema (public) into a private one.
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_admin() set schema private;
grant execute on function private.is_admin() to authenticated;

-- Helper installed by the project option "Enable automatic RLS": the event trigger
-- does not need callers to have EXECUTE.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
