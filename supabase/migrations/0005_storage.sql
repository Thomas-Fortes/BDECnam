-- WEI (BDE) — 0005: Storage (avatars, défis photo, assets de réglages)
--
-- Buckets publics en lecture (les photos sont visibles par les participants
-- du WEI, mais pas indexées ailleurs) ; écriture strictement contrôlée par
-- policies sur storage.objects.
--
-- Convention de nommage des objets :
--   avatars/{participant_id}.{ext}           (racine du bucket "avatars")
--   challenges/{participant_id}/{challenge_id}.{ext}  (bucket "challenges")
--   settings/site-map.{ext}, settings/logo.{ext}      (bucket "settings")

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', true, 2 * 1024 * 1024),
  ('challenges', 'challenges', true, 3 * 1024 * 1024),
  ('settings', 'settings', true, 5 * 1024 * 1024)
on conflict (id) do nothing;

-- ============================================================
-- avatars
-- ============================================================

create policy avatars_select_all on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_write_own on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = my_participant_id()::text
  );

create policy avatars_update_own_or_orga on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = my_participant_id()::text or is_organizer())
  )
  with check (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = my_participant_id()::text or is_organizer())
  );

create policy avatars_delete_own_or_orga on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (split_part(name, '.', 1) = my_participant_id()::text or is_organizer())
  );

-- ============================================================
-- challenges (défis photo) : dossier = participant_id
-- ============================================================

create policy challenges_select_all on storage.objects for select
  using (bucket_id = 'challenges');

create policy challenges_write_own on storage.objects for insert
  with check (
    bucket_id = 'challenges'
    and (storage.foldername(name))[1] = my_participant_id()::text
  );

create policy challenges_delete_own_or_orga on storage.objects for delete
  using (
    bucket_id = 'challenges'
    and ((storage.foldername(name))[1] = my_participant_id()::text or is_organizer())
  );

-- ============================================================
-- settings (carte du site, logo…) : orgas uniquement en écriture.
-- ============================================================

create policy settings_bucket_select_all on storage.objects for select
  using (bucket_id = 'settings');

create policy settings_bucket_write_orga on storage.objects for all
  using (bucket_id = 'settings' and is_organizer())
  with check (bucket_id = 'settings' and is_organizer());
