import { describe, expect, it } from 'vitest';
import { bottomRightPosition } from '../platform/placement';

describe('bottomRightPosition', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  const windowSize = { width: 720, height: 405 };

  it('anchors to the bottom-right with a gap', () => {
    expect(bottomRightPosition(workArea, windowSize, 12)).toEqual({
      x: 1920 - 720 - 12,
      y: 1040 - 405 - 12,
    });
  });

  it('respects a top taskbar offset', () => {
    const topTaskbar = { x: 0, y: 40, width: 1920, height: 1000 };
    expect(bottomRightPosition(topTaskbar, windowSize, 12).y).toBe(1000 - 405 - 12 + 40);
  });

  it('respects a left taskbar offset', () => {
    const leftTaskbar = { x: 60, y: 0, width: 1860, height: 1080 };
    expect(bottomRightPosition(leftTaskbar, windowSize, 12).x).toBe(60 + 1860 - 720 - 12);
  });

  it('clamps when the window is larger than the work area', () => {
    const tiny = { x: 10, y: 20, width: 500, height: 300 };
    const big = { width: 720, height: 405 };
    const result = bottomRightPosition(tiny, big, 12);

    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
  });

  it('uses a zero gap when requested', () => {
    expect(bottomRightPosition(workArea, windowSize, 0)).toEqual({
      x: 1920 - 720,
      y: 1040 - 405,
    });
  });
});
