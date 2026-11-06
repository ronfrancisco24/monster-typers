import { calculateDamage } from './combat';
import type { HuntState } from './types';

export type TypingOutcome =
  | { kind: 'ignored' }
  | { kind: 'correct' }
  | { kind: 'incorrect'; expected: string }
  | { kind: 'completed'; word: string; flawless: boolean; damage: number };

const LETTER = /^[a-z]$/i;

/**
 * Applies one typed character. Pure: returns the next state and what happened.
 * Non-letters, Backspace, and input outside an active prompt are ignored.
 * A mistype resets the combo but keeps the word's correct progress.
 */
export function applyTypedCharacter(
  state: HuntState,
  rawChar: string,
  baseDamage: number,
): { state: HuntState; outcome: TypingOutcome } {
  const prompt = state.prompt;
  if (state.status !== 'active' || prompt === null || !LETTER.test(rawChar)) {
    return { state, outcome: { kind: 'ignored' } };
  }

  const char = rawChar.toLowerCase();
  const expected = prompt.word.charAt(prompt.cursor).toLowerCase();

  if (char !== expected) {
    return {
      state: { ...state, combo: 0, prompt: { ...prompt, mistyped: true } },
      outcome: { kind: 'incorrect', expected },
    };
  }

  const cursor = prompt.cursor + 1;
  if (cursor < prompt.word.length) {
    return {
      state: { ...state, prompt: { ...prompt, cursor } },
      outcome: { kind: 'correct' },
    };
  }

  const flawless = !prompt.mistyped;
  const damage = calculateDamage({ baseDamage, combo: state.combo, flawless });
  const monsterHp = Math.max(0, state.monsterHp - damage);
  const status = monsterHp === 0 ? 'victory' : state.status;

  return {
    state: {
      ...state,
      status,
      monsterHp,
      combo: flawless ? state.combo + 1 : 0,
      // The controller supplies the next word for the following prompt.
      prompt: null,
    },
    outcome: { kind: 'completed', word: prompt.word, flawless, damage },
  };
}
