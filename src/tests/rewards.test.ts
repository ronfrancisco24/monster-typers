import { describe, expect, it } from 'vitest';
import { bristleBoar, mossSlime } from '../content/monsters';
import { getMaterial, materials } from '../content/materials';
import {
  calculateHuntRewards,
  createSeededRandom,
  hashString,
} from '../game/domain/rewards';

describe('rewards', () => {
  it('every monster drop and part bonus references a real material', () => {
    for (const monster of [mossSlime, bristleBoar]) {
      for (const drop of monster.drops ?? []) {
        expect(getMaterial(drop.materialId)).toBeDefined();
      }
      if (monster.breakPart?.bonusMaterialId !== undefined) {
        expect(getMaterial(monster.breakPart.bonusMaterialId)).toBeDefined();
      }
    }
  });

  it('grants nothing on defeat or abandon', () => {
    for (const outcome of ['defeat', 'abandoned'] as const) {
      const result = calculateHuntRewards({
        huntId: 'hunt-1',
        monster: mossSlime,
        outcome,
        partBroken: true,
      });
      expect(result.xp).toBe(0);
      expect(result.drops).toEqual([]);
      expect(result.brokenPartIds).toEqual([]);
    }
  });

  it('awards xp and drops on victory', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
    });
    expect(result.xp).toBe(mossSlime.xpReward);
    expect(result.drops.length).toBeGreaterThanOrEqual(1);
  });

  it('includes the part bonus exactly once when the part is broken', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: true,
    });
    const bonusDrops = result.drops.filter(
      (drop) => drop.materialId === mossSlime.breakPart?.bonusMaterialId,
    );
    expect(bonusDrops).toHaveLength(1);
    expect(bonusDrops[0]!.quantity).toBe(1);
    expect(result.brokenPartIds).toEqual([mossSlime.breakPart!.id]);
  });

  it('does not include the part bonus when the part is not broken', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
    });
    const bonusDrops = result.drops.filter(
      (drop) => drop.materialId === mossSlime.breakPart?.bonusMaterialId,
    );
    expect(bonusDrops).toHaveLength(0);
    expect(result.brokenPartIds).toEqual([]);
  });

  it('keeps drop quantities within configured ranges', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: bristleBoar,
      outcome: 'victory',
      partBroken: false,
      random: () => 0,
    });
    const hide = result.drops.find((drop) => drop.materialId === 'material.boar_hide');
    expect(hide).toBeDefined();
    expect(hide!.quantity).toBeGreaterThanOrEqual(1);
    expect(hide!.quantity).toBeLessThanOrEqual(2);
  });

  it('omits a rare drop when the roll is above its chance', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
      random: () => 0.99,
    });
    const core = result.drops.find((drop) => drop.materialId === 'material.slime_core');
    expect(core).toBeUndefined();
  });

  it('includes a rare drop when the roll is below its chance', () => {
    const result = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
      random: () => 0,
    });
    const core = result.drops.find((drop) => drop.materialId === 'material.slime_core');
    expect(core).toBeDefined();
    expect(core!.quantity).toBe(1);
  });

  it('is reproducible for the same seed', () => {
    const a = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: bristleBoar,
      outcome: 'victory',
      partBroken: true,
      random: createSeededRandom(hashString('hunt-1')),
    });
    const b = calculateHuntRewards({
      huntId: 'hunt-1',
      monster: bristleBoar,
      outcome: 'victory',
      partBroken: true,
      random: createSeededRandom(hashString('hunt-1')),
    });
    expect(a).toEqual(b);
  });

  it('is deterministic from huntId when no rng is injected', () => {
    const a = calculateHuntRewards({
      huntId: 'hunt-abc',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
    });
    const b = calculateHuntRewards({
      huntId: 'hunt-abc',
      monster: mossSlime,
      outcome: 'victory',
      partBroken: false,
    });
    expect(a).toEqual(b);
  });

  it('material catalog has unique ids', () => {
    const ids = materials.map((material) => material.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});