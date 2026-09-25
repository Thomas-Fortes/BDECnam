-- WEI (BDE) — 0003: vues de lecture publique
--
-- Ces vues sont créées par le rôle propriétaire des migrations (postgres),
-- qui bénéficie de BYPASSRLS sur un projet Supabase standard : elles peuvent
-- donc lire les tables de base même quand la RLS restreint l'accès direct
-- (ex. `participants`), tant qu'elles n'exposent QUE des colonnes non
-- sensibles. Ne jamais ajouter `diet_notes`, `wei_code_hash` ou
-- `orga_pin_hash` à une vue de ce fichier.

-- ============================================================
-- Trombinoscope public (sans diet_notes).
-- ============================================================

create view participants_public as
select id, first_name, last_name, team_id, photo_path, created_at
from participants;

grant select on participants_public to anon, authenticated;

-- ============================================================
-- Réglages publics (sans les hash).
-- ============================================================

create view settings_public as
select
  event_name, start_date, end_date, address, address_url, transport_info,
  checklist, contacts, safety_contacts, site_map_path, team_points_include_members,
  updated_at
from settings
where id = true;

grant select on settings_public to anon, authenticated;

-- ============================================================
-- Total de points d'une équipe = points donnés directement à l'équipe
-- + (si settings.team_points_include_members) somme des points de ses membres.
-- Isolé dans une fonction pour rester facilement modifiable.
-- ============================================================

create or replace function team_total_points(p_team_id uuid) returns integer
language sql stable as $$
  select
    coalesce((
      select sum(amount) from point_events
      where team_id = p_team_id and participant_id is null and cancelled = false
    ), 0)
    + case
        when (select team_points_include_members from settings where id = true)
        then coalesce((
          select sum(pe.amount)
          from point_events pe
          join participants p on p.id = pe.participant_id
          where p.team_id = p_team_id and pe.cancelled = false
        ), 0)
        else 0
      end;
$$;

-- ============================================================
-- Classement équipes.
-- ============================================================

create view leaderboard_teams as
select
  t.id as team_id,
  t.name,
  t.color,
  team_total_points(t.id) as points
from teams t
order by points desc, t.name asc;

grant select on leaderboard_teams to anon, authenticated;

-- ============================================================
-- Classement individuel.
-- ============================================================

create view leaderboard_individual as
select
  p.id as participant_id,
  p.first_name,
  p.last_name,
  p.team_id,
  t.name as team_name,
  t.color as team_color,
  p.photo_path,
  coalesce(sum(pe.amount) filter (where pe.cancelled = false), 0)::integer as points
from participants_public p
left join teams t on t.id = p.team_id
left join point_events pe on pe.participant_id = p.id
group by p.id, p.first_name, p.last_name, p.team_id, t.name, t.color, p.photo_path
order by points desc, p.first_name asc;

grant select on leaderboard_individual to anon, authenticated;
