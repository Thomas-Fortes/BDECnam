export type ActivityType = "activite" | "repas" | "transport" | "soiree" | "autre";
export type PhotoSubmissionStatus = "en_attente" | "validee" | "refusee";

export interface Team {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
  photo_path: string | null;
  diet_notes: string | null;
  created_at: string;
}

export interface ParticipantPublic {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  location_url: string | null;
  starts_at: string;
  ends_at: string;
  type: ActivityType;
  points_info: string | null;
  menu: string | null;
  created_at: string;
}

export interface PointEvent {
  id: string;
  participant_id: string | null;
  team_id: string | null;
  amount: number;
  reason: string;
  activity_id: string | null;
  given_by: string;
  cancelled: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  created_by: string;
  created_at: string;
  pinned: boolean;
}

export interface PhotoChallenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  active: boolean;
  created_at: string;
}

export interface PhotoSubmission {
  id: string;
  challenge_id: string;
  participant_id: string;
  photo_path: string;
  status: PhotoSubmissionStatus;
  reviewed_by: string | null;
  created_at: string;
}

export interface ContactInfo {
  first_name: string;
  role: string;
  phone: string;
}

export interface SafetyContact {
  first_name: string;
  phone: string;
}

export interface SettingsPublic {
  event_name: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  address_url: string | null;
  transport_info: string | null;
  checklist: string[];
  contacts: ContactInfo[];
  safety_contacts: SafetyContact[];
  site_map_path: string | null;
  team_points_include_members: boolean;
  updated_at: string;
}

export interface LeaderboardIndividualRow {
  participant_id: string;
  first_name: string;
  last_name: string;
  team_id: string | null;
  team_name: string | null;
  team_color: string | null;
  photo_path: string | null;
  points: number;
}

export interface LeaderboardTeamRow {
  team_id: string;
  name: string;
  color: string;
  points: number;
}
