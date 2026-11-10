import { describe, it, expect } from 'vitest';
import { maps } from '../content/maps';
import { monsters } from '../content/monsters';
import { materials, getMaterial } from '../content/materials';
import { calculateHuntRewards, createSeededRandom, hashString } from '../game/domain/rewards';

describe('content catalog', () => {
  it('has three maps', () => {
    expect(maps).toHaveLength(3);
    expect(new Set(maps.map((m) => m.id)).size).toBe(maps.length);
  });

  it('has twelve monsters total', () => {
    expect(monsters).toHaveLength(12);
    expect(new Set(monsters.map((m) => m.id)).size).toBe(monsters.length);
  });

  it('has four monsters per map (3 standard + 1 boss)', () => {
    for (const map of maps) {
      const ids = [map.bossId, ...map.monsterIds];
      expect(ids).toHaveLength(4);
      expect(new Set(ids).size).toBe(4);
      for (const id of ids) {
        expect(monsters.some((m) => m.id === id)).toBe(true);
      }
    }
  });

  it('has three bosses, one per map', () => {
    const bosses = monsters.filter((m) => m.isBoss);
    expect(bosses).toHaveLength(3);
    for (const map of maps) {
      const boss = monsters.find((m) => m.id === map.bossId);
      expect(boss?.isBoss).toBe(true);
      expect(boss?.mapId).toBe(map.id);
    }
  });

  it('every monster references a valid map', () => {
    for (const m of monsters) {
      expect(maps.some((map) => map.id === m.mapId)).toBe(true);
    }
  });

  it('all drop and break materials exist', () => {
    for (const m of monsters) {
      for (const drop of m.drops ?? []) {
        expect(getMaterial(drop.materialId)).toBeDefined();
      }
      if (m.breakPart?.bonusMaterialId) {
        expect(getMaterial(m.breakPart.bonusMaterialId)).toBeDefined();
      }
    }
  });

  it('every monster has positive stats and words', () => {
    for (const m of monsters) {
      expect(m.hp).toBeGreaterThan(0);
      expect(m.attackCadenceMs).toBeGreaterThan(0);
      expect(m.xpReward).toBeGreaterThan(0);
      expect(m.attackWords.length).toBeGreaterThan(0);
      if (m.defenseWords && m.defenseWords.length > 0) {
        expect(m.defenseWindowMs).toBeGreaterThan(0);
      }
    }
  });

  it('materials have unique ids', () => {
    expect(new Set(materials.map((m) => m.id)).size).toBe(materials.length);
  });

  it('simulated rare drop rates stay within a sane band', () => {
    const monster = monsters.find((m) => m.id === 'monster.moss_slime')!;
    let cores = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      const r = calculateHuntRewards({
        huntId: `sim-${i}`,
        monster,
        outcome: 'victory',
        partBroken: false,
      });
      if (r.drops.some((d) => d.materialId === 'material.slime_core')) cores++;
    }
    const rate = cores / n;
    // chance is 0.25; allow statistical tolerance
    expect(rate).toBeGreaterThan(0.2);
    expect(rate).toBeLessThan(0.32);
  });

  it('encounters differ by region in cadence and difficulty', () => {
    const forest = monsters.filter((m) => m.mapId === 'map.verdant_forest' && !m.isBoss);
    const caverns = monsters.filter((m) => m.mapId === 'map.crystal_caverns' && !m.isBoss);
    const ashen = monsters.filter((m) => m.mapId === 'map.ashen_wastes' && !m.isBoss);
    const avgCadence = (ms: typeof forest) => ms.reduce((a, m) => a + m.attackCadenceMs, 0) / ms.length;
    expect(avgCadence(forest)).toBeGreaterThan(avgCadence(caverns));
    expect(avgCadence(caverns)).toBeGreaterThan(avgCadence(ashen));
    // bosses have more HP than standards in their region
    for (const map of maps) {
      const boss = monsters.find((m) => m.id === map.bossId)!;
      const standards = map.monsterIds.map((id) => monsters.find((m) => m.id === id)!);
      for (const s of standards) {
        expect(boss.hp).toBeGreaterThan(s.hp);
      }
    }
    // at least one breakable part per region
    for (const map of maps) {
      const regionMonsters = [...map.monsterIds, map.bossId].map((id) => monsters.find((m) => m.id === id)!);
      expect(regionMonsters.some((m) => m.breakPart !== undefined)).toBe(true);
    }
  });
});
