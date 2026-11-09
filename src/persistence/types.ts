export type PlayerProfile = {
  hunter_level: number;
  total_xp: number;
  unspent_skill_points: number;
  created_at: string;
  updated_at: string;
};

export type InventoryEntry = {
  material_id: string;
  quantity: number;
};

export type GameSave = {
  profile: PlayerProfile;
  settings: Record<string, string>;
  inventory: InventoryEntry[];
};

export type FinalizeHuntInput = {
  hunt_id: string;
  map_id: string;
  monster_id: string;
  outcome: 'victory' | 'defeat' | 'abandoned';
  duration_ms: number;
  correct_keystrokes: number;
  incorrect_keystrokes: number;
  words_completed: number;
  xp_awarded: number;
  loot: { material_id: string; quantity: number }[];
  broken_part_ids: string[];
};

export type FinalizedHunt = {
  hunt_id: string;
  outcome: string;
  xp_awarded: number;
  loot: { material_id: string; quantity: number }[];
  broken_part_ids: string[];
  total_xp: number;
  completed_at: string;
};