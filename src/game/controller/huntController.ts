import { applyTypedCharacter } from '../domain/typing';
import type { HuntEvent, HuntState, MonsterDefinition } from '../domain/types';

export type HuntControllerOptions = {
  huntId: string;
  monster: MonsterDefinition;
  playerMaxHp: number;
  baseAttackDamage: number;
  /** Monotonic milliseconds. Wall-clock time is never used for scheduling. */
  now: () => number;
  /** Injectable random source in [0, 1); seed it in tests and replays. */
  random: () => number;
};

export type HuntController = {
  getState: () => HuntState;
  /** Returns and clears the events since the previous drain. */
  drainEvents: () => HuntEvent[];
  start: () => void;
  typeCharacter: (char: string) => void;
  pause: () => void;
  resume: () => void;
  abandon: () => void;
  /** Call from the render loop; resolves a due monster attack. */
  tick: () => void;
};

function pickWord(
  pool: readonly string[],
  avoid: string | null,
  random: () => number,
): string {
  const candidates = pool.length > 1 ? pool.filter((word) => word !== avoid) : pool;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  const word = candidates[index];
  if (word === undefined) {
    throw new Error('Monster has no attack words');
  }
  return word;
}

/**
 * Owns the one authoritative encounter timeline. Phaser and React only read
 * state and render events; they never apply damage themselves.
 */
export function createHuntController(options: HuntControllerOptions): HuntController {
  const { huntId, monster, playerMaxHp, baseAttackDamage, now, random } = options;

  if (monster.hp <= 0 || playerMaxHp <= 0) {
    throw new Error('Hunt requires positive player and monster health');
  }
  if (monster.attackCadenceMs <= 0 || monster.attackWords.length === 0) {
    throw new Error('Hunt requires an attack cadence and at least one attack word');
  }

  let state: HuntState = {
    huntId,
    monsterId: monster.id,
    mapId: monster.mapId,
    status: 'ready',
    playerHp: playerMaxHp,
    playerMaxHp,
    monsterHp: monster.hp,
    monsterMaxHp: monster.hp,
    combo: 0,
    prompt: null,
  };
  let events: HuntEvent[] = [];
  let nextMonsterAttackAtMs = 0;
  let pausedAtMs: number | null = null;
  let promptCount = 0;
  let lastWord: string | null = null;

  const emit = (event: HuntEvent) => {
    events.push(event);
  };

  const nextPrompt = (): void => {
    promptCount += 1;
    const word = pickWord(monster.attackWords, lastWord, random);
    lastWord = word;
    state = {
      ...state,
      prompt: { id: `prompt-${promptCount}`, word, cursor: 0, mistyped: false },
    };
  };

  return {
    getState: () => state,

    drainEvents: () => {
      const drained = events;
      events = [];
      return drained;
    },

    start: () => {
      if (state.status !== 'ready') {
        return;
      }
      state = { ...state, status: 'active' };
      nextMonsterAttackAtMs = now() + monster.attackCadenceMs;
      nextPrompt();
      emit({ type: 'HUNT_STARTED' });
    },

    typeCharacter: (char) => {
      if (state.status !== 'active') {
        return;
      }
      const result = applyTypedCharacter(state, char, baseAttackDamage);
      state = result.state;

      switch (result.outcome.kind) {
        case 'incorrect':
          emit({ type: 'MISTYPE', expected: result.outcome.expected });
          return;
        case 'completed': {
          const { word, damage, flawless } = result.outcome;
          emit({ type: 'PLAYER_ATTACK', word, damage, flawless });
          if (state.status === 'victory') {
            emit({ type: 'VICTORY' });
            return;
          }
          nextPrompt();
          return;
        }
        case 'correct':
        case 'ignored':
          return;
      }
    },

    pause: () => {
      if (state.status !== 'active') {
        return;
      }
      pausedAtMs = now();
      state = { ...state, status: 'paused' };
      emit({ type: 'PAUSED' });
    },

    resume: () => {
      if (state.status !== 'paused' || pausedAtMs === null) {
        return;
      }
      // Shift the deadline by the paused duration so no time is silently charged.
      nextMonsterAttackAtMs += now() - pausedAtMs;
      pausedAtMs = null;
      state = { ...state, status: 'active' };
      emit({ type: 'RESUMED' });
    },

    abandon: () => {
      if (state.status !== 'active' && state.status !== 'paused') {
        return;
      }
      pausedAtMs = null;
      state = { ...state, status: 'abandoned', prompt: null };
      emit({ type: 'ABANDONED' });
    },

    tick: () => {
      if (state.status !== 'active') {
        return;
      }
      const time = now();
      if (time < nextMonsterAttackAtMs) {
        return;
      }

      const playerHp = Math.max(0, state.playerHp - monster.attackDamage);
      // Reschedule from now, so a long stall never queues several unseen hits.
      nextMonsterAttackAtMs = time + monster.attackCadenceMs;
      state = { ...state, playerHp };
      emit({ type: 'MONSTER_ATTACK', damage: monster.attackDamage });

      if (playerHp === 0) {
        state = { ...state, status: 'defeat', prompt: null };
        emit({ type: 'DEFEAT' });
      }
    },
  };
}
