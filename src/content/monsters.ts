import type { MonsterDefinition } from '../game/domain/types';

/** Placeholder encounter for the Phase 01 prototype. */
export const mossSlime: MonsterDefinition = {
  id: 'monster.moss_slime',
  mapId: 'map.verdant_forest',
  name: 'Moss Slime',
  hp: 40,
  attackDamage: 8,
  attackCadenceMs: 6000,
  xpReward: 20,
  attackWords: ['moss', 'slime', 'drip', 'spore', 'ooze', 'mud', 'wet'],
  defenseWords: ['roll', 'duck', 'guard'],
  defenseWindowMs: 3000,
  difficulty: 'easy',
  breakPart: {
    id: 'part.moss_crown',
    name: 'Moss Crown',
    words: ['crown', 'prune', 'snap'],
    threshold: 2,
    intervalMs: 8000,
    bonusMaterialId: 'material.moss_crown',
  },
  drops: [
    { materialId: 'material.moss_gel', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.slime_core', chance: 0.25, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Faster, harder-hitting forest monster; data-driven behavior difference. */
export const bristleBoar: MonsterDefinition = {
  id: 'monster.bristle_boar',
  mapId: 'map.verdant_forest',
  name: 'Bristle Boar',
  hp: 55,
  attackDamage: 10,
  attackCadenceMs: 4500,
  xpReward: 35,
  attackWords: ['charge', 'tusk', 'bristle', 'snout', 'gore', 'fierce', 'wild'],
  defenseWords: ['dodge', 'block', 'leap'],
  defenseWindowMs: 2200,
  difficulty: 'normal',
  breakPart: {
    id: 'part.boar_tusk',
    name: 'Boar Tusk',
    words: ['tusk', 'crack', 'snap'],
    threshold: 2,
    intervalMs: 7000,
    bonusMaterialId: 'material.boar_tusk',
  },
  drops: [
    { materialId: 'material.boar_hide', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.boar_fang', chance: 0.35, minQuantity: 1, maxQuantity: 1 },
  ],
};

export type MaterialSource = {
  monsterId: string;
  monsterName: string;
  kind: 'drop' | 'break';
  chance: number;
  minQuantity: number;
  maxQuantity: number;
};

export const monsters: readonly MonsterDefinition[] = [mossSlime, bristleBoar];

export function materialSources(materialId: string): MaterialSource[] {
  const out: MaterialSource[] = [];
  for (const monster of monsters) {
    for (const drop of monster.drops ?? []) {
      if (drop.materialId === materialId) {
        out.push({
          monsterId: monster.id,
          monsterName: monster.name,
          kind: 'drop',
          chance: drop.chance,
          minQuantity: drop.minQuantity,
          maxQuantity: drop.maxQuantity,
        });
      }
    }
    if (monster.breakPart?.bonusMaterialId === materialId) {
      out.push({
        monsterId: monster.id,
        monsterName: monster.name,
        kind: 'break',
        chance: 1,
        minQuantity: 1,
        maxQuantity: 1,
      });
    }
  }
  return out;
}