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

/** Sporecap Fungus: forest standard monster with a breakable fungal cap. */
export const sporecapFungus: MonsterDefinition = {
  id: 'monster.sporecap_fungus',
  mapId: 'map.verdant_forest',
  name: 'Sporecap Fungus',
  hp: 48,
  attackDamage: 7,
  attackCadenceMs: 5500,
  xpReward: 25,
  attackWords: ['spore', 'cap', 'fungus', 'mold', 'gill', 'rot', 'bloom', 'stalk', 'hypha'],
  defenseWords: ['dodge', 'duck', 'step'],
  defenseWindowMs: 2600,
  difficulty: 'normal',
  breakPart: {
    id: 'part.fungal_cap',
    name: 'Fungal Cap',
    words: ['cap', 'prune', 'snap'],
    threshold: 2,
    intervalMs: 9000,
    bonusMaterialId: 'material.fungal_cap',
  },
  drops: [
    { materialId: 'material.spore_powder', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.fungal_cap', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Grove Guardian: forest boss with a breakable grove core. */
export const groveGuardian: MonsterDefinition = {
  id: 'monster.grove_guardian',
  mapId: 'map.verdant_forest',
  name: 'Grove Guardian',
  hp: 140,
  attackDamage: 12,
  attackCadenceMs: 4000,
  xpReward: 120,
  attackWords: ['grove', 'guardian', 'root', 'vine', 'thorn', 'bark', 'ancient', 'elder', 'bough'],
  defenseWords: ['parry', 'block', 'guard'],
  defenseWindowMs: 2000,
  difficulty: 'hard',
  isBoss: true,
  phases: [{ hpThreshold: 0.5, attackCadenceMs: 2800, attackDamage: 16 }],
  breakPart: {
    id: 'part.grove_core',
    name: 'Grove Core',
    words: ['core', 'break', 'smash'],
    threshold: 3,
    intervalMs: 6000,
    bonusMaterialId: 'material.grove_heart',
  },
  drops: [
    { materialId: 'material.grove_heart', chance: 0.5, minQuantity: 1, maxQuantity: 1 },
    { materialId: 'material.ancient_bark', chance: 0.6, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.moss_gel', chance: 1, minQuantity: 2, maxQuantity: 3 },
  ],
};

/** Crystal Bat: fast, low-HP caverns monster. */
export const crystalBat: MonsterDefinition = {
  id: 'monster.crystal_bat',
  mapId: 'map.crystal_caverns',
  name: 'Crystal Bat',
  hp: 36,
  attackDamage: 6,
  attackCadenceMs: 3000,
  xpReward: 30,
  attackWords: ['crystal', 'bat', 'shard', 'echo', 'cave', 'wing', 'sonar', 'flit', 'gleam'],
  defenseWords: ['duck', 'dodge'],
  defenseWindowMs: 1800,
  difficulty: 'easy',
  drops: [
    { materialId: 'material.crystal_shard', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.bat_wing', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Stalagmite Golem: tanky caverns monster with a breakable core. */
export const stalagmiteGolem: MonsterDefinition = {
  id: 'monster.stalagmite_golem',
  mapId: 'map.crystal_caverns',
  name: 'Stalagmite Golem',
  hp: 95,
  attackDamage: 10,
  attackCadenceMs: 5000,
  xpReward: 50,
  attackWords: ['stalagmite', 'stone', 'golem', 'rock', 'pillar', 'cave', 'crush', 'slam', 'quartz'],
  defenseWords: ['block', 'guard', 'brace'],
  defenseWindowMs: 2400,
  difficulty: 'normal',
  breakPart: {
    id: 'part.golem_core',
    name: 'Golem Core',
    words: ['core', 'crack', 'shatter'],
    threshold: 2,
    intervalMs: 8000,
    bonusMaterialId: 'material.golem_core',
  },
  drops: [
    { materialId: 'material.stalagmite', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.golem_core', chance: 0.35, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Gloom Spider: medium caverns monster. */
export const gloomSpider: MonsterDefinition = {
  id: 'monster.gloom_spider',
  mapId: 'map.crystal_caverns',
  name: 'Gloom Spider',
  hp: 60,
  attackDamage: 8,
  attackCadenceMs: 3800,
  xpReward: 40,
  attackWords: ['gloom', 'spider', 'web', 'venom', 'silk', 'fang', 'crawl', 'lurk', 'skitter'],
  defenseWords: ['dodge', 'jump', 'roll'],
  defenseWindowMs: 2000,
  difficulty: 'normal',
  drops: [
    { materialId: 'material.spider_silk', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.venom_sac', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Crystal Serpent: caverns boss with a breakable core. */
export const crystalSerpent: MonsterDefinition = {
  id: 'monster.crystal_serpent',
  mapId: 'map.crystal_caverns',
  name: 'Crystal Serpent',
  hp: 170,
  attackDamage: 14,
  attackCadenceMs: 3200,
  xpReward: 160,
  attackWords: ['crystal', 'serpent', 'fang', 'coil', 'shard', 'glint', 'hiss', 'scale', 'prism'],
  defenseWords: ['parry', 'block', 'guard'],
  defenseWindowMs: 1800,
  difficulty: 'hard',
  isBoss: true,
  phases: [{ hpThreshold: 0.5, attackCadenceMs: 2200, attackDamage: 18 }],
  breakPart: {
    id: 'part.serpent_core',
    name: 'Serpent Core',
    words: ['core', 'shatter', 'break'],
    threshold: 3,
    intervalMs: 5500,
    bonusMaterialId: 'material.crystal_core',
  },
  drops: [
    { materialId: 'material.crystal_core', chance: 0.5, minQuantity: 1, maxQuantity: 1 },
    { materialId: 'material.serpent_scale', chance: 0.6, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.crystal_shard', chance: 1, minQuantity: 2, maxQuantity: 3 },
  ],
};

/** Ash Hound: fast ashen wastes monster. */
export const ashHound: MonsterDefinition = {
  id: 'monster.ash_hound',
  mapId: 'map.ashen_wastes',
  name: 'Ash Hound',
  hp: 50,
  attackDamage: 9,
  attackCadenceMs: 2800,
  xpReward: 45,
  attackWords: ['ash', 'hound', 'ember', 'fang', 'paw', 'howl', 'smoke', 'char', 'soot'],
  defenseWords: ['dodge', 'duck', 'step'],
  defenseWindowMs: 1700,
  difficulty: 'normal',
  drops: [
    { materialId: 'material.ash', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.hound_fang', chance: 0.35, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Obsidian Golem: tanky ashen wastes monster with a breakable core. */
export const obsidianGolem: MonsterDefinition = {
  id: 'monster.obsidian_golem',
  mapId: 'map.ashen_wastes',
  name: 'Obsidian Golem',
  hp: 110,
  attackDamage: 13,
  attackCadenceMs: 4500,
  xpReward: 60,
  attackWords: ['obsidian', 'golem', 'stone', 'rock', 'slam', 'crush', 'magma', 'core', 'shard'],
  defenseWords: ['block', 'brace', 'guard'],
  defenseWindowMs: 2200,
  difficulty: 'hard',
  breakPart: {
    id: 'part.obsidian_core',
    name: 'Obsidian Core',
    words: ['core', 'crack', 'shatter'],
    threshold: 3,
    intervalMs: 7000,
    bonusMaterialId: 'material.obsidian_core',
  },
  drops: [
    { materialId: 'material.obsidian', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.obsidian_core', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Ember Wisp: fast ashen wastes monster with rare drops. */
export const emberWisp: MonsterDefinition = {
  id: 'monster.ember_wisp',
  mapId: 'map.ashen_wastes',
  name: 'Ember Wisp',
  hp: 40,
  attackDamage: 7,
  attackCadenceMs: 2600,
  xpReward: 50,
  attackWords: ['ember', 'wisp', 'flame', 'spark', 'glow', 'heat', 'flicker', 'burn', 'cinder'],
  defenseWords: ['dodge', 'duck'],
  defenseWindowMs: 1600,
  difficulty: 'normal',
  drops: [
    { materialId: 'material.ember', chance: 1, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.wisp_core', chance: 0.4, minQuantity: 1, maxQuantity: 1 },
  ],
};

/** Ember Wyvern: ashen wastes boss with a breakable heart. */
export const emberWyvern: MonsterDefinition = {
  id: 'monster.ember_wyvern',
  mapId: 'map.ashen_wastes',
  name: 'Ember Wyvern',
  hp: 200,
  attackDamage: 16,
  attackCadenceMs: 2800,
  xpReward: 200,
  attackWords: ['ember', 'wyvern', 'flame', 'wing', 'tail', 'fire', 'scale', 'inferno', 'blaze'],
  defenseWords: ['parry', 'block', 'guard'],
  defenseWindowMs: 1600,
  difficulty: 'hard',
  isBoss: true,
  phases: [{ hpThreshold: 0.5, attackCadenceMs: 2000, attackDamage: 20 }],
  breakPart: {
    id: 'part.wyvern_heart',
    name: 'Wyvern Heart',
    words: ['heart', 'shatter', 'break'],
    threshold: 3,
    intervalMs: 5000,
    bonusMaterialId: 'material.ember_core',
  },
  drops: [
    { materialId: 'material.ember_core', chance: 0.5, minQuantity: 1, maxQuantity: 1 },
    { materialId: 'material.wyvern_scale', chance: 0.6, minQuantity: 1, maxQuantity: 2 },
    { materialId: 'material.ember', chance: 1, minQuantity: 2, maxQuantity: 3 },
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

export function getMonster(id: string): MonsterDefinition | undefined {
  return monsters.find((m) => m.id === id);
}

export const monsters: readonly MonsterDefinition[] = [
  mossSlime,
  bristleBoar,
  sporecapFungus,
  groveGuardian,
  crystalBat,
  stalagmiteGolem,
  gloomSpider,
  crystalSerpent,
  ashHound,
  obsidianGolem,
  emberWisp,
  emberWyvern,
];

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