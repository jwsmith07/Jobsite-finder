-- Jobsite/project image uploads.
-- Allows admins and approved primary General Contractors to manage
-- project images for projects they are connected to.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jobsite-images',
  'jobsite-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id bigint not null references public.projects(id) on delete cascade,
  company_id bigint references public.company_profiles(id) on delete set null,
  image_url text not null,
  storage_path text,
  alt_text text,
  caption text,
  is_primary boolean not null default false,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_created_idx
on public.project_images(project_id, created_at desc);

create unique index if not exists project_images_one_primary_per_project
on public.project_images(project_id)
where is_primary = true;

create or replace function public.can_manage_project_image(
  p_project_id bigint,
  p_company_id bigint
)
returns boolean
language sql
stable
as $$
  select public.is_admin_profile()
    or exists (
      select 1
      from public.project_claims
      join public.company_profiles
        on company_profiles.id = project_claims.company_profile_id
      where project_claims.project_id = p_project_id
        and project_claims.status = 'approved'
        and project_claims.company_role = 'gc'
        and project_claims.is_primary_gc = true
        and company_profiles.profile_id = auth.uid()
    );
$$;

create or replace function public.guard_project_image_primary()
returns trigger
language plpgsql
as $$
begin
  if new.uploaded_by is null then
    new.uploaded_by = auth.uid();
  end if;

  if new.is_primary then
    update public.project_images
    set is_primary = false
    where project_id = new.project_id
      and id <> new.id
      and is_primary = true;
  end if;

  return new;
end;
$$;

drop trigger if exists project_images_guard_primary on public.project_images;
create trigger project_images_guard_primary
  before insert or update on public.project_images
  for each row execute function public.guard_project_image_primary();

alter table public.project_images enable row level security;

drop policy if exists "project_images_select_public_projects" on public.project_images;
create policy "project_images_select_public_projects" on public.project_images
  for select using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and projects.is_active = true
        and projects.is_public_project = true
    )
    or public.is_admin_profile()
    or public.can_manage_project_image(project_id, company_id)
  );

drop policy if exists "project_images_insert_connected_or_admin" on public.project_images;
create policy "project_images_insert_connected_or_admin" on public.project_images
  for insert with check (
    public.is_admin_profile()
    or (
      uploaded_by = auth.uid()
      and company_id is not null
      and exists (
        select 1
        from public.project_claims
        join public.company_profiles
          on company_profiles.id = project_claims.company_profile_id
        where project_claims.project_id = project_images.project_id
          and project_claims.company_profile_id = project_images.company_id
          and project_claims.status = 'approved'
          and project_claims.company_role = 'gc'
          and project_claims.is_primary_gc = true
          and company_profiles.profile_id = auth.uid()
      )
    )
  );

drop policy if exists "project_images_update_connected_or_admin" on public.project_images;
create policy "project_images_update_connected_or_admin" on public.project_images
  for update using (
    public.is_admin_profile()
    or public.can_manage_project_image(project_id, company_id)
  ) with check (
    public.is_admin_profile()
    or (
      company_id is not null
      and public.can_manage_project_image(project_id, company_id)
    )
  );

drop policy if exists "project_images_delete_connected_or_admin" on public.project_images;
create policy "project_images_delete_connected_or_admin" on public.project_images
  for delete using (
    public.is_admin_profile()
    or public.can_manage_project_image(project_id, company_id)
  );

drop policy if exists "jobsite_images_select_public" on storage.objects;
create policy "jobsite_images_select_public" on storage.objects
  for select using (bucket_id = 'jobsite-images');

drop policy if exists "jobsite_images_insert_connected_or_admin" on storage.objects;
create policy "jobsite_images_insert_connected_or_admin" on storage.objects
  for insert with check (
    bucket_id = 'jobsite-images'
    and (
      public.is_admin_profile()
      or (
        name ~ '^[0-9]+/[0-9]+/'
        and exists (
          select 1
          from public.project_claims
          join public.company_profiles
            on company_profiles.id = project_claims.company_profile_id
          where project_claims.project_id = ((storage.foldername(name))[1])::bigint
            and project_claims.company_profile_id = ((storage.foldername(name))[2])::bigint
            and project_claims.status = 'approved'
            and project_claims.company_role = 'gc'
            and project_claims.is_primary_gc = true
            and company_profiles.profile_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "jobsite_images_update_connected_or_admin" on storage.objects;
create policy "jobsite_images_update_connected_or_admin" on storage.objects
  for update using (
    bucket_id = 'jobsite-images'
    and (
      public.is_admin_profile()
      or (
        name ~ '^[0-9]+/[0-9]+/'
        and exists (
          select 1
          from public.project_claims
          join public.company_profiles
            on company_profiles.id = project_claims.company_profile_id
          where project_claims.project_id = ((storage.foldername(name))[1])::bigint
            and project_claims.status = 'approved'
            and project_claims.company_role = 'gc'
            and project_claims.is_primary_gc = true
            and company_profiles.profile_id = auth.uid()
        )
      )
    )
  ) with check (
    bucket_id = 'jobsite-images'
    and (
      public.is_admin_profile()
      or (
        name ~ '^[0-9]+/[0-9]+/'
        and exists (
          select 1
          from public.project_claims
          join public.company_profiles
            on company_profiles.id = project_claims.company_profile_id
          where project_claims.project_id = ((storage.foldername(name))[1])::bigint
            and project_claims.status = 'approved'
            and project_claims.company_role = 'gc'
            and project_claims.is_primary_gc = true
            and company_profiles.profile_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "jobsite_images_delete_connected_or_admin" on storage.objects;
create policy "jobsite_images_delete_connected_or_admin" on storage.objects
  for delete using (
    bucket_id = 'jobsite-images'
    and (
      public.is_admin_profile()
      or (
        name ~ '^[0-9]+/[0-9]+/'
        and exists (
          select 1
          from public.project_claims
          join public.company_profiles
            on company_profiles.id = project_claims.company_profile_id
          where project_claims.project_id = ((storage.foldername(name))[1])::bigint
            and project_claims.status = 'approved'
            and project_claims.company_role = 'gc'
            and project_claims.is_primary_gc = true
            and company_profiles.profile_id = auth.uid()
        )
      )
    )
  );

notify pgrst, 'reload schema';
