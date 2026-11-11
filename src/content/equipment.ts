import type { EquipmentDefinition, EquipmentSetDefinition, RecipeDefinition } from '../game/domain/equipment';

export const equipmentCatalog: readonly EquipmentDefinition[] = [
  // Forest set: Mossbound
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
  // Cavern set: Crystalbound
  {
    id: 'equipment.crystal_helm',
    name: 'Crystal Helm',
    slot: 'head',
    stats: { attackDamageBonus: 2, defenseWindowBonusMs: 200 },
    setId: 'set.crystalbound',
  },
  {
    id: 'equipment.crystal_plate',
    name: 'Crystal Plate',
    slot: 'chest',
    stats: { maxHpBonus: 8, attackDamageBonus: 1 },
    setId: 'set.crystalbound',
  },
  {
    id: 'equipment.crystal_greaves',
    name: 'Crystal Greaves',
    slot: 'feet',
    stats: { defenseWindowBonusMs: 400, rareDropChanceBonus: 0.05 },
    setId: 'set.crystalbound',
  },
  // Ashen set: Ashenbound
  {
    id: 'equipment.ashen_helm',
    name: 'Ashen Helm',
    slot: 'head',
    stats: { rareDropChanceBonus: 0.15, attackDamageBonus: 1 },
    setId: 'set.ashenbound',
  },
  {
    id: 'equipment.ashen_plate',
    name: 'Ashen Plate',
    slot: 'chest',
    stats: { maxHpBonus: 10, attackDamageBonus: 2 },
    setId: 'set.ashenbound',
  },
  {
    id: 'equipment.ashen_greaves',
    name: 'Ashen Greaves',
    slot: 'feet',
    stats: { defenseWindowBonusMs: 500, attackDamageBonus: 1 },
    setId: 'set.ashenbound',
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

export const crystalboundSet: EquipmentSetDefinition = {
  id: 'set.crystalbound',
  name: 'Crystalbound',
  bonuses: [
    { pieces: 2, stats: { defenseWindowBonusMs: 200, maxHpBonus: 3 }, description: '+3 max HP, +0.2s defense window' },
    { pieces: 3, stats: { attackDamageBonus: 2, defenseWindowBonusMs: 200 }, description: '+2 attack damage, +0.2s defense window' },
  ],
};

export const ashenboundSet: EquipmentSetDefinition = {
  id: 'set.ashenbound',
  name: 'Ashenbound',
  bonuses: [
    { pieces: 2, stats: { attackDamageBonus: 1, rareDropChanceBonus: 0.05 }, description: '+1 attack damage, +5% rare drop' },
    { pieces: 3, stats: { attackDamageBonus: 2, maxHpBonus: 5 }, description: '+2 attack damage, +5 max HP' },
  ],
};

export const equipmentSets: readonly EquipmentSetDefinition[] = [mossboundSet, crystalboundSet, ashenboundSet];

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
  // Crystal set
  {
    id: 'recipe.crystal_helm',
    equipmentId: 'equipment.crystal_helm',
    requirements: [
      { materialId: 'material.crystal_shard', quantity: 3 },
      { materialId: 'material.bat_wing', quantity: 1 },
    ],
  },
  {
    id: 'recipe.crystal_plate',
    equipmentId: 'equipment.crystal_plate',
    requirements: [
      { materialId: 'material.stalagmite', quantity: 4 },
      { materialId: 'material.golem_core', quantity: 1 },
    ],
  },
  {
    id: 'recipe.crystal_greaves',
    equipmentId: 'equipment.crystal_greaves',
    requirements: [
      { materialId: 'material.spider_silk', quantity: 3 },
      { materialId: 'material.venom_sac', quantity: 1 },
    ],
  },
  // Ashen set
  {
    id: 'recipe.ashen_helm',
    equipmentId: 'equipment.ashen_helm',
    requirements: [
      { materialId: 'material.ash', quantity: 3 },
      { materialId: 'material.hound_fang', quantity: 1 },
    ],
  },
  {
    id: 'recipe.ashen_plate',
    equipmentId: 'equipment.ashen_plate',
    requirements: [
      { materialId: 'material.obsidian', quantity: 4 },
      { materialId: 'material.obsidian_core', quantity: 1 },
    ],
  },
  {
    id: 'recipe.ashen_greaves',
    equipmentId: 'equipment.ashen_greaves',
    requirements: [
      { materialId: 'material.ember', quantity: 3 },
      { materialId: 'material.wisp_core', quantity: 1 },
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

export function slotIconForSet(setId: string | undefined): string {
  if (setId === 'set.mossbound') return 'slot.forest';
  if (setId === 'set.crystalbound') return 'slot.crystal';
  if (setId === 'set.ashenbound') return 'slot.ashen';
  return 'slot.common';
}

export function hasUiSprite(key: string): boolean {
  // Best-effort: the manifest is loaded at runtime; this is a static hint.
  return true;
}
