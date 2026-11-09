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
];

export function getMaterial(id: string): MaterialDefinition | undefined {
  return materials.find((material) => material.id === id);
}

export function materialName(id: string): string {
  return getMaterial(id)?.name ?? id;
}