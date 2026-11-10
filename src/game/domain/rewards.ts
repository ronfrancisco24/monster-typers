import type { MonsterDefinition } from './types';

export type HuntOutcome = 'victory' | 'defeat' | 'abandoned';

export type MaterialDrop = {
  materialId: string;
  quantity: number;
};

export type HuntRewardSummary = {
  huntId: string;
  monsterId: string;
  mapId: string;
  outcome: HuntOutcome;
  xp: number;
  drops: MaterialDrop[];
  brokenPartIds: string[];
};

export type RewardInput = {
  huntId: string;
  monster: MonsterDefinition;
  outcome: HuntOutcome;
  partBroken: boolean;
  /** Bonus rare-drop chance from gathering skills (0..1). */
  gatherChanceBonus?: number;
  /** Injectable RNG in [0, 1). Defaults to a seeded source derived from huntId. */
  random?: () => number;
};

/**
 * Mulberry32: small, fast, deterministic PRNG. Good enough for loot rolls.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash of a string, used to seed loot RNG from a huntId. */
export function hashString(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pure loot/XP calculation. Only victories pay out; defeat and abandon grant
 * nothing. Rolls run in a fixed order so the result is reproducible for a given
 * RNG stream.
 */
export function calculateHuntRewards(input: RewardInput): HuntRewardSummary {
  const { huntId, monster, outcome, partBroken } = input;
  const gatherChanceBonus = input.gatherChanceBonus ?? 0;

  if (outcome !== 'victory') {
    return {
      huntId,
      monsterId: monster.id,
      mapId: monster.mapId,
      outcome,
      xp: 0,
      drops: [],
      brokenPartIds: [],
    };
  }

  const random = input.random ?? createSeededRandom(hashString(huntId));
  const drops: MaterialDrop[] = [];

  for (const entry of monster.drops ?? []) {
    const chance = entry.chance < 1 ? Math.min(1, entry.chance + gatherChanceBonus) : entry.chance;
    if (random() < chance) {
      const span = entry.maxQuantity - entry.minQuantity;
      const quantity = entry.minQuantity + Math.floor(random() * (span + 1));
      if (quantity > 0) {
        drops.push({ materialId: entry.materialId, quantity });
      }
    }
  }

  const brokenPartIds: string[] = [];
  if (partBroken && monster.breakPart?.bonusMaterialId !== undefined) {
    drops.push({ materialId: monster.breakPart.bonusMaterialId, quantity: 1 });
    brokenPartIds.push(monster.breakPart.id);
  }

  return {
    huntId,
    monsterId: monster.id,
    mapId: monster.mapId,
    outcome,
    xp: monster.xpReward,
    drops,
    brokenPartIds,
  };
}