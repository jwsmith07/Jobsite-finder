-- Owner-access RLS policies for the three profile tables.
-- Lets each signed-in user read AND write their own profile rows.
-- Safe to run multiple times.

-- ============================================================
-- profiles  (PK = id, which equals auth.uid())
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- worker_profiles  (profile_id = auth.uid())
-- ============================================================
alter table public.worker_profiles enable row level security;

drop policy if exists "worker_profiles_select_own" on public.worker_profiles;
create policy "worker_profiles_select_own" on public.worker_profiles
  for select using (auth.uid() = profile_id);

drop policy if exists "worker_profiles_insert_own" on public.worker_profiles;
create policy "worker_profiles_insert_own" on public.worker_profiles
  for insert with check (auth.uid() = profile_id);

drop policy if exists "worker_profiles_update_own" on public.worker_profiles;
create policy "worker_profiles_update_own" on public.worker_profiles
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ============================================================
-- company_profiles  (profile_id = auth.uid())
-- Public read so anyone can see company name/logo on a project page.
-- ============================================================
alter table public.company_profiles enable row level security;

drop policy if exists "company_profiles_select_all" on public.company_profiles;
create policy "company_profiles_select_all" on public.company_profiles
  for select using (true);

drop policy if exists "company_profiles_insert_own" on public.company_profiles;
create policy "company_profiles_insert_own" on public.company_profiles
  for insert with check (auth.uid() = profile_id);

drop policy if exists "company_profiles_update_own" on public.company_profiles;
create policy "company_profiles_update_own" on public.company_profiles
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
