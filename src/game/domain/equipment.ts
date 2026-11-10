// Pure TypeScript equipment model. Rust persists owned equipment and the loadout.
export type EquipmentSlot = 'head' | 'chest' | 'feet';

export type EquipmentStats = {
  maxHpBonus?: number;
  attackDamageBonus?: number;
  defenseWindowBonusMs?: number;
  rareDropChanceBonus?: number;
};

export type EquipmentDefinition = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  stats: EquipmentStats;
  setId?: string;
};

export type SetBonus = {
  pieces: number;
  stats: EquipmentStats;
  description: string;
};

export type EquipmentSetDefinition = {
  id: string;
  name: string;
  bonuses: readonly SetBonus[];
};

export type RecipeRequirement = {
  materialId: string;
  quantity: number;
};

export type RecipeDefinition = {
  id: string;
  equipmentId: string;
  requirements: readonly RecipeRequirement[];
};

export type InventoryLike = { material_id: string; quantity: number }[];

export function getRequirement(recipe: RecipeDefinition, materialId: string): number {
  return recipe.requirements.find((r) => r.materialId === materialId)?.quantity ?? 0;
}

export function ownedQuantity(inventory: InventoryLike, materialId: string): number {
  return inventory.find((e) => e.material_id === materialId)?.quantity ?? 0;
}

export function missingMaterials(recipe: RecipeDefinition, inventory: InventoryLike): RecipeRequirement[] {
  return recipe.requirements
    .map((r) => ({ materialId: r.materialId, quantity: Math.max(0, r.quantity - ownedQuantity(inventory, r.materialId)) }))
    .filter((r) => r.quantity > 0);
}

export function canCraft(recipe: RecipeDefinition, inventory: InventoryLike, owned: ReadonlySet<string>): boolean {
  if (owned.has(recipe.equipmentId)) return false;
  return missingMaterials(recipe, inventory).length === 0;
}

export function mergeStatBlocks(blocks: readonly EquipmentStats[]): EquipmentStats {
  const out: EquipmentStats = {};
  for (const block of blocks) {
    out.maxHpBonus = (out.maxHpBonus ?? 0) + (block.maxHpBonus ?? 0);
    out.attackDamageBonus = (out.attackDamageBonus ?? 0) + (block.attackDamageBonus ?? 0);
    out.defenseWindowBonusMs = (out.defenseWindowBonusMs ?? 0) + (block.defenseWindowBonusMs ?? 0);
    out.rareDropChanceBonus = (out.rareDropChanceBonus ?? 0) + (block.rareDropChanceBonus ?? 0);
  }
  return out;
}

export function mergeStats(items: readonly EquipmentDefinition[]): EquipmentStats {
  return mergeStatBlocks(items.map((item) => item.stats));
}

export function setBonusStats(
  items: readonly EquipmentDefinition[],
  sets: readonly EquipmentSetDefinition[],
): EquipmentStats {
  const counts = new Map<string, Set<string>>();
  for (const item of items) {
    if (!item.setId) continue;
    const set = counts.get(item.setId) ?? new Set<string>();
    set.add(item.id);
    counts.set(item.setId, set);
  }
  const blocks: EquipmentStats[] = [];
  for (const set of sets) {
    const count = counts.get(set.id)?.size ?? 0;
    for (const bonus of set.bonuses) {
      if (count >= bonus.pieces) blocks.push(bonus.stats);
    }
  }
  return mergeStatBlocks(blocks);
}

export function equipItem(
  loadout: Record<string, string>,
  item: EquipmentDefinition,
): Record<string, string> | null {
  // An item may only occupy one slot.
  for (const [slot, id] of Object.entries(loadout)) {
    if (id === item.id && slot !== item.slot) return null;
  }
  return { ...loadout, [item.slot]: item.id };
}

export function unequipSlot(loadout: Record<string, string>, slot: EquipmentSlot): Record<string, string> {
  const next = { ...loadout };
  delete next[slot];
  return next;
}
