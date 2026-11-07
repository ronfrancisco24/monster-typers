export type HuntStatus =
  | 'ready'
  | 'active'
  | 'paused'
  | 'victory'
  | 'defeat'
  | 'abandoned';

/** A single active typing target. Only one prompt may be active at a time. */
export type Prompt = {
  id: string;
  word: string;
  cursor: number;
  mistyped: boolean;
  kind: 'attack' | 'defense' | 'break';
};

export type PartState = {
  id: string;
  name: string;
  gauge: number;
  threshold: number;
  broken: boolean;
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
  /** Absolute controller-clock ms when the active defense word expires; null otherwise. */
  defenseDeadlineMs: number | null;
  /** Breakable part progress for this hunt, or null if the monster has none. */
  part: PartState | null;
};

/** Renderable events. They describe what happened; they never drive game state. */
export type HuntEvent =
  | { type: 'HUNT_STARTED' }
  | { type: 'MISTYPE'; expected: string }
  | { type: 'PLAYER_ATTACK'; word: string; damage: number; flawless: boolean }
  | { type: 'MONSTER_ATTACK'; damage: number }
  | { type: 'DEFENSE_STARTED'; word: string }
  | { type: 'DEFENSE_SUCCESS'; word: string }
  | { type: 'DEFENSE_FAILED'; damage: number }
  | { type: 'BREAK_STARTED'; partId: string; partName: string; word: string }
  | { type: 'BREAK_PROGRESS'; partId: string; gauge: number; threshold: number }
  | { type: 'PART_BROKEN'; partId: string; partName: string }
  | { type: 'BREAK_LOST'; partId: string }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'VICTORY' }
  | { type: 'DEFEAT' }
  | { type: 'ABANDONED' };

/** Fields of a bundled monster definition. */
export type MonsterDefinition = {
  id: string;
  mapId: string;
  name: string;
  hp: number;
  attackDamage: number;
  attackCadenceMs: number;
  attackWords: readonly string[];
  isBoss?: boolean;
  difficulty?: 'easy' | 'normal' | 'hard';
  defenseWords?: readonly string[];
  /** Fixed defense window in ms; required when defenseWords is non-empty. */
  defenseWindowMs?: number;
  defenseDamageReduction?: number;
  breakPart?: {
    id: string;
    name: string;
    words: readonly string[];
    threshold: number;
    intervalMs: number;
    bonusMaterialId?: string;
  };
  drops?: readonly {
    materialId: string;
    chance: number;
    minQuantity: number;
    maxQuantity: number;
  }[];
};