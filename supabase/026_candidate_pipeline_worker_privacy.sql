-- Candidate pipeline and worker talent visibility controls.
-- Safe to run multiple times.

alter table public.worker_profiles
  add column if not exists talent_visibility text not null default 'approved_gcs';

create index if not exists worker_profiles_talent_visibility_idx
  on public.worker_profiles(talent_visibility);

create table if not exists public.gc_candidate_pipeline (
  id bigserial primary key,
  gc_company_id bigint not null references public.company_profiles(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  worker_profile_id bigint not null references public.worker_profiles(id) on delete cascade,
  stage text not null default 'saved',
  notes text,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gc_company_id, project_id, worker_profile_id)
);

create index if not exists gc_candidate_pipeline_company_project_idx
  on public.gc_candidate_pipeline(gc_company_id, project_id);

create index if not exists gc_candidate_pipeline_worker_profile_id_idx
  on public.gc_candidate_pipeline(worker_profile_id);

create index if not exists gc_candidate_pipeline_stage_idx
  on public.gc_candidate_pipeline(stage);

alter table public.gc_candidate_pipeline enable row level security;

drop policy if exists "gc_candidate_pipeline_select_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_select_own_company" on public.gc_candidate_pipeline
  for select using (
    gc_company_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "gc_candidate_pipeline_insert_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_insert_own_company" on public.gc_candidate_pipeline
  for insert with check (
    gc_company_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "gc_candidate_pipeline_update_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_update_own_company" on public.gc_candidate_pipeline
  for update using (
    gc_company_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  ) with check (
    gc_company_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );

drop policy if exists "gc_candidate_pipeline_delete_own_company" on public.gc_candidate_pipeline;
create policy "gc_candidate_pipeline_delete_own_company" on public.gc_candidate_pipeline
  for delete using (
    gc_company_id in (
      select id from public.company_profiles where profile_id = auth.uid()
    )
  );
