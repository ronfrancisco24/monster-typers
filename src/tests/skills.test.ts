import { describe, it, expect } from 'vitest';
import {
  SKILLS,
  currentRank,
  nextRankDef,
  isMaxed,
  derivedAttackBonus,
  derivedDefenseWindowBonusMs,
  derivedRareDropChanceBonus,
} from '../game/domain/skills';
import { calculateHuntRewards, createSeededRandom, hashString } from '../game/domain/rewards';
import { mossSlime } from '../content/monsters';

describe('skills', () => {
  it('starts with no ranks', () => {
    const ranks = {};
    expect(derivedAttackBonus(ranks)).toBe(0);
    expect(derivedDefenseWindowBonusMs(ranks)).toBe(0);
    expect(derivedRareDropChanceBonus(ranks)).toBe(0);
  });

  it('sums attack bonus across purchased ranks', () => {
    const ranks = { 'skill.power_strike': 2 };
    expect(derivedAttackBonus(ranks)).toBe(2); // 1 + 1
  });

  it('sums defense window bonus', () => {
    const ranks = { 'skill.quick_reflexes': 1 };
    expect(derivedDefenseWindowBonusMs(ranks)).toBe(300);
  });

  it('sums rare drop chance bonus', () => {
    const ranks = { 'skill.lucky_hands': 2 };
    expect(derivedRareDropChanceBonus(ranks)).toBeCloseTo(0.3);
  });

  it('reports next rank and maxed status', () => {
    const ranks = { 'skill.power_strike': 3 };
    const skill = SKILLS.find((s) => s.id === 'skill.power_strike')!;
    expect(isMaxed(skill, ranks)).toBe(true);
    expect(nextRankDef(skill, ranks)).toBeNull();
  });

  it('reports next rank cost and description', () => {
    const ranks = {};
    const skill = SKILLS.find((s) => s.id === 'skill.power_strike')!;
    const next = nextRankDef(skill, ranks);
    expect(next?.rank).toBe(1);
    expect(next?.cost).toBe(1);
    expect(currentRank(ranks, skill.id)).toBe(0);
  });
});

describe('rewards with gathering bonus', () => {
  it('boosts rare drop chance when bonus is provided', () => {
    // Roll 0.3: slime_core chance is 0.25, so excluded without bonus;
    // with +0.15 bonus chance becomes 0.40, so included.
    const roll = () => 0.3;
    const without = calculateHuntRewards({
      huntId: 'h1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
      random: roll,
    });
    const withBonus = calculateHuntRewards({
      huntId: 'h1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
      gatherChanceBonus: 0.15,
      random: roll,
    });
    const rareWithout = without.drops.find((d) => d.materialId === 'material.slime_core');
    const rareWith = withBonus.drops.find((d) => d.materialId === 'material.slime_core');
    expect(rareWithout).toBeUndefined();
    expect(rareWith).toBeDefined();
  });

  it('does not change common drops', () => {
    const random = () => 0.5;
    const a = calculateHuntRewards({ huntId: 'h2', monster: mossSlime, outcome: 'victory', partBroken: false, random });
    const b = calculateHuntRewards({ huntId: 'h2', monster: mossSlime, outcome: 'victory', partBroken: false, gatherChanceBonus: 0.5, random });
    const commonA = a.drops.find((d) => d.materialId === 'material.moss_gel');
    const commonB = b.drops.find((d) => d.materialId === 'material.moss_gel');
    expect(commonA?.quantity).toBe(commonB?.quantity);
  });
});

describe('seeded gathering bonus', () => {
  it('flips a rare drop for some seeded hunt id', () => {
    let found: string | null = null;
    for (let i = 0; i < 5000; i++) {
      const id = `hunt-${i}`;
      const without = calculateHuntRewards({ huntId: id, monster: mossSlime, outcome: 'victory', partBroken: false });
      const withBonus = calculateHuntRewards({
        huntId: id,
        monster: mossSlime,
        outcome: 'victory',
        partBroken: false,
        gatherChanceBonus: 0.15,
        random: createSeededRandom(hashString(id)),
      });
      const hasWithout = without.drops.some((d) => d.materialId === 'material.slime_core');
      const hasWith = withBonus.drops.some((d) => d.materialId === 'material.slime_core');
      if (!hasWithout && hasWith) {
        found = id;
        break;
      }
    }
    expect(found).not.toBeNull();
  });
});