// Pure TypeScript leveling rules. Rust persists; it does not own the curve.

export const LEVEL_CAP = 10;

// Cumulative XP required to reach each level. Index == level. Level 1 needs 0.
export const XP_THRESHOLDS: readonly number[] = [
  0, // 0 (unused)
  0, // 1
  100, // 2
  250, // 3
  450, // 4
  700, // 5
  1000, // 6
  1350, // 7
  1750, // 8
  2200, // 9
  2700, // 10 (cap)
];

export function levelFromXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  for (let l = LEVEL_CAP; l >= 1; l--) {
    if (xp >= (XP_THRESHOLDS[l] ?? 0)) {
      level = l;
      break;
    }
  }
  return Math.min(level, LEVEL_CAP);
}

export function xpToNextLevel(totalXp: number): number {
  const level = levelFromXp(totalXp);
  if (level >= LEVEL_CAP) return 0;
  return Math.max(0, (XP_THRESHOLDS[level + 1] ?? 0) - Math.max(0, Math.floor(totalXp)));
}

export function xpProgressInLevel(totalXp: number): { current: number; needed: number } {
  const level = levelFromXp(totalXp);
  if (level >= LEVEL_CAP) return { current: 0, needed: 0 };
  const current = Math.max(0, Math.floor(totalXp)) - (XP_THRESHOLDS[level] ?? 0);
  const needed = (XP_THRESHOLDS[level + 1] ?? 0) - (XP_THRESHOLDS[level] ?? 0);
  return { current, needed };
}

export function levelsGained(oldXp: number, newXp: number): number {
  return Math.max(0, levelFromXp(newXp) - levelFromXp(oldXp));
}