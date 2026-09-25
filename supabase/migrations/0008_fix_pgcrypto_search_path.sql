-- WEI (BDE) — 0008: correctif — pgcrypto (crypt/gen_salt) est installé dans
-- le schéma `extensions` sur Supabase, pas `public`. Les fonctions
-- SECURITY DEFINER qui l'utilisent doivent inclure ce schéma dans leur
-- search_path, sinon `crypt()` est introuvable (erreur 42883, PostgREST
-- renvoie 404).

create or replace function join_wei(
  p_code text,
  p_first_name text,
  p_last_name text,
  p_team_id uuid default null,
  p_diet_notes text default null
) returns participants
language plpgsql security definer set search_path = public, extensions as $$
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

create or replace function verify_orga_pin(p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
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

create or replace function set_wei_code(p_new_code text) returns void
language plpgsql security definer set search_path = public, extensions as $$
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

create or replace function set_orga_pin(p_new_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
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

create or replace function seed_set_secrets(p_code text, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  update settings
    set wei_code_hash = crypt(p_code, gen_salt('bf')),
        orga_pin_hash = crypt(p_pin, gen_salt('bf'))
    where id = true;
end;
$$;

revoke execute on function seed_set_secrets(text, text) from public, anon, authenticated;
grant execute on function seed_set_secrets(text, text) to service_role;

notify pgrst, 'reload schema';
