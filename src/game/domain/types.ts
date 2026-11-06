export type HuntStatus =
  | 'ready'
  | 'active'
  | 'paused'
  | 'victory'
  | 'defeat'
  | 'abandoned';

/**
 * A single active typing target. Only one prompt may be active at a time:
 * design.md priority is defense > break > attack.
 */
export type Prompt = {
  id: string;
  word: string;
  cursor: number;
  mistyped: boolean;
};

export type HuntState = {
  huntId: string;
  monsterId: string;
  mapId: string;
  status: HuntStatus;
  playerHp: number;
  playerMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  combo: number;
  prompt: Prompt | null;
};

/**
 * Renderable events. They describe what happened; they never drive game state.
 * Callers pull them with drainEvents() after each action or tick.
 */
export type HuntEvent =
  | { type: 'HUNT_STARTED' }
  | { type: 'MISTYPE'; expected: string }
  | { type: 'PLAYER_ATTACK'; word: string; damage: number; flawless: boolean }
  | { type: 'MONSTER_ATTACK'; damage: number }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'VICTORY' }
  | { type: 'DEFEAT' }
  | { type: 'ABANDONED' };

/** Fields of a bundled monster definition needed by the Phase 01 encounter. */
export type MonsterDefinition = {
  id: string;
  mapId: string;
  name: string;
  hp: number;
  attackDamage: number;
  attackCadenceMs: number;
  attackWords: readonly string[];
};
