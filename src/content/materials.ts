export type MaterialRarity = 'common' | 'rare' | 'boss';

export type MaterialDefinition = {
  id: string;
  name: string;
  rarity: MaterialRarity;
};

export const materials: readonly MaterialDefinition[] = [
  { id: 'material.moss_gel', name: 'Moss Gel', rarity: 'common' },
  { id: 'material.slime_core', name: 'Slime Core', rarity: 'rare' },
  { id: 'material.moss_crown', name: 'Moss Crown', rarity: 'rare' },
  { id: 'material.boar_hide', name: 'Boar Hide', rarity: 'common' },
  { id: 'material.boar_fang', name: 'Boar Fang', rarity: 'rare' },
  { id: 'material.boar_tusk', name: 'Boar Tusk', rarity: 'rare' },
  // Forest additions
  { id: 'material.spore_powder', name: 'Spore Powder', rarity: 'common' },
  { id: 'material.fungal_cap', name: 'Fungal Cap', rarity: 'rare' },
  { id: 'material.grove_heart', name: 'Grove Heart', rarity: 'boss' },
  { id: 'material.ancient_bark', name: 'Ancient Bark', rarity: 'rare' },
  // Crystal Caverns
  { id: 'material.crystal_shard', name: 'Crystal Shard', rarity: 'common' },
  { id: 'material.bat_wing', name: 'Bat Wing', rarity: 'rare' },
  { id: 'material.stalagmite', name: 'Stalagmite', rarity: 'common' },
  { id: 'material.golem_core', name: 'Golem Core', rarity: 'rare' },
  { id: 'material.spider_silk', name: 'Spider Silk', rarity: 'common' },
  { id: 'material.venom_sac', name: 'Venom Sac', rarity: 'rare' },
  { id: 'material.crystal_core', name: 'Crystal Core', rarity: 'boss' },
  { id: 'material.serpent_scale', name: 'Serpent Scale', rarity: 'rare' },
  // Ashen Wastes
  { id: 'material.ash', name: 'Ash', rarity: 'common' },
  { id: 'material.hound_fang', name: 'Hound Fang', rarity: 'rare' },
  { id: 'material.obsidian', name: 'Obsidian', rarity: 'common' },
  { id: 'material.obsidian_core', name: 'Obsidian Core', rarity: 'rare' },
  { id: 'material.ember', name: 'Ember', rarity: 'common' },
  { id: 'material.wisp_core', name: 'Wisp Core', rarity: 'rare' },
  { id: 'material.ember_core', name: 'Ember Core', rarity: 'boss' },
  { id: 'material.wyvern_scale', name: 'Wyvern Scale', rarity: 'rare' },
];

export function getMaterial(id: string): MaterialDefinition | undefined {
  return materials.find((material) => material.id === id);
}

export function materialName(id: string): string {
  return getMaterial(id)?.name ?? id;
}