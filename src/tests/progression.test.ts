import { describe, it, expect } from 'vitest';
import {
  LEVEL_CAP,
  levelFromXp,
  xpToNextLevel,
  xpProgressInLevel,
  levelsGained,
} from '../game/domain/progression';

describe('progression', () => {
  it('starts at level 1 with 0 xp', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-5)).toBe(1);
  });

  it('reaches level 2 at 100 xp', () => {
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
  });

  it('supports multi-level jumps', () => {
    expect(levelFromXp(250)).toBe(3);
    expect(levelsGained(0, 250)).toBe(2);
  });

  it('caps at LEVEL_CAP', () => {
    expect(levelFromXp(1_000_000)).toBe(LEVEL_CAP);
    expect(xpToNextLevel(1_000_000)).toBe(0);
  });

  it('reports progress within a level', () => {
    expect(xpProgressInLevel(100)).toEqual({ current: 0, needed: 150 });
    expect(xpProgressInLevel(150)).toEqual({ current: 50, needed: 150 });
  });

  it('reports remaining xp to next level', () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(100)).toBe(150);
  });
});