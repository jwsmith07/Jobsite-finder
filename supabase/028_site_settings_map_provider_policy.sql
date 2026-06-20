-- Add the map provider setting and make site settings admin policy
-- match the app-side case-insensitive admin role check.

insert into public.site_settings (key, value)
values ('map_provider', '"google"'::jsonb)
on conflict (key) do nothing;

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and lower(profiles.role) = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and lower(profiles.role) = 'admin'
    )
  );
