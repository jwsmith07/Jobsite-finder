-- Allow GC/SC to read worker_profiles for applicants to their jobs
-- Safe to run multiple times.

drop policy if exists "worker_profiles_select_company" on public.worker_profiles;
create policy "worker_profiles_select_company" on public.worker_profiles
  for select using (
    (auth.jwt()->'user_metadata'->>'role') in ('gc', 'sc')
  );