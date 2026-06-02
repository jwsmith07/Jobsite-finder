-- Admin profile/company management plus storage buckets for launch QA.
-- Safe to run multiple times after migrations 001-010.

alter table public.company_profiles
  add column if not exists is_hidden boolean not null default false;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_current_user_admin());

drop policy if exists "company_profiles_admin_select_all" on public.company_profiles;
create policy "company_profiles_admin_select_all" on public.company_profiles
  for select using (public.is_current_user_admin());

drop policy if exists "company_profiles_admin_update_all" on public.company_profiles;
create policy "company_profiles_admin_update_all" on public.company_profiles
  for update using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'company-logos',
    'company-logos',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'resumes',
    'resumes',
    true,
    10485760,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company_logos_select_public" on storage.objects;
create policy "company_logos_select_public" on storage.objects
  for select using (bucket_id = 'company-logos');

drop policy if exists "company_logos_insert_own_folder" on storage.objects;
create policy "company_logos_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "company_logos_update_own_folder" on storage.objects;
create policy "company_logos_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "company_logos_delete_own_folder" on storage.objects;
create policy "company_logos_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_select_public" on storage.objects;
create policy "resumes_select_public" on storage.objects
  for select using (bucket_id = 'resumes');

drop policy if exists "resumes_insert_own_folder" on storage.objects;
create policy "resumes_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_update_own_folder" on storage.objects;
create policy "resumes_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_delete_own_folder" on storage.objects;
create policy "resumes_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

notify pgrst, 'reload schema';
