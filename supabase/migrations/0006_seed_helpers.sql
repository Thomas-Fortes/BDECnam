-- WEI (BDE) — 0006: fonction réservée au script de seed (rôle service_role).
--
-- set_wei_code()/set_orga_pin() exigent d'être orga (auth.uid() dans organizers),
-- ce qui n'a pas de sens pour un script de seed exécuté côté serveur sans
-- session utilisateur. Cette fonction fait la même chose (hash + stockage)
-- mais n'est exécutable QUE par service_role (jamais anon/authenticated).

create or replace function seed_set_secrets(p_code text, p_pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update settings
    set wei_code_hash = crypt(p_code, gen_salt('bf')),
        orga_pin_hash = crypt(p_pin, gen_salt('bf'))
    where id = true;
end;
$$;

revoke execute on function seed_set_secrets(text, text) from public, anon, authenticated;
grant execute on function seed_set_secrets(text, text) to service_role;
