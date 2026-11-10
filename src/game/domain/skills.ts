// Pure TypeScript skill catalog. Effects are applied by callers; Rust persists ranks.

export type SkillBranch = 'offense' | 'defense' | 'gathering';

export type SkillEffect =
  | { type: 'attackDamageBonus'; amount: number }
  | { type: 'defenseWindowBonusMs'; amount: number }
  | { type: 'rareDropChanceBonus'; amount: number };

export type SkillRank = {
  rank: number;
  cost: number;
  effect: SkillEffect;
  description: string;
};

export type SkillDefinition = {
  id: string;
  name: string;
  branch: SkillBranch;
  maxRank: number;
  ranks: readonly SkillRank[];
};

export const SKILLS: readonly SkillDefinition[] = [
  {
    id: 'skill.power_strike',
    name: 'Power Strike',
    branch: 'offense',
    maxRank: 3,
    ranks: [
      { rank: 1, cost: 1, effect: { type: 'attackDamageBonus', amount: 1 }, description: '+1 attack damage' },
      { rank: 2, cost: 1, effect: { type: 'attackDamageBonus', amount: 1 }, description: '+1 attack damage' },
      { rank: 3, cost: 2, effect: { type: 'attackDamageBonus', amount: 2 }, description: '+2 attack damage' },
    ],
  },
  {
    id: 'skill.quick_reflexes',
    name: 'Quick Reflexes',
    branch: 'defense',
    maxRank: 3,
    ranks: [
      { rank: 1, cost: 1, effect: { type: 'defenseWindowBonusMs', amount: 300 }, description: '+0.3s defense window' },
      { rank: 2, cost: 1, effect: { type: 'defenseWindowBonusMs', amount: 300 }, description: '+0.3s defense window' },
      { rank: 3, cost: 2, effect: { type: 'defenseWindowBonusMs', amount: 500 }, description: '+0.5s defense window' },
    ],
  },
  {
    id: 'skill.lucky_hands',
    name: 'Lucky Hands',
    branch: 'gathering',
    maxRank: 3,
    ranks: [
      { rank: 1, cost: 1, effect: { type: 'rareDropChanceBonus', amount: 0.15 }, description: '+15% rare drop chance' },
      { rank: 2, cost: 1, effect: { type: 'rareDropChanceBonus', amount: 0.15 }, description: '+15% rare drop chance' },
      { rank: 3, cost: 2, effect: { type: 'rareDropChanceBonus', amount: 0.2 }, description: '+20% rare drop chance' },
    ],
  },
];

export function getSkill(id: string): SkillDefinition | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function currentRank(ranks: Record<string, number>, skillId: string): number {
  return ranks[skillId] ?? 0;
}

export function nextRankDef(skill: SkillDefinition, ranks: Record<string, number>): SkillRank | null {
  const r = currentRank(ranks, skill.id);
  if (r >= skill.maxRank) return null;
  return skill.ranks[r] ?? null;
}

export function isMaxed(skill: SkillDefinition, ranks: Record<string, number>): boolean {
  return currentRank(ranks, skill.id) >= skill.maxRank;
}

export function derivedAttackBonus(ranks: Record<string, number>): number {
  let total = 0;
  for (const skill of SKILLS) {
    if (skill.branch !== 'offense') continue;
    const r = currentRank(ranks, skill.id);
    for (let i = 0; i < r; i++) {
      const rank = skill.ranks[i];
      if (rank && rank.effect.type === 'attackDamageBonus') total += rank.effect.amount;
    }
  }
  return total;
}

export function derivedDefenseWindowBonusMs(ranks: Record<string, number>): number {
  let total = 0;
  for (const skill of SKILLS) {
    if (skill.branch !== 'defense') continue;
    const r = currentRank(ranks, skill.id);
    for (let i = 0; i < r; i++) {
      const rank = skill.ranks[i];
      if (rank && rank.effect.type === 'defenseWindowBonusMs') total += rank.effect.amount;
    }
  }
  return total;
}

export function derivedRareDropChanceBonus(ranks: Record<string, number>): number {
  let total = 0;
  for (const skill of SKILLS) {
    if (skill.branch !== 'gathering') continue;
    const r = currentRank(ranks, skill.id);
    for (let i = 0; i < r; i++) {
      const rank = skill.ranks[i];
      if (rank && rank.effect.type === 'rareDropChanceBonus') total += rank.effect.amount;
    }
  }
  return total;
}