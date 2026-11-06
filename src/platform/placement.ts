export type Rect = { x: number; y: number; width: number; height: number };

export type WindowSize = { width: number; height: number };

export type Point = { x: number; y: number };

/**
 * Anchors a window to the bottom-right of a work area and clamps it inside.
 * The work area already excludes the taskbar, so this works for bottom, top,
 * left, and right taskbar placements.
 */
export function bottomRightPosition(
  workArea: Rect,
  windowSize: WindowSize,
  gap = 12,
): Point {
  let x: number;
  let y: number;

  if (windowSize.width >= workArea.width) {
    x = workArea.x;
  } else {
    x = workArea.x + workArea.width - windowSize.width - gap;
    if (x < workArea.x) x = workArea.x;
    if (x + windowSize.width > workArea.x + workArea.width) {
      x = workArea.x + workArea.width - windowSize.width;
    }
  }

  if (windowSize.height >= workArea.height) {
    y = workArea.y;
  } else {
    y = workArea.y + workArea.height - windowSize.height - gap;
    if (y < workArea.y) y = workArea.y;
    if (y + windowSize.height > workArea.y + workArea.height) {
      y = workArea.y + workArea.height - windowSize.height;
    }
  }

  return { x, y };
}
