export type PlayerProfile = {
  hunter_level: number;
  total_xp: number;
  unspent_skill_points: number;
  created_at: string;
  updated_at: string;
};

export type GameSave = {
  profile: PlayerProfile;
  settings: Record<string, string>;
};