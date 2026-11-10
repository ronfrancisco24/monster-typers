// Pure TypeScript maps/regions catalog. Unlock rules are data; enforcement comes in a later slice.
import type { MonsterDefinition } from '../game/domain/types';

export type MapUnlockRequirement =
  | { type: 'start' }
  | { type: 'boss'; bossId: string };

export type MapDefinition = {
  id: string;
  name: string;
  description: string;
  monsterIds: readonly string[];
  bossId: string;
  unlockRequirement: MapUnlockRequirement;
};

export const maps: readonly MapDefinition[] = [
  {
    id: 'map.verdant_forest',
    name: 'Verdant Forest',
    description: 'Short words, basic dodges, and optional part breaks.',
    monsterIds: ['monster.moss_slime', 'monster.bristle_boar', 'monster.sporecap_fungus'],
    bossId: 'monster.grove_guardian',
    unlockRequirement: { type: 'start' },
  },
  {
    id: 'map.crystal_caverns',
    name: 'Crystal Caverns',
    description: 'Armor and break emphasis with more defensive pressure.',
    monsterIds: ['monster.crystal_bat', 'monster.stalagmite_golem', 'monster.gloom_spider'],
    bossId: 'monster.crystal_serpent',
    unlockRequirement: { type: 'boss', bossId: 'monster.grove_guardian' },
  },
  {
    id: 'map.ashen_wastes',
    name: 'Ashen Wastes',
    description: 'Longer words, faster cadence, stronger consequences for errors.',
    monsterIds: ['monster.ash_hound', 'monster.obsidian_golem', 'monster.ember_wisp'],
    bossId: 'monster.ember_wyvern',
    unlockRequirement: { type: 'boss', bossId: 'monster.crystal_serpent' },
  },
];

export function getMap(id: string): MapDefinition | undefined {
  return maps.find((m) => m.id === id);
}

export function monstersForMap(mapId: string): string[] {
  const m = getMap(mapId);
  if (!m) return [];
  return [...m.monsterIds, m.bossId];
}
