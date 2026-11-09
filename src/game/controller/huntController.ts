import { applyTypedCharacter } from '../domain/typing';
import type { HuntEvent, HuntState, MonsterDefinition, PartState } from '../domain/types';

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

export type HuntStats = {
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  wordsCompleted: number;
  durationMs: number;
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
  /** Call from the render loop; resolves a due monster attack, defense deadline, or break opportunity. */
  tick: () => void;
  /** Snapshot of keystroke/word/duration stats for this hunt. */
  getStats: () => HuntStats;
};

const LETTER = /^[a-z]$/i;

function pickWord(
  pool: readonly string[],
  avoid: string | null,
  random: () => number,
): string {
  const candidates = pool.length > 1 ? pool.filter((word) => word !== avoid) : pool;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  const word = candidates[index];
  if (word === undefined) {
    throw new Error('Monster has no words');
  }
  return word;
}

function hasDefense(monster: MonsterDefinition): boolean {
  return (monster.defenseWords?.length ?? 0) > 0;
}

function hasBreak(monster: MonsterDefinition): boolean {
  return monster.breakPart !== undefined;
}

function makePart(monster: MonsterDefinition): PartState | null {
  const bp = monster.breakPart;
  if (bp === undefined) return null;
  return { id: bp.id, name: bp.name, gauge: 0, threshold: bp.threshold, broken: false };
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
  if (hasDefense(monster) && (monster.defenseWindowMs === undefined || monster.defenseWindowMs <= 0)) {
    throw new Error('Hunt requires a defense window when defense words are present');
  }
  if (hasBreak(monster) && (monster.breakPart!.words.length === 0 || monster.breakPart!.threshold <= 0 || monster.breakPart!.intervalMs <= 0)) {
    throw new Error('Hunt requires valid break part data when a break part is present');
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
    defenseDeadlineMs: null,
    part: makePart(monster),
  };
  let events: HuntEvent[] = [];
  let nextMonsterAttackAtMs = 0;
  let nextBreakAtMs: number | null = null;
  let pausedAtMs: number | null = null;
  let promptCount = 0;
  let lastWord: string | null = null;
  let defenseDeadlineAtMs: number | null = null;
  let correctKeystrokes = 0;
  let incorrectKeystrokes = 0;
  let wordsCompleted = 0;
  let startedAtMs: number | null = null;
  let endedAtMs: number | null = null;

  const emit = (event: HuntEvent) => {
    events.push(event);
  };

  const nextAttackPrompt = (): void => {
    promptCount += 1;
    const word = pickWord(monster.attackWords, lastWord, random);
    lastWord = word;
    state = {
      ...state,
      prompt: { id: `prompt-${promptCount}`, word, cursor: 0, mistyped: false, kind: 'attack' },
      defenseDeadlineMs: null,
    };
  };

  const applyMonsterAttack = (time: number): void => {
    const playerHp = Math.max(0, state.playerHp - monster.attackDamage);
    nextMonsterAttackAtMs = time + monster.attackCadenceMs;
    state = { ...state, playerHp };
    emit({ type: 'MONSTER_ATTACK', damage: monster.attackDamage });

    if (playerHp === 0) {
      endedAtMs = now();
      state = { ...state, status: 'defeat', prompt: null, defenseDeadlineMs: null };
      emit({ type: 'DEFEAT' });
    }
  };

  const resolveDefense = (success: boolean, time: number): void => {
    const word = state.prompt?.word ?? '';
    defenseDeadlineAtMs = null;

    if (success) {
      emit({ type: 'DEFENSE_SUCCESS', word });
    } else {
      const playerHp = Math.max(0, state.playerHp - monster.attackDamage);
      state = { ...state, playerHp };
      emit({ type: 'DEFENSE_FAILED', damage: monster.attackDamage });
      emit({ type: 'MONSTER_ATTACK', damage: monster.attackDamage });

      if (playerHp === 0) {
        endedAtMs = now();
        state = { ...state, status: 'defeat', prompt: null, defenseDeadlineMs: null };
        emit({ type: 'DEFEAT' });
        return;
      }
    }

    nextMonsterAttackAtMs = time + monster.attackCadenceMs;
    nextAttackPrompt();
  };

  const startDefense = (time: number): void => {
    // Defense interrupts an in-progress break opportunity.
    if (state.prompt?.kind === 'break' && state.part !== null && !state.part.broken) {
      emit({ type: 'BREAK_LOST', partId: state.part.id });
      nextBreakAtMs = time + (monster.breakPart?.intervalMs ?? 0);
    }

    if (!hasDefense(monster)) {
      applyMonsterAttack(time);
      return;
    }
    const pool = monster.defenseWords ?? [];
    const word = pickWord(pool, null, random);
    promptCount += 1;
    const windowMs = monster.defenseWindowMs ?? 3000;
    const deadline = time + windowMs;
    defenseDeadlineAtMs = deadline;
    state = {
      ...state,
      prompt: { id: `prompt-${promptCount}`, word, cursor: 0, mistyped: false, kind: 'defense' },
      defenseDeadlineMs: deadline,
    };
    emit({ type: 'DEFENSE_STARTED', word });
  };

  const startBreak = (time: number): void => {
    const bp = monster.breakPart;
    if (bp === undefined || state.part === null || state.part.broken) {
      nextBreakAtMs = null;
      return;
    }
    const word = pickWord(bp.words, null, random);
    promptCount += 1;
    nextBreakAtMs = null;
    state = {
      ...state,
      prompt: { id: `prompt-${promptCount}`, word, cursor: 0, mistyped: false, kind: 'break' },
      defenseDeadlineMs: null,
    };
    emit({ type: 'BREAK_STARTED', partId: bp.id, partName: bp.name, word });
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
      nextBreakAtMs = hasBreak(monster) ? now() + (monster.breakPart?.intervalMs ?? 0) : null;
      startedAtMs = now();
      endedAtMs = null;
      correctKeystrokes = 0;
      incorrectKeystrokes = 0;
      wordsCompleted = 0;
      nextAttackPrompt();
      emit({ type: 'HUNT_STARTED' });
    },

    typeCharacter: (char) => {
      if (state.status !== 'active') {
        return;
      }

      // Defense takes priority over every other prompt.
      if (state.prompt?.kind === 'defense') {
        const prompt = state.prompt;
        if (!LETTER.test(char)) {
          return;
        }
        const c = char.toLowerCase();
        const expected = prompt.word.charAt(prompt.cursor).toLowerCase();

        if (c !== expected) {
          incorrectKeystrokes += 1;
          state = { ...state, combo: 0, prompt: { ...prompt, mistyped: true } };
          emit({ type: 'MISTYPE', expected });
          return;
        }

        correctKeystrokes += 1;
        const cursor = prompt.cursor + 1;
        if (cursor < prompt.word.length) {
          state = { ...state, prompt: { ...prompt, cursor } };
          return;
        }

        wordsCompleted += 1;
        resolveDefense(true, now());
        return;
      }

      // Break prompt: progress the part gauge, never deals damage.
      if (state.prompt?.kind === 'break') {
        const prompt = state.prompt;
        if (!LETTER.test(char)) {
          return;
        }
        const c = char.toLowerCase();
        const expected = prompt.word.charAt(prompt.cursor).toLowerCase();

        if (c !== expected) {
          incorrectKeystrokes += 1;
          state = { ...state, combo: 0, prompt: { ...prompt, mistyped: true } };
          emit({ type: 'MISTYPE', expected });
          return;
        }

        correctKeystrokes += 1;
        const cursor = prompt.cursor + 1;
        if (cursor < prompt.word.length) {
          state = { ...state, prompt: { ...prompt, cursor } };
          return;
        }

        wordsCompleted += 1;
        // Completed the break word.
        const bp = monster.breakPart;
        const part = state.part;
        if (bp !== undefined && part !== null) {
          const newGauge = part.gauge + 1;
          const broken = newGauge >= part.threshold;
          state = {
            ...state,
            part: { ...part, gauge: newGauge, broken },
          };
          emit({ type: 'BREAK_PROGRESS', partId: part.id, gauge: newGauge, threshold: part.threshold });

          if (broken) {
            emit({ type: 'PART_BROKEN', partId: part.id, partName: part.name });
            nextBreakAtMs = null;
          } else {
            nextBreakAtMs = now() + (bp.intervalMs ?? 0);
          }
        }
        nextAttackPrompt();
        return;
      }

      // Attack prompt.
      const result = applyTypedCharacter(state, char, baseAttackDamage);
      if (result.outcome.kind === 'incorrect') {
        incorrectKeystrokes += 1;
      } else if (result.outcome.kind === 'correct' || result.outcome.kind === 'completed') {
        correctKeystrokes += 1;
      }
      if (result.outcome.kind === 'completed') {
        wordsCompleted += 1;
      }
      state = result.state;

      switch (result.outcome.kind) {
        case 'incorrect':
          emit({ type: 'MISTYPE', expected: result.outcome.expected });
          return;
        case 'completed': {
          const { word, damage, flawless } = result.outcome;
          emit({ type: 'PLAYER_ATTACK', word, damage, flawless });
          if (state.status === 'victory') {
            endedAtMs = now();
            emit({ type: 'VICTORY' });
            return;
          }
          nextAttackPrompt();
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
      const pausedDuration = now() - pausedAtMs;
      nextMonsterAttackAtMs += pausedDuration;
      if (defenseDeadlineAtMs !== null) {
        defenseDeadlineAtMs += pausedDuration;
        state = { ...state, defenseDeadlineMs: defenseDeadlineAtMs };
      }
      if (nextBreakAtMs !== null) {
        nextBreakAtMs += pausedDuration;
      }
      pausedAtMs = null;
      state = { ...state, status: 'active' };
      emit({ type: 'RESUMED' });
    },

    abandon: () => {
      if (state.status !== 'active' && state.status !== 'paused') {
        return;
      }
      pausedAtMs = null;
      defenseDeadlineAtMs = null;
      nextBreakAtMs = null;
      endedAtMs = now();
      state = { ...state, status: 'abandoned', prompt: null, defenseDeadlineMs: null };
      emit({ type: 'ABANDONED' });
    },

    tick: () => {
      if (state.status !== 'active') {
        return;
      }
      const time = now();

      // Defense phase: resolve on deadline.
      if (state.prompt?.kind === 'defense' && defenseDeadlineAtMs !== null) {
        if (time < defenseDeadlineAtMs) {
          return;
        }
        resolveDefense(false, time);
        return;
      }

      // Monster attack cadence takes priority over break opportunities.
      if (time >= nextMonsterAttackAtMs) {
        startDefense(time);
        return;
      }

      // Break opportunity, only when no defense is due and part is unbroken.
      if (
        hasBreak(monster) &&
        state.part !== null &&
        !state.part.broken &&
        nextBreakAtMs !== null &&
        time >= nextBreakAtMs &&
        state.prompt?.kind !== 'break'
      ) {
        startBreak(time);
        return;
      }
    },

    getStats: () => {
      const end = endedAtMs ?? now();
      const start = startedAtMs ?? end;
      return {
        correctKeystrokes,
        incorrectKeystrokes,
        wordsCompleted,
        durationMs: Math.max(0, Math.round(end - start)),
      };
    },
  };
}