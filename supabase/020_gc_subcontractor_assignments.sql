-- GC subcontractor assignments.
-- Creates the V1 join table used by /gc/subcontractors.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.gc_subcontractor_assignments (
  id uuid primary key default gen_random_uuid(),
  gc_company_id bigint not null references public.company_profiles(id) on delete cascade,
  subcontractor_company_id bigint not null references public.company_profiles(id) on delete cascade,
  jobsite_id bigint not null references public.jobsites(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gc_subcontractor_assignments_unique
    unique (gc_company_id, subcontractor_company_id, jobsite_id)
);

create index if not exists gc_subcontractor_assignments_gc_company_id_idx
on public.gc_subcontractor_assignments(gc_company_id);

create index if not exists gc_subcontractor_assignments_subcontractor_company_id_idx
on public.gc_subcontractor_assignments(subcontractor_company_id);

create index if not exists gc_subcontractor_assignments_jobsite_id_idx
on public.gc_subcontractor_assignments(jobsite_id);

create index if not exists gc_subcontractor_assignments_status_idx
on public.gc_subcontractor_assignments(status);

drop trigger if exists gc_subcontractor_assignments_set_updated_at
on public.gc_subcontractor_assignments;

create trigger gc_subcontractor_assignments_set_updated_at
  before update on public.gc_subcontractor_assignments
  for each row execute function public.set_updated_at();

alter table public.gc_subcontractor_assignments enable row level security;

create or replace function public.is_admin_profile()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function public.current_user_company_id()
returns bigint
language sql
stable
as $$
  select company_profiles.id
  from public.company_profiles
  where company_profiles.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.gc_can_manage_assignment_jobsite(
  p_gc_company_id bigint,
  p_jobsite_id bigint
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.company_profiles
    join public.jobsites
      on jobsites.id = p_jobsite_id
    join public.project_claims
      on project_claims.project_id = jobsites.project_id
     and project_claims.company_profile_id = company_profiles.id
     and project_claims.status = 'approved'
    where company_profiles.profile_id = auth.uid()
      and company_profiles.id = p_gc_company_id
      and (
        project_claims.company_role = 'gc'
        or project_claims.claim_type = 'gc'
      )
  );
$$;

drop policy if exists "gc_subcontractor_assignments_admin_all"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_admin_all"
on public.gc_subcontractor_assignments
for all
using (public.is_admin_profile())
with check (public.is_admin_profile());

drop policy if exists "gc_subcontractor_assignments_gc_select"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_gc_select"
on public.gc_subcontractor_assignments
for select
using (
  public.gc_can_manage_assignment_jobsite(gc_company_id, jobsite_id)
);

drop policy if exists "gc_subcontractor_assignments_gc_insert"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_gc_insert"
on public.gc_subcontractor_assignments
for insert
with check (
  public.gc_can_manage_assignment_jobsite(gc_company_id, jobsite_id)
);

drop policy if exists "gc_subcontractor_assignments_gc_update"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_gc_update"
on public.gc_subcontractor_assignments
for update
using (
  public.gc_can_manage_assignment_jobsite(gc_company_id, jobsite_id)
)
with check (
  public.gc_can_manage_assignment_jobsite(gc_company_id, jobsite_id)
);

drop policy if exists "gc_subcontractor_assignments_gc_delete"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_gc_delete"
on public.gc_subcontractor_assignments
for delete
using (
  public.gc_can_manage_assignment_jobsite(gc_company_id, jobsite_id)
);

drop policy if exists "gc_subcontractor_assignments_subcontractor_select"
on public.gc_subcontractor_assignments;

create policy "gc_subcontractor_assignments_subcontractor_select"
on public.gc_subcontractor_assignments
for select
using (
  subcontractor_company_id = public.current_user_company_id()
);

notify pgrst, 'reload schema';
