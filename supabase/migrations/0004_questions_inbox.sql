-- Public "ask a question" inbox: anyone may submit, only admins may read or delete.
create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(question) between 6 and 1000),
  contact    text not null default '' check (char_length(contact) <= 120),
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

revoke all on public.questions from anon, authenticated;
grant insert (question, contact) on public.questions to anon, authenticated;
grant select, delete on public.questions to authenticated;

create policy "questions: anyone can submit" on public.questions
  for insert to anon, authenticated with check (true);
create policy "questions: admin reads" on public.questions
  for select to authenticated using ((select private.is_admin()));
create policy "questions: admin deletes" on public.questions
  for delete to authenticated using ((select private.is_admin()));

-- Flood guard: at most 30 submissions per 10 minutes for the whole site.
create function private.limit_question_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.questions where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'too many questions, try again later' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger questions_rate_limit
  before insert on public.questions
  for each row execute function private.limit_question_rate();

create index questions_created_idx on public.questions (created_at desc);
