-- WEI (BDE) — 0007: durcissement suite aux advisors Supabase
-- (search_path mutable, policies RLS ré-évaluées par ligne, policies
-- permissives redondantes, index FK manquants).

-- ============================================================
-- search_path pinné sur toutes les fonctions (évite le hijacking).
-- team_total_points passe en SECURITY DEFINER pour lire `settings` de façon
-- fiable quel que soit l'appelant (comportement déjà correct si la fonction
-- était inlinée dans la vue, mais on le garantit explicitement).
-- ============================================================

create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function team_total_points(p_team_id uuid) returns integer
language sql stable security definer set search_path = public as $$
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
-- Index manquants sur les clés étrangères les plus consultées.
-- ============================================================

create index if not exists announcements_created_by_idx on announcements (created_by);
create index if not exists photo_submissions_reviewed_by_idx on photo_submissions (reviewed_by);
create index if not exists point_events_activity_id_idx on point_events (activity_id);
create index if not exists point_events_given_by_idx on point_events (given_by);

-- ============================================================
-- auth.uid() évalué une fois par requête plutôt que par ligne.
-- ============================================================

alter policy participants_select_self_or_orga on participants
  using ((select auth.uid()) = user_id or is_organizer());

alter policy participants_update_self_or_orga on participants
  using ((select auth.uid()) = user_id or is_organizer())
  with check ((select auth.uid()) = user_id or is_organizer());

alter policy organizers_select_self_or_orga on organizers
  using ((select auth.uid()) = user_id or is_organizer());

alter policy point_events_insert_orga on point_events
  with check (is_organizer() and given_by = (select auth.uid()));

alter policy announcements_insert_orga on announcements
  with check (is_organizer() and created_by = (select auth.uid()));

-- ============================================================
-- Policies "for all" redondantes avec la policy SELECT publique existante :
-- remplacées par des policies explicites insert/update/delete.
-- ============================================================

drop policy teams_write_orga on teams;
create policy teams_insert_orga on teams for insert with check (is_organizer());
create policy teams_update_orga on teams for update using (is_organizer()) with check (is_organizer());
create policy teams_delete_orga on teams for delete using (is_organizer());

drop policy activities_write_orga on activities;
create policy activities_insert_orga on activities for insert with check (is_organizer());
create policy activities_update_orga on activities for update using (is_organizer()) with check (is_organizer());
create policy activities_delete_orga on activities for delete using (is_organizer());

drop policy photo_challenges_write_orga on photo_challenges;
create policy photo_challenges_insert_orga on photo_challenges for insert with check (is_organizer());
create policy photo_challenges_update_orga on photo_challenges for update using (is_organizer()) with check (is_organizer());
create policy photo_challenges_delete_orga on photo_challenges for delete using (is_organizer());

-- ============================================================
-- photo_submissions : fusion des 2 policies UPDATE en une seule.
-- ============================================================

drop policy photo_submissions_update_own on photo_submissions;
drop policy photo_submissions_update_orga on photo_submissions;

create policy photo_submissions_update on photo_submissions for update
  using (participant_id = my_participant_id() or is_organizer())
  with check (
    (participant_id = my_participant_id() and status = 'en_attente' and reviewed_by is null)
    or is_organizer()
  );
