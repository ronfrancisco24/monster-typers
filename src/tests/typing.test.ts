import { describe, expect, it } from 'vitest';
import { applyTypedCharacter } from '../game/domain/typing';
import type { HuntState } from '../game/domain/types';

const BASE_DAMAGE = 6;

function huntWith(word: string, overrides: Partial<HuntState> = {}): HuntState {
  return {
    huntId: 'hunt-1',
    monsterId: 'monster.test',
    mapId: 'map.test',
    status: 'active',
    playerHp: 30,
    playerMaxHp: 30,
    monsterHp: 100,
    monsterMaxHp: 100,
    combo: 0,
    defenseDeadlineMs: null,
    part: null,
    prompt: { id: 'prompt-1', word, cursor: 0, mistyped: false, kind: 'attack' },
    ...overrides,
  };
}

describe('applyTypedCharacter', () => {
  it('advances the cursor on a correct letter', () => {
    const result = applyTypedCharacter(huntWith('moss'), 'm', BASE_DAMAGE);

    expect(result.outcome).toEqual({ kind: 'correct' });
    expect(result.state.prompt?.cursor).toBe(1);
    expect(result.state.combo).toBe(0);
  });

  it('matches letters case-insensitively', () => {
    const result = applyTypedCharacter(huntWith('moss'), 'M', BASE_DAMAGE);

    expect(result.outcome).toEqual({ kind: 'correct' });
    expect(result.state.prompt?.cursor).toBe(1);
  });

  it('flags a mistype, resets the combo, and keeps word progress', () => {
    const state = huntWith('moss', { combo: 4 });
    const atSecondLetter = applyTypedCharacter(state, 'm', BASE_DAMAGE).state;
    const result = applyTypedCharacter(atSecondLetter, 'x', BASE_DAMAGE);

    expect(result.outcome).toEqual({ kind: 'incorrect', expected: 'o' });
    expect(result.state.combo).toBe(0);
    expect(result.state.prompt?.mistyped).toBe(true);
    expect(result.state.prompt?.cursor).toBe(1);
  });

  it('completes a word with one attack and raises the combo', () => {
    const result = applyTypedCharacter(huntWith('ab'), 'a', BASE_DAMAGE);
    const completed = applyTypedCharacter(result.state, 'b', BASE_DAMAGE);

    expect(completed.outcome).toEqual({
      kind: 'completed',
      word: 'ab',
      flawless: true,
      damage: 8,
    });
    expect(completed.state.monsterHp).toBe(92);
    expect(completed.state.combo).toBe(1);
    expect(completed.state.prompt).toBeNull();
  });

  it('does not treat a mistyped word as flawless or earn combo', () => {
    const mistyped = applyTypedCharacter(huntWith('ab'), 'x', BASE_DAMAGE).state;
    const first = applyTypedCharacter(mistyped, 'a', BASE_DAMAGE);
    const completed = applyTypedCharacter(first.state, 'b', BASE_DAMAGE);

    expect(completed.outcome).toEqual({
      kind: 'completed',
      word: 'ab',
      flawless: false,
      damage: 6,
    });
    expect(completed.state.combo).toBe(0);
  });

  it('applies the existing combo to the completing word', () => {
    const completed = applyTypedCharacter(huntWith('a', { combo: 4 }), 'a', BASE_DAMAGE);

    expect(completed.outcome).toEqual({
      kind: 'completed',
      word: 'a',
      flawless: true,
      damage: 10,
    });
    expect(completed.state.combo).toBe(5);
  });

  it('ends the hunt in victory when monster HP reaches zero', () => {
    const completed = applyTypedCharacter(
      huntWith('a', { monsterHp: 5 }),
      'a',
      BASE_DAMAGE,
    );

    expect(completed.state.status).toBe('victory');
    expect(completed.state.monsterHp).toBe(0);
    expect(completed.state.prompt).toBeNull();
  });

  it('ignores input unless the hunt is active', () => {
    for (const status of ['ready', 'paused', 'victory', 'defeat', 'abandoned'] as const) {
      const state = huntWith('a', { status });
      const result = applyTypedCharacter(state, 'a', BASE_DAMAGE);

      expect(result.outcome).toEqual({ kind: 'ignored' });
      expect(result.state).toBe(state);
    }
  });

  it('ignores non-letter keys and a missing prompt', () => {
    const state = huntWith('a');

    for (const key of [' ', 'Backspace', 'Enter', '1', '-']) {
      expect(applyTypedCharacter(state, key, BASE_DAMAGE)).toEqual({
        state,
        outcome: { kind: 'ignored' },
      });
    }

    const noPrompt = huntWith('a', { prompt: null });
    expect(applyTypedCharacter(noPrompt, 'a', BASE_DAMAGE).outcome).toEqual({
      kind: 'ignored',
    });
  });
});
