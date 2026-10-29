-- Security hardening found in the audit. Applied after 0002.

-- 1. Least privilege: start from nothing, then grant exactly what the site uses.
revoke all on public.profiles, public.enrollments, public.certificates from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, city, status, major, year) on public.profiles to authenticated;

grant select, delete on public.enrollments to authenticated;
grant insert (user_id, kind, ref, format, goal) on public.enrollments to authenticated;
grant update (status) on public.enrollments to authenticated;               -- policy: admins only

grant select, delete on public.certificates to authenticated;               -- policy: writes admins only
grant insert (user_id, title, ref) on public.certificates to authenticated;
grant update (title, ref) on public.certificates to authenticated;

-- Future objects created by migrations are not exposed to the API roles by default.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- 2. Policies: evaluate auth.uid() once per query, and one policy per action.
drop policy "profiles: read own or admin" on public.profiles;
drop policy "profiles: update own" on public.profiles;
drop policy "enrollments: read own or admin" on public.enrollments;
drop policy "enrollments: create own as pending" on public.enrollments;
drop policy "enrollments: cancel own pending" on public.enrollments;
drop policy "enrollments: admin updates" on public.enrollments;
drop policy "certificates: read own or admin" on public.certificates;
drop policy "certificates: admin writes" on public.certificates;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "enrollments: read own or admin" on public.enrollments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "enrollments: create own as pending" on public.enrollments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy "enrollments: cancel own pending" on public.enrollments
  for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');
create policy "enrollments: admin updates" on public.enrollments
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "certificates: read own or admin" on public.certificates
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "certificates: admin insert" on public.certificates
  for insert to authenticated with check ((select private.is_admin()));
create policy "certificates: admin update" on public.certificates
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "certificates: admin delete" on public.certificates
  for delete to authenticated using ((select private.is_admin()));

-- 3. Data limits: stop oversized or unknown values at the database, whatever the client sends.
-- NOTE: when you add a track, add its id to enrollments_known_ref.
alter table public.profiles add constraint profiles_lengths check (
  char_length(email) <= 254 and char_length(full_name) <= 120 and char_length(phone) <= 30 and
  char_length(city) <= 80 and char_length(status) <= 40 and char_length(major) <= 40 and char_length(year) <= 40);
alter table public.enrollments add constraint enrollments_lengths check (
  char_length(format) <= 60 and char_length(goal) <= 1000);
alter table public.enrollments add constraint enrollments_known_ref check (
  (kind = 'workshop' and ref = 'graduation-project') or
  (kind = 'track' and ref in ('clinical', 'ai', 'content', 'research', 'remote')));
alter table public.certificates add constraint certificates_lengths check (
  char_length(title) <= 200 and char_length(ref) <= 60);

-- Sign-up metadata is client supplied: clip it so an oversized value cannot break sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, city, status, major, year)
  values (
    new.id,
    left(new.email, 254),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30),
    left(coalesce(new.raw_user_meta_data ->> 'city', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'status', ''), 40),
    left(coalesce(new.raw_user_meta_data ->> 'major', ''), 40),
    left(coalesce(new.raw_user_meta_data ->> 'year', ''), 40)
  );
  return new;
end;
$$;
