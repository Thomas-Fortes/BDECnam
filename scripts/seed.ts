/**
 * Seed de démo pour l'appli WEI : à lancer avec `npm run seed`.
 * Nécessite NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * (jamais commiter la service role key). Idempotent-friendly : nettoie les
 * données précédemment seedées (marquées via user_metadata.seed = true)
 * avant de recréer.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_WEI_CODE = process.env.SEED_WEI_CODE ?? "WEI2026";
const SEED_ORGA_PIN = process.env.SEED_ORGA_PIN ?? "1234";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (voir .env.local.example)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FIRST_NAMES = [
  "Léa", "Hugo", "Chloé", "Nathan", "Manon", "Lucas", "Camille", "Enzo", "Sarah", "Louis",
  "Emma", "Gabriel", "Jade", "Raphaël", "Inès", "Adam", "Zoé", "Nolan", "Lina", "Tom",
  "Anna", "Noah", "Louise", "Ethan", "Alice", "Mathis", "Rose", "Liam", "Julia", "Sacha",
];
const LAST_NAMES = [
  "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau",
  "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fontaine",
  "Chevalier", "François", "Legrand", "Gauthier", "Perrin", "Morel", "Girard", "André", "Mercier", "Blanc",
];

const TEAMS = [
  { name: "Les Flamants Roses", color: "#EC4899" },
  { name: "Les Loups Gris", color: "#64748B" },
  { name: "Les Tigres Dorés", color: "#F59E0B" },
  { name: "Les Requins Bleus", color: "#3B82F6" },
];

const START_DATE = "2026-10-02";
const END_DATE = "2026-10-04";

function iso(date: string, time: string) {
  return new Date(`${date}T${time}:00+02:00`).toISOString();
}

async function resetPreviousSeed() {
  console.log("Nettoyage des données précédemment seedées…");
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const seedUsers = (users?.users ?? []).filter((u) => u.user_metadata?.seed === true);
  for (const u of seedUsers) {
    await supabase.auth.admin.deleteUser(u.id);
  }
  await supabase.from("point_events").delete().not("id", "is", null);
  await supabase.from("announcements").delete().not("id", "is", null);
  await supabase.from("photo_submissions").delete().not("id", "is", null);
  await supabase.from("photo_challenges").delete().not("id", "is", null);
  await supabase.from("activities").delete().not("id", "is", null);
  await supabase.from("teams").delete().not("id", "is", null);
}

async function seedSettings() {
  console.log("Réglages…");
  const { error } = await supabase
    .from("settings")
    .update({
      event_name: "WEI 2026 – Le Bureau Des Élèves",
      start_date: START_DATE,
      end_date: END_DATE,
      address: "Camping de la Forêt Bleue, 45 Route des Pins, 24450 La Coquille",
      address_url: "https://www.google.com/maps/search/?api=1&query=Camping+de+la+Foret+Bleue+La+Coquille",
      transport_info:
        "Départ en bus vendredi à 17h30, parking du Campus Nord (12 rue des Étudiants). Retour dimanche vers 16h, même point de dépôt.",
      checklist: [
        "Sac de couchage",
        "Matelas / tapis de sol",
        "Vêtements de pluie",
        "Chaussures fermées",
        "Gourde",
        "Trousse à pharmacie perso",
        "Déguisement pour la soirée à thème",
        "Batterie externe",
        "Carte d'identité / carte vitale",
      ],
      contacts: [
        { first_name: "Camille", role: "Présidente BDE", phone: "0600000001" },
        { first_name: "Yanis", role: "Logistique", phone: "0600000002" },
      ],
      safety_contacts: [
        { first_name: "Sofia", phone: "0600000003" },
        { first_name: "Malo", phone: "0600000004" },
      ],
      team_points_include_members: true,
    })
    .eq("id", true);
  if (error) throw error;

  const { error: secretsError } = await supabase.rpc("seed_set_secrets", {
    p_code: SEED_WEI_CODE,
    p_pin: SEED_ORGA_PIN,
  });
  if (secretsError) throw secretsError;
}

async function seedTeams() {
  console.log("Équipes…");
  const { data, error } = await supabase.from("teams").insert(TEAMS).select();
  if (error) throw error;
  return data!;
}

async function seedParticipants(teams: { id: string }[]) {
  console.log("Participants…");
  const allergies = [
    "Allergie aux fruits à coque",
    "Végétarien·ne",
    "Sans gluten",
    "Allergie aux crustacés",
    "Végétalien·ne",
  ];

  const participants: { id: string; user_id: string; first_name: string; team_id: string | null }[] = [];

  for (let i = 0; i < FIRST_NAMES.length; i++) {
    const email = `seed-participant-${i}@wei.local`;
    const { data: created, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { seed: true },
    });
    if (userError) throw userError;

    const teamId = i >= FIRST_NAMES.length - 2 ? null : teams[i % teams.length].id;

    const { data: participant, error } = await supabase
      .from("participants")
      .insert({
        user_id: created.user.id,
        first_name: FIRST_NAMES[i],
        last_name: LAST_NAMES[i],
        team_id: teamId,
        diet_notes: i % 6 === 0 ? allergies[i % allergies.length] : null,
      })
      .select()
      .single();
    if (error) throw error;

    participants.push({
      id: participant.id,
      user_id: created.user.id,
      first_name: participant.first_name,
      team_id: teamId,
    });
  }

  return participants;
}

async function seedOrganizers(participantUserIds: string[]) {
  console.log("Organisateurs de démo…");
  const { error } = await supabase
    .from("organizers")
    .insert(participantUserIds.map((user_id) => ({ user_id })));
  if (error) throw error;
}

async function seedActivities() {
  console.log("Programme…");
  const rows = [
    {
      title: "Départ en bus",
      type: "transport",
      location_name: "Parking Campus Nord",
      starts_at: iso(START_DATE, "17:30"),
      ends_at: iso(START_DATE, "18:30"),
    },
    {
      title: "Installation & mot de bienvenue",
      type: "autre",
      location_name: "Camping — grande prairie",
      starts_at: iso(START_DATE, "19:00"),
      ends_at: iso(START_DATE, "19:30"),
    },
    {
      title: "Dîner d'arrivée",
      type: "repas",
      location_name: "Réfectoire",
      menu: "Chili sin carne, riz, salade, tarte aux pommes",
      starts_at: iso(START_DATE, "19:30"),
      ends_at: iso(START_DATE, "21:00"),
    },
    {
      title: "Soirée d'intégration",
      type: "soiree",
      location_name: "Grande prairie",
      starts_at: iso(START_DATE, "21:30"),
      ends_at: iso(START_DATE, "23:59"),
    },
    {
      title: "Petit-déjeuner",
      type: "repas",
      location_name: "Réfectoire",
      menu: "Viennoiseries, céréales, fruits",
      starts_at: iso("2026-10-03", "08:00"),
      ends_at: iso("2026-10-03", "09:00"),
    },
    {
      title: "Grand jeu en équipes",
      type: "activite",
      location_name: "Forêt du camping",
      points_info: "Jusqu'à 50 points à gagner par équipe",
      description: "Un grand jeu de piste par équipes à travers le camping et la forêt voisine.",
      starts_at: iso("2026-10-03", "09:30"),
      ends_at: iso("2026-10-03", "12:30"),
    },
    {
      title: "Déjeuner",
      type: "repas",
      location_name: "Réfectoire",
      menu: "Buffet froid, pâtes, fruits",
      starts_at: iso("2026-10-03", "12:30"),
      ends_at: iso("2026-10-03", "14:00"),
    },
    {
      title: "Olympiades sportives",
      type: "activite",
      location_name: "Terrain de sport",
      points_info: "+30 points pour l'équipe gagnante de chaque épreuve",
      starts_at: iso("2026-10-03", "14:30"),
      ends_at: iso("2026-10-03", "17:30"),
    },
    {
      title: "Temps libre / douches",
      type: "autre",
      location_name: "Sanitaires",
      starts_at: iso("2026-10-03", "18:00"),
      ends_at: iso("2026-10-03", "19:00"),
    },
    {
      title: "Dîner à thème",
      type: "repas",
      location_name: "Réfectoire",
      menu: "Barbecue végé & merguez",
      starts_at: iso("2026-10-03", "19:30"),
      ends_at: iso("2026-10-03", "21:00"),
    },
    {
      title: "Soirée déguisée",
      type: "soiree",
      location_name: "Grande prairie",
      points_info: "+15 points pour le meilleur déguisement d'équipe",
      starts_at: iso("2026-10-03", "21:30"),
      ends_at: iso("2026-10-03", "23:59"),
    },
    {
      title: "Petit-déjeuner",
      type: "repas",
      location_name: "Réfectoire",
      starts_at: iso(END_DATE, "08:30"),
      ends_at: iso(END_DATE, "09:30"),
    },
    {
      title: "Chasse au trésor finale",
      type: "activite",
      location_name: "Camping — parcours complet",
      points_info: "+40 points pour l'équipe gagnante",
      starts_at: iso(END_DATE, "10:00"),
      ends_at: iso(END_DATE, "12:00"),
    },
    {
      title: "Rangement & nettoyage du site",
      type: "autre",
      location_name: "Tout le camping",
      starts_at: iso(END_DATE, "12:00"),
      ends_at: iso(END_DATE, "13:00"),
    },
    {
      title: "Déjeuner de clôture",
      type: "repas",
      location_name: "Réfectoire",
      menu: "Buffet de clôture",
      starts_at: iso(END_DATE, "13:00"),
      ends_at: iso(END_DATE, "14:00"),
    },
    {
      title: "Annonce du classement final",
      type: "autre",
      location_name: "Grande prairie",
      starts_at: iso(END_DATE, "14:30"),
      ends_at: iso(END_DATE, "15:00"),
    },
    {
      title: "Retour en bus",
      type: "transport",
      location_name: "Camping → Campus Nord",
      starts_at: iso(END_DATE, "15:00"),
      ends_at: iso(END_DATE, "16:00"),
    },
  ];

  const { data, error } = await supabase.from("activities").insert(rows).select();
  if (error) throw error;
  return data!;
}

async function seedPointsAndAnnouncements(
  participants: { id: string; team_id: string | null }[],
  teams: { id: string }[],
  activities: { id: string; title: string }[],
  givenBy: string
) {
  console.log("Points & annonces de démo…");

  const jeuActivity = activities.find((a) => a.title === "Grand jeu en équipes");
  const olympiades = activities.find((a) => a.title === "Olympiades sportives");

  const events = [
    { team_id: teams[0].id, amount: 50, reason: "Vainqueur du grand jeu en équipes", activity_id: jeuActivity?.id },
    { team_id: teams[2].id, amount: 30, reason: "2e place du grand jeu en équipes", activity_id: jeuActivity?.id },
    { participant_id: participants[3].id, amount: 10, reason: "Meilleur temps course en sac", activity_id: olympiades?.id },
    { participant_id: participants[7].id, amount: 10, reason: "Tir à la corde", activity_id: olympiades?.id },
    { participant_id: participants[12].id, amount: 5, reason: "Bonne humeur constante" },
    { participant_id: participants[15].id, amount: -5, reason: "Retard au rassemblement" },
    { participant_id: participants[1].id, amount: 20, reason: "Meilleur déguisement", cancelled: false },
  ];

  const { error } = await supabase
    .from("point_events")
    .insert(events.map((e) => ({ ...e, given_by: givenBy })));
  if (error) throw error;

  const { error: annError } = await supabase.from("announcements").insert([
    {
      message: "Bienvenue à toutes et tous, le WEI commence bientôt ! Pensez à vos affaires 🎒",
      pinned: true,
      created_by: givenBy,
    },
    {
      message: "Le bus part à l'heure pile vendredi, merci d'être au parking 15 min avant !",
      pinned: false,
      created_by: givenBy,
    },
  ]);
  if (annError) throw annError;

  const { error: challengeError } = await supabase.from("photo_challenges").insert([
    { title: "Le plus beau selfie de groupe", description: "Toute l'équipe sur une seule photo !", points: 10, active: true },
    { title: "Le déguisement le plus fou", description: "Pendant la soirée déguisée", points: 15, active: true },
  ]);
  if (challengeError) throw challengeError;
}

async function main() {
  await resetPreviousSeed();
  await seedSettings();
  const teams = await seedTeams();
  const participants = await seedParticipants(teams);
  await seedOrganizers(participants.slice(0, 2).map((p) => p.user_id));
  const activities = await seedActivities();

  await seedPointsAndAnnouncements(participants, teams, activities, participants[0].user_id);

  console.log("\nSeed terminé !");
  console.log(`Code du WEI : ${SEED_WEI_CODE}`);
  console.log(`PIN orga : ${SEED_ORGA_PIN}`);
  console.log(`${participants.length} participants créés, dont 2 déjà orga (${FIRST_NAMES[0]}, ${FIRST_NAMES[1]}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
