-- Job lifecycle management for GC/SC hiring control.
-- Safe to run multiple times. Existing jobs without status are treated as open.

alter table public.job_posts
  add column if not exists status text;

update public.job_posts
set status = 'open'
where status is null or btrim(status) = '';

update public.job_posts
set status = lower(btrim(status))
where status is not null;

update public.job_posts
set status = 'open'
where status not in ('open', 'filled', 'paused', 'closed', 'archived');

alter table public.job_posts
  alter column status set default 'open';

alter table public.job_posts
  drop constraint if exists job_posts_status_check;

alter table public.job_posts
  add constraint job_posts_status_check
  check (status in ('open', 'filled', 'paused', 'closed', 'archived'));

create index if not exists job_posts_status_project_company_idx
on public.job_posts(status, project_id, company_profile_id);

drop policy if exists "job_posts_select_public" on public.job_posts;
create policy "job_posts_select_public" on public.job_posts
  for select using (status = 'open');
