-- WEI (BDE) — 0004: Row Level Security
-- Principe : lecture publique large (participants du WEI, y compris anonymes),
-- écriture réservée aux orgas sauf pour sa propre ligne participant.

alter table teams enable row level security;
alter table participants enable row level security;
alter table organizers enable row level security;
alter table orga_pin_attempts enable row level security;
alter table activities enable row level security;
alter table point_events enable row level security;
alter table announcements enable row level security;
alter table photo_challenges enable row level security;
alter table photo_submissions enable row level security;
alter table settings enable row level security;

-- ============================================================
-- teams
-- ============================================================

create policy teams_select_all on teams for select using (true);
create policy teams_write_orga on teams for all
  using (is_organizer()) with check (is_organizer());

-- ============================================================
-- participants (table de base : ligne complète, y compris diet_notes)
-- Le trombinoscope public passe par la vue participants_public (0003).
-- ============================================================

create policy participants_select_self_or_orga on participants for select
  using (auth.uid() = user_id or is_organizer());

-- Pas de policy INSERT : la création passe uniquement par join_wei()
-- (SECURITY DEFINER), qui vérifie le code du WEI côté serveur.

create policy participants_update_self_or_orga on participants for update
  using (auth.uid() = user_id or is_organizer())
  with check (auth.uid() = user_id or is_organizer());

create policy participants_delete_orga on participants for delete
  using (is_organizer());

-- ============================================================
-- organizers
-- ============================================================

create policy organizers_select_self_or_orga on organizers for select
  using (auth.uid() = user_id or is_organizer());

-- Pas de policy INSERT/UPDATE/DELETE : uniquement via verify_orga_pin()
-- (SECURITY DEFINER), qui vérifie le PIN côté serveur avec anti-bruteforce.

-- ============================================================
-- orga_pin_attempts : aucun accès client direct (uniquement via RPC).
-- ============================================================

-- ============================================================
-- activities
-- ============================================================

create policy activities_select_all on activities for select using (true);
create policy activities_write_orga on activities for all
  using (is_organizer()) with check (is_organizer());

-- ============================================================
-- point_events (lecture publique : fil des points + historique) ;
-- écriture réservée aux orgas, jamais de suppression (cf. cancel_point_event).
-- ============================================================

create policy point_events_select_all on point_events for select using (true);

create policy point_events_insert_orga on point_events for insert
  with check (is_organizer() and given_by = auth.uid());

create policy point_events_update_orga on point_events for update
  using (is_organizer()) with check (is_organizer());

-- ============================================================
-- announcements
-- ============================================================

create policy announcements_select_all on announcements for select using (true);

create policy announcements_insert_orga on announcements for insert
  with check (is_organizer() and created_by = auth.uid());

create policy announcements_update_orga on announcements for update
  using (is_organizer()) with check (is_organizer());

create policy announcements_delete_orga on announcements for delete
  using (is_organizer());

-- ============================================================
-- photo_challenges
-- ============================================================

create policy photo_challenges_select_all on photo_challenges for select using (true);
create policy photo_challenges_write_orga on photo_challenges for all
  using (is_organizer()) with check (is_organizer());

-- ============================================================
-- photo_submissions
-- ============================================================

create policy photo_submissions_select_own_or_orga on photo_submissions for select
  using (participant_id = my_participant_id() or is_organizer());

create policy photo_submissions_insert_own on photo_submissions for insert
  with check (participant_id = my_participant_id());

-- Un participant peut ré-envoyer sa photo (ex. après un refus), mais ne peut
-- remettre sa ligne qu'à l'état "en_attente" (jamais se auto-valider) : la
-- validation (passage à validee/refusee + point_events) passe uniquement par
-- review_photo_submission() côté orga.
create policy photo_submissions_update_own on photo_submissions for update
  using (participant_id = my_participant_id())
  with check (participant_id = my_participant_id() and status = 'en_attente' and reviewed_by is null);

create policy photo_submissions_update_orga on photo_submissions for update
  using (is_organizer()) with check (is_organizer());

-- ============================================================
-- settings (table de base, avec les hash) : orgas uniquement.
-- Le reste de l'app lit la vue settings_public (0003).
-- ============================================================

create policy settings_select_orga on settings for select using (is_organizer());
create policy settings_update_orga on settings for update
  using (is_organizer()) with check (is_organizer());
