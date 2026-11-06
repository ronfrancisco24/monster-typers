import { PhysicalPosition, currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '@tauri-apps/api/core';
import { bottomRightPosition } from './placement';

/**
 * Moves the window above the taskbar and reveals it. No-op outside Tauri
 * (for plain Vite development).
 */
export async function placeWindow(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  const monitor = await currentMonitor();
  if (monitor === null) return;

  const size = await win.innerSize();
  const pos = bottomRightPosition(
    {
      x: monitor.workArea.position.x,
      y: monitor.workArea.position.y,
      width: monitor.workArea.size.width,
      height: monitor.workArea.size.height,
    },
    { width: size.width, height: size.height },
    12,
  );

  await win.setPosition(new PhysicalPosition(pos.x, pos.y));
  await win.show();
}
