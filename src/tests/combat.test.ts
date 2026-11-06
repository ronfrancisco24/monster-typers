import { describe, expect, it } from 'vitest';
import {
  COMBO_BONUS_PER_STACK,
  FLAWLESS_DAMAGE_MULTIPLIER,
  MAX_COMBO_BONUS,
  calculateDamage,
} from '../game/domain/combat';

describe('calculateDamage', () => {
  it('deals base damage at combo zero without a flawless word', () => {
    expect(calculateDamage({ baseDamage: 6, combo: 0, flawless: false })).toBe(6);
  });

  it('adds combo damage per stack', () => {
    expect(calculateDamage({ baseDamage: 6, combo: 4, flawless: false })).toBe(
      Math.round(6 * (1 + 4 * COMBO_BONUS_PER_STACK)),
    );
  });

  it('caps the combo bonus', () => {
    const capped = Math.round(6 * (1 + MAX_COMBO_BONUS));

    expect(calculateDamage({ baseDamage: 6, combo: 50, flawless: false })).toBe(capped);
    expect(calculateDamage({ baseDamage: 6, combo: 500, flawless: false })).toBe(capped);
  });

  it('multiplies flawless words', () => {
    expect(calculateDamage({ baseDamage: 6, combo: 0, flawless: true })).toBe(
      Math.round(6 * FLAWLESS_DAMAGE_MULTIPLIER),
    );
  });

  it('treats a negative combo as zero', () => {
    expect(calculateDamage({ baseDamage: 6, combo: -3, flawless: false })).toBe(6);
  });

  it('never deals less than one damage', () => {
    expect(calculateDamage({ baseDamage: 0, combo: 0, flawless: false })).toBe(1);
  });
});
