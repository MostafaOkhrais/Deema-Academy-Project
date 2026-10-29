-- Deema Academy: accounts, enrollments and certificates.
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Security lives here: the browser only ever holds the public anon key,
-- every table is protected by row level security.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  phone      text not null default '',
  city       text not null default '',
  status     text not null default '',
  major      text not null default '',
  year       text not null default '',
  role       text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Copy the sign-up form data (user metadata) into a profile automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, city, status, major, year)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'status', ''),
    coalesce(new.raw_user_meta_data ->> 'major', ''),
    coalesce(new.raw_user_meta_data ->> 'year', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Used by policies. security definer avoids recursive policy evaluation.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- enrollments: tracks and workshops a member signed up for
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('track', 'workshop')),
  ref        text not null,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  format     text not null default '',
  goal       text not null default '',
  ticket     text not null unique default ('DA-' || lpad((floor(random() * 1000000))::int::text, 6, '0')),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index enrollments_user_idx on public.enrollments (user_id);

-- ---------------------------------------------------------------------------
-- certificates: issued by an admin
-- ---------------------------------------------------------------------------
create table public.certificates (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  title     text not null,
  ref       text not null default '',
  code      text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  issued_at timestamptz not null default now()
);
create index certificates_user_idx on public.certificates (user_id);

-- Public verification: returns only the holder's name and title for a code.
create function public.verify_certificate(p_code text)
returns table (holder text, title text, issued_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.full_name, c.title, c.issued_at
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  where c.code = upper(trim(p_code));
$$;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.enrollments  enable row level security;
alter table public.certificates enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Members may edit only these columns; role and email can never be changed from the browser.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, city, status, major, year) on public.profiles to authenticated;

-- Explicit privileges, so this works even when "Automatically expose new tables"
-- is switched off (recommended). Row level security still decides which rows.
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant update (status) on public.enrollments to authenticated;               -- policy: admins only
grant select, insert, update, delete on public.certificates to authenticated; -- policy: writes admins only
-- Internal functions must not be callable as public RPC endpoints.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- enrollments
create policy "enrollments: read own or admin" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "enrollments: create own as pending" on public.enrollments
  for insert with check (user_id = auth.uid() and status = 'pending');
create policy "enrollments: cancel own pending" on public.enrollments
  for delete using (user_id = auth.uid() and status = 'pending');
create policy "enrollments: admin updates" on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());

-- certificates
create policy "certificates: read own or admin" on public.certificates
  for select using (user_id = auth.uid() or public.is_admin());
create policy "certificates: admin writes" on public.certificates
  for all using (public.is_admin()) with check (public.is_admin());

revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself the first admin (replace the email, run once after signing up):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
