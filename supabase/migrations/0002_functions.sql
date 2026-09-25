-- WEI (BDE) — 0002: fonctions utilitaires + RPC
-- Toutes les fonctions SECURITY DEFINER fixent search_path pour éviter le hijacking.

-- ============================================================
-- Helpers (utilisés par les policies RLS)
-- ============================================================

create or replace function is_organizer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organizers where user_id = auth.uid());
$$;

create or replace function my_participant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from participants where user_id = auth.uid();
$$;

-- ============================================================
-- Inscription : vérifie le code du WEI côté serveur, crée le participant.
-- ============================================================

create or replace function join_wei(
  p_code text,
  p_first_name text,
  p_last_name text,
  p_team_id uuid default null,
  p_diet_notes text default null
) returns participants
language plpgsql security definer set search_path = public as $$
declare
  v_hash text;
  v_participant participants;
begin
  if auth.uid() is null then
    raise exception 'Aucune session active.' using errcode = '28000';
  end if;

  if exists (select 1 from participants where user_id = auth.uid()) then
    raise exception 'Ce participant est déjà inscrit.' using errcode = '23505';
  end if;

  select wei_code_hash into v_hash from settings where id = true;

  if v_hash is null then
    raise exception 'Le code du WEI n''est pas configuré.' using errcode = 'P0001';
  end if;

  if crypt(coalesce(p_code, ''), v_hash) <> v_hash then
    raise exception 'Code du WEI invalide.' using errcode = '28P01';
  end if;

  insert into participants (user_id, first_name, last_name, team_id, diet_notes)
  values (auth.uid(), trim(p_first_name), trim(p_last_name), p_team_id, nullif(trim(p_diet_notes), ''))
  returning * into v_participant;

  return v_participant;
end;
$$;

grant execute on function join_wei(text, text, text, uuid, text) to anon, authenticated;

-- ============================================================
-- PIN orga : vérification côté serveur avec anti-bruteforce.
-- ============================================================

create or replace function verify_orga_pin(p_pin text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_hash text;
  v_attempts orga_pin_attempts;
  v_max_attempts constant integer := 5;
  v_lock_minutes constant integer := 15;
begin
  if auth.uid() is null then
    raise exception 'Aucune session active.' using errcode = '28000';
  end if;

  if is_organizer() then
    return true;
  end if;

  select * into v_attempts from orga_pin_attempts where user_id = auth.uid();

  if v_attempts.locked_until is not null and v_attempts.locked_until > now() then
    raise exception 'Trop de tentatives, réessaie dans quelques minutes.' using errcode = '28000';
  end if;

  select orga_pin_hash into v_hash from settings where id = true;

  if v_hash is not null and crypt(coalesce(p_pin, ''), v_hash) = v_hash then
    insert into organizers (user_id) values (auth.uid()) on conflict do nothing;
    delete from orga_pin_attempts where user_id = auth.uid();
    return true;
  end if;

  insert into orga_pin_attempts (user_id, attempts)
  values (auth.uid(), 1)
  on conflict (user_id) do update
    set attempts = case
        when orga_pin_attempts.locked_until is not null and orga_pin_attempts.locked_until <= now()
          then 1
        else orga_pin_attempts.attempts + 1
      end,
      locked_until = case
        when (case
            when orga_pin_attempts.locked_until is not null and orga_pin_attempts.locked_until <= now()
              then 1
            else orga_pin_attempts.attempts + 1
          end) >= v_max_attempts
          then now() + make_interval(mins => v_lock_minutes)
        else null
      end;

  return false;
end;
$$;

grant execute on function verify_orga_pin(text) to authenticated;

-- ============================================================
-- Réglages sensibles (orga uniquement).
-- ============================================================

create or replace function set_wei_code(p_new_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;
  if coalesce(trim(p_new_code), '') = '' then
    raise exception 'Le code ne peut pas être vide.';
  end if;
  update settings set wei_code_hash = crypt(p_new_code, gen_salt('bf')) where id = true;
end;
$$;

grant execute on function set_wei_code(text) to authenticated;

create or replace function set_orga_pin(p_new_pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;
  if coalesce(trim(p_new_pin), '') = '' then
    raise exception 'Le PIN ne peut pas être vide.';
  end if;
  update settings set orga_pin_hash = crypt(p_new_pin, gen_salt('bf')) where id = true;
end;
$$;

grant execute on function set_orga_pin(text) to authenticated;

-- ============================================================
-- Fusion de doublons participants (orga uniquement).
-- ============================================================

create or replace function merge_participants(p_keep_id uuid, p_remove_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;
  if p_keep_id = p_remove_id then
    raise exception 'Impossible de fusionner un participant avec lui-même.';
  end if;

  update point_events set participant_id = p_keep_id where participant_id = p_remove_id;
  update photo_submissions set participant_id = p_keep_id where participant_id = p_remove_id;
  delete from participants where id = p_remove_id;
end;
$$;

grant execute on function merge_participants(uuid, uuid) to authenticated;

-- ============================================================
-- Suppression de toutes les photos (post-WEI, orga uniquement).
-- Nettoie les colonnes photo_path ; la suppression des fichiers dans
-- Storage se fait côté client via l'API Storage (policies orga, cf. 0005).
-- ============================================================

create or replace function delete_all_photos() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;
  update participants set photo_path = null where photo_path is not null;
end;
$$;

grant execute on function delete_all_photos() to authenticated;

-- ============================================================
-- Décalage rapide d'une activité (bouton "+15 min").
-- ============================================================

create or replace function shift_activity(p_activity_id uuid, p_minutes integer) returns activities
language plpgsql security definer set search_path = public as $$
declare
  v_activity activities;
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;

  update activities
    set starts_at = starts_at + make_interval(mins => p_minutes),
        ends_at = ends_at + make_interval(mins => p_minutes)
    where id = p_activity_id
    returning * into v_activity;

  return v_activity;
end;
$$;

grant execute on function shift_activity(uuid, integer) to authenticated;

-- ============================================================
-- Validation / refus d'un défi photo (orga uniquement) — crée le point_events.
-- ============================================================

create or replace function review_photo_submission(p_submission_id uuid, p_approve boolean) returns photo_submissions
language plpgsql security definer set search_path = public as $$
declare
  v_submission photo_submissions;
  v_points integer;
  v_title text;
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;

  update photo_submissions
    set status = case when p_approve then 'validee' else 'refusee' end,
        reviewed_by = auth.uid()
    where id = p_submission_id and status = 'en_attente'
    returning * into v_submission;

  if v_submission.id is null then
    raise exception 'Ce défi a déjà été traité.';
  end if;

  if p_approve then
    select points, title into v_points, v_title
    from photo_challenges where id = v_submission.challenge_id;

    insert into point_events (participant_id, amount, reason, given_by)
    values (v_submission.participant_id, coalesce(v_points, 0), 'Défi photo : ' || coalesce(v_title, ''), auth.uid());
  end if;

  return v_submission;
end;
$$;

grant execute on function review_photo_submission(uuid, boolean) to authenticated;

-- ============================================================
-- Annulation d'un point_event (orga uniquement, ne supprime pas la ligne).
-- ============================================================

create or replace function cancel_point_event(p_id uuid) returns point_events
language plpgsql security definer set search_path = public as $$
declare
  v_event point_events;
begin
  if not is_organizer() then
    raise exception 'Réservé aux orgas.' using errcode = '42501';
  end if;

  update point_events set cancelled = true where id = p_id
  returning * into v_event;

  return v_event;
end;
$$;

grant execute on function cancel_point_event(uuid) to authenticated;
