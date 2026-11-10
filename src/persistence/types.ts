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
  skill_ranks: Record<string, number>;
  owned_equipment: string[];
  equipment_loadout: Record<string, string>;
};

export type CraftEquipmentInput = {
  equipment_id: string;
  requirements: { material_id: string; quantity: number }[];
};

export type CraftedEquipmentResult = {
  inventory: InventoryEntry[];
  owned_equipment: string[];
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
  hunter_level: number;
  unspent_skill_points: number;
  loot: { material_id: string; quantity: number }[];
  broken_part_ids: string[];
};

export type FinalizedHunt = {
  hunt_id: string;
  outcome: string;
  xp_awarded: number;
  hunter_level: number;
  total_xp: number;
  unspent_skill_points: number;
  loot: { material_id: string; quantity: number }[];
  broken_part_ids: string[];
  completed_at: string;
};