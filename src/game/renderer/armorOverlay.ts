import Phaser from 'phaser';

export interface ArmorOverlayLayer {
  setEquipment(loadout: Record<string, string>): void;
  sync(fullSetTint: number | null): void;
  destroy(): void;
}

const SLOTS = ['head', 'chest', 'feet'] as const;

export function createArmorOverlayLayer(scene: Phaser.Scene, hunter: Phaser.GameObjects.Sprite): ArmorOverlayLayer {
  type OverlayMap = { head: Phaser.GameObjects.Image; chest: Phaser.GameObjects.Image; feet: Phaser.GameObjects.Image };
  const overlays = {} as OverlayMap;
  for (const slot of SLOTS) {
    overlays[slot] = scene.add
      .image(hunter.x, hunter.y, 'hunter.default')
      .setOrigin(hunter.originX, hunter.originY)
      .setVisible(false)
      .setData('equipped', false);
  }

  function setEquipment(loadout: Record<string, string>): void {
    for (const slot of SLOTS) {
      const raw = loadout?.[slot];
      const equipmentId = typeof raw === 'string' ? raw : (raw as { id?: string } | undefined)?.id;
      const textureKey = equipmentId ? `hunter.overlay.${slot}.${equipmentId}` : null;
      const overlay = overlays[slot];
      if (textureKey && scene.textures.exists(textureKey)) {
        overlay.setTexture(textureKey).setData('equipped', true);
      } else {
        overlay.setVisible(false).setData('equipped', false);
      }
    }
  }

  function sync(fullSetTint: number | null): void {
    for (const slot of SLOTS) {
      const overlay = overlays[slot];
      overlay.setPosition(Math.round(hunter.x), Math.round(hunter.y));
      overlay.setOrigin(hunter.originX, hunter.originY);
      overlay.setScale(hunter.scaleX, hunter.scaleY);
      overlay.setFlip(hunter.flipX, hunter.flipY);
      overlay.setRotation(hunter.rotation);
      overlay.setDepth(hunter.depth + 1);
      overlay.setAlpha(hunter.alpha);
      overlay.setVisible(hunter.visible && overlay.getData('equipped') === true);
      if (fullSetTint === null) overlay.clearTint();
      else overlay.setTint(fullSetTint);
    }
  }

  function destroy(): void {
    for (const slot of SLOTS) overlays[slot].destroy();
  }

  return { setEquipment, sync, destroy };
}
