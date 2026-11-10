// Pure derived-stat helpers. Combine base hunter values, equipped armor, and skill ranks.
import type { EquipmentDefinition, EquipmentSetDefinition } from './equipment';
import { mergeStats, setBonusStats } from './equipment';
import { derivedAttackBonus, derivedDefenseWindowBonusMs, derivedRareDropChanceBonus } from './skills';

export type HunterBaseStats = {
  maxHp: number;
  attackDamage: number;
};

export type DerivedHunterStats = {
  maxHp: number;
  attackDamage: number;
  defenseWindowBonusMs: number;
  rareDropChanceBonus: number;
};

export function deriveHunterStats(
  base: HunterBaseStats,
  equippedItems: readonly EquipmentDefinition[],
  skillRanks: Record<string, number> = {},
  sets: readonly EquipmentSetDefinition[] = [],
): DerivedHunterStats {
  const armor = mergeStats(equippedItems);
  const setBonus = setBonusStats(equippedItems, sets);
  const combined = {
    maxHpBonus: (armor.maxHpBonus ?? 0) + (setBonus.maxHpBonus ?? 0),
    attackDamageBonus: (armor.attackDamageBonus ?? 0) + (setBonus.attackDamageBonus ?? 0),
    defenseWindowBonusMs: (armor.defenseWindowBonusMs ?? 0) + (setBonus.defenseWindowBonusMs ?? 0),
    rareDropChanceBonus: (armor.rareDropChanceBonus ?? 0) + (setBonus.rareDropChanceBonus ?? 0),
  };
  return {
    maxHp: base.maxHp + (combined.maxHpBonus ?? 0),
    attackDamage: base.attackDamage + (combined.attackDamageBonus ?? 0) + derivedAttackBonus(skillRanks),
    defenseWindowBonusMs: (combined.defenseWindowBonusMs ?? 0) + derivedDefenseWindowBonusMs(skillRanks),
    rareDropChanceBonus: (combined.rareDropChanceBonus ?? 0) + derivedRareDropChanceBonus(skillRanks),
  };
}
