/** Tuning placeholders until playtesting in Phase 01 step 7. */
export const COMBO_BONUS_PER_STACK = 0.1;
export const MAX_COMBO_BONUS = 1;
export const FLAWLESS_DAMAGE_MULTIPLIER = 1.25;

export type DamageInput = {
  baseDamage: number;
  combo: number;
  flawless: boolean;
};

/**
 * Player word damage. `combo` is the streak already earned by previous words,
 * so the first flawless word deals base damage and then raises the combo.
 */
export function calculateDamage({
  baseDamage,
  combo,
  flawless,
}: DamageInput): number {
  const comboBonus = Math.min(Math.max(combo, 0) * COMBO_BONUS_PER_STACK, MAX_COMBO_BONUS);
  const damage = baseDamage * (1 + comboBonus) * (flawless ? FLAWLESS_DAMAGE_MULTIPLIER : 1);
  return Math.max(1, Math.round(damage));
}
