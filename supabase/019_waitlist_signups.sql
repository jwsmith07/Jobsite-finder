-- Public pre-launch waitlist signups.
-- Safe to run multiple times.

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups
  add column if not exists name text;

alter table public.waitlist_signups
  add column if not exists email text;

alter table public.waitlist_signups
  add column if not exists role text;

alter table public.waitlist_signups
  add column if not exists message text;

alter table public.waitlist_signups
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'waitlist_signups'
      and column_name = 'audience'
  ) then
    execute 'update public.waitlist_signups set role = coalesce(role, audience, ''Trades Worker'') where role is null';
  end if;
end $$;

update public.waitlist_signups
set role = 'Trades Worker'
where role is null;

alter table public.waitlist_signups
  alter column name set not null,
  alter column email set not null,
  alter column role set not null;

create unique index if not exists waitlist_signups_email_idx
on public.waitlist_signups (lower(email));

grant insert on table public.waitlist_signups to anon, authenticated;
grant select on table public.waitlist_signups to authenticated;

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_audience_check;

alter table public.waitlist_signups
  drop constraint if exists waitlist_signups_role_check;

alter table public.waitlist_signups
  add constraint waitlist_signups_role_check
  check (role in (
    'Trades Worker',
    'Subcontractor',
    'General Contractor',
    'Industry Partner',
    'Investor'
  ));

alter table public.waitlist_signups enable row level security;

drop policy if exists "waitlist_signups_insert_public" on public.waitlist_signups;
create policy "waitlist_signups_insert_public" on public.waitlist_signups
  for insert with check (true);

drop policy if exists "waitlist_signups_admin_select" on public.waitlist_signups;
create policy "waitlist_signups_admin_select" on public.waitlist_signups
  for select using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
