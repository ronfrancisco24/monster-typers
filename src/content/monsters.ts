import type { MonsterDefinition } from '../game/domain/types';

/** Placeholder encounter for the Phase 01 prototype. */
export const mossSlime: MonsterDefinition = {
  id: 'monster.moss_slime',
  mapId: 'map.verdant_forest',
  name: 'Moss Slime',
  hp: 40,
  attackDamage: 8,
  attackCadenceMs: 6000,
  attackWords: ['moss', 'slime', 'drip', 'spore', 'ooze', 'mud', 'wet'],
};
