import type { EquipmentDefinition, EquipmentSetDefinition, RecipeDefinition } from '../game/domain/equipment';

export const equipmentCatalog: readonly EquipmentDefinition[] = [
  {
    id: 'equipment.moss_hood',
    name: 'Moss Hood',
    slot: 'head',
    stats: { rareDropChanceBonus: 0.1 },
    setId: 'set.mossbound',
  },
  {
    id: 'equipment.mossweave_vest',
    name: 'Mossweave Vest',
    slot: 'chest',
    stats: { maxHpBonus: 5, attackDamageBonus: 1 },
    setId: 'set.mossbound',
  },
  {
    id: 'equipment.moss_boots',
    name: 'Moss Boots',
    slot: 'feet',
    stats: { defenseWindowBonusMs: 300 },
    setId: 'set.mossbound',
  },
];

export const mossboundSet: EquipmentSetDefinition = {
  id: 'set.mossbound',
  name: 'Mossbound',
  bonuses: [
    { pieces: 2, stats: { attackDamageBonus: 1 }, description: '+1 attack damage' },
    { pieces: 3, stats: { maxHpBonus: 5, defenseWindowBonusMs: 300 }, description: '+5 max HP, +0.3s defense window' },
  ],
};

export const equipmentSets: readonly EquipmentSetDefinition[] = [mossboundSet];

export const recipes: readonly RecipeDefinition[] = [
  {
    id: 'recipe.moss_hood',
    equipmentId: 'equipment.moss_hood',
    requirements: [
      { materialId: 'material.moss_gel', quantity: 2 },
      { materialId: 'material.boar_hide', quantity: 1 },
    ],
  },
  {
    id: 'recipe.mossweave_vest',
    equipmentId: 'equipment.mossweave_vest',
    requirements: [
      { materialId: 'material.moss_gel', quantity: 3 },
      { materialId: 'material.slime_core', quantity: 1 },
    ],
  },
  {
    id: 'recipe.moss_boots',
    equipmentId: 'equipment.moss_boots',
    requirements: [
      { materialId: 'material.boar_hide', quantity: 2 },
      { materialId: 'material.boar_fang', quantity: 1 },
    ],
  },
];

export function getEquipment(id: string): EquipmentDefinition | undefined {
  return equipmentCatalog.find((e) => e.id === id);
}

export function getSet(id: string): EquipmentSetDefinition | undefined {
  return equipmentSets.find((s) => s.id === id);
}

export function setName(id: string): string {
  return getSet(id)?.name ?? id;
}

export function getRecipe(id: string): RecipeDefinition | undefined {
  return recipes.find((r) => r.id === id);
}

export function equipmentName(id: string): string {
  return getEquipment(id)?.name ?? id;
}

export function equipmentForLoadout(loadout: Record<string, string>): EquipmentDefinition[] {
  return Object.values(loadout)
    .map((id) => getEquipment(id))
    .filter((e): e is EquipmentDefinition => e !== undefined);
}

export function slotLabel(slot: 'head' | 'chest' | 'feet'): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}
