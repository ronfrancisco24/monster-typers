import { describe, it, expect } from 'vitest';
import { deriveHunterStats } from '../game/domain/stats';
import { equipItem, unequipSlot, setBonusStats } from '../game/domain/equipment';
import { equipmentSets, getEquipment } from '../content/equipment';

describe('deriveHunterStats', () => {
  it('returns base values with no gear and no skills', () => {
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [], {});
    expect(stats.maxHp).toBe(30);
    expect(stats.attackDamage).toBe(6);
    expect(stats.defenseWindowBonusMs).toBe(0);
    expect(stats.rareDropChanceBonus).toBe(0);
  });

  it('adds armor bonuses', () => {
    const vest = getEquipment('equipment.mossweave_vest')!;
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [vest], {});
    expect(stats.maxHp).toBe(35);
    expect(stats.attackDamage).toBe(7);
  });

  it('adds skill bonuses on top of armor', () => {
    const vest = getEquipment('equipment.mossweave_vest')!;
    const ranks = { 'skill.power_strike': 1, 'skill.quick_reflexes': 1, 'skill.lucky_hands': 1 };
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [vest], ranks);
    expect(stats.maxHp).toBe(35);
    expect(stats.attackDamage).toBe(8); // 6 + 1 (vest) + 1 (skill)
    expect(stats.defenseWindowBonusMs).toBe(300); // 300 (skill) + 0 (vest)
    expect(stats.rareDropChanceBonus).toBeCloseTo(0.15);
  });

  it('stacks all three slots', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const boots = getEquipment('equipment.moss_boots')!;
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [hood, vest, boots], {});
    expect(stats.maxHp).toBe(35);
    expect(stats.attackDamage).toBe(7);
    expect(stats.defenseWindowBonusMs).toBe(300);
    expect(stats.rareDropChanceBonus).toBeCloseTo(0.1);
  });
});

describe('equipItem / unequipSlot', () => {
  it('equips an item into its slot', () => {
    const vest = getEquipment('equipment.mossweave_vest')!;
    const next = equipItem({}, vest);
    expect(next).toEqual({ chest: 'equipment.mossweave_vest' });
  });

  it('rejects an item already equipped in another slot', () => {
    const vest = getEquipment('equipment.mossweave_vest')!;
    const loadout = { chest: 'equipment.mossweave_vest' };
    // re-equip same item into head (invalid slot mismatch) → null
    const headVest = { ...vest, slot: 'head' as const };
    expect(equipItem(loadout, headVest)).toBeNull();
  });

  it('replaces an item in the same slot', () => {
    const vest = getEquipment('equipment.mossweave_vest')!;
    const loadout = { chest: 'equipment.mossweave_vest' };
    const next = equipItem(loadout, vest);
    expect(next).toEqual({ chest: 'equipment.mossweave_vest' });
  });

  it('unequips a slot', () => {
    const loadout = { chest: 'equipment.mossweave_vest', head: 'equipment.moss_hood' };
    const next = unequipSlot(loadout, 'chest');
    expect(next).toEqual({ head: 'equipment.moss_hood' });
  });
});

describe('set bonuses', () => {
  it('inactive with one piece', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const bonus = setBonusStats([hood], equipmentSets);
    expect(bonus.attackDamageBonus ?? 0).toBe(0);
    expect(bonus.maxHpBonus ?? 0).toBe(0);
  });

  it('2-piece bonus activates at two pieces', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const bonus = setBonusStats([hood, vest], equipmentSets);
    expect(bonus.attackDamageBonus).toBe(1);
    expect(bonus.maxHpBonus ?? 0).toBe(0);
  });

  it('3-piece bonus is cumulative with the 2-piece', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const boots = getEquipment('equipment.moss_boots')!;
    const bonus = setBonusStats([hood, vest, boots], equipmentSets);
    expect(bonus.attackDamageBonus).toBe(1);
    expect(bonus.maxHpBonus).toBe(5);
    expect(bonus.defenseWindowBonusMs).toBe(300);
  });

  it('unequipping a piece removes its bonus', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const boots = getEquipment('equipment.moss_boots')!;
    const full = setBonusStats([hood, vest, boots], equipmentSets);
    const two = setBonusStats([hood, vest], equipmentSets);
    expect(full.attackDamageBonus).toBe(1);
    expect(two.attackDamageBonus).toBe(1);
    expect(full.maxHpBonus).toBe(5);
    expect(two.maxHpBonus ?? 0).toBe(0);
  });

  it('full set derived totals', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const boots = getEquipment('equipment.moss_boots')!;
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [hood, vest, boots], {}, equipmentSets);
    expect(stats.maxHp).toBe(40);
    expect(stats.attackDamage).toBe(8);
    expect(stats.defenseWindowBonusMs).toBe(600);
    expect(stats.rareDropChanceBonus).toBeCloseTo(0.1);
  });

  it('set bonuses stack with skills', () => {
    const hood = getEquipment('equipment.moss_hood')!;
    const vest = getEquipment('equipment.mossweave_vest')!;
    const ranks = { 'skill.power_strike': 1 };
    const stats = deriveHunterStats({ maxHp: 30, attackDamage: 6 }, [hood, vest], ranks, equipmentSets);
    expect(stats.attackDamage).toBe(9); // 6 + 1 vest + 1 set + 1 skill
  });
});
