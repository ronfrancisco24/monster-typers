import Phaser from 'phaser';
import manifest from '../../content/retroHuntManifest.json';

type ManifestAnim = {
  base: string;
  size: [number, number];
  anchor: [number, number];
  states: Record<string, { frames: string[]; frameCount: number; sheet: string }>;
  partBreak?: string;
};

type Manifest = {
  animations: Record<string, ManifestAnim>;
  icons: Record<string, { path: string; size: [number, number] }>;
  ui: Record<string, { path: string; size: [number, number]; nineSlice?: unknown }>;
  backgrounds: Record<string, { path: string; size: [number, number] }>;
  tiles: Record<string, { path: string; size: [number, number] }>;
};

const M = manifest as unknown as Manifest;

export function preloadRetroHunt(scene: Phaser.Scene): void {
  for (const [id, anim] of Object.entries(M.animations)) {
    scene.load.image(id, anim.base);
    if (anim.partBreak) scene.load.image(`${id}.part_break`, anim.partBreak);
    for (const [state, info] of Object.entries(anim.states)) {
      scene.load.spritesheet(`${id}.${state}`, info.sheet, {
        frameWidth: anim.size[0],
        frameHeight: anim.size[1],
      });
    }
  }
  for (const [id, icon] of Object.entries(M.icons)) scene.load.image(id, icon.path);
  for (const [id, ui] of Object.entries(M.ui)) scene.load.image(id, ui.path);
  for (const [id, bg] of Object.entries(M.backgrounds)) scene.load.image(`map.${id}`, bg.path);
  for (const [id, tile] of Object.entries(M.tiles)) scene.load.image(`tile.${id}.ground`, tile.path);
}

export function createRetroHuntAnimations(scene: Phaser.Scene): void {
  for (const [id, anim] of Object.entries(M.animations)) {
    for (const [state, info] of Object.entries(anim.states)) {
      const key = `${id}.${state}`;
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(key, { start: 0, end: info.frameCount - 1 }),
        frameRate: state === 'attack' ? 12 : state === 'hit' ? 8 : state === 'defeat' ? 8 : 4,
        repeat: state === 'idle' ? -1 : 0,
      });
    }
  }
}

export function regionForMonster(monsterId: string): 'forest' | 'caverns' | 'ashen' {
  if (monsterId.includes('crystal') || monsterId.includes('stalagmite') || monsterId.includes('gloom') || monsterId.includes('serpent') || monsterId.includes('bat')) return 'caverns';
  if (monsterId.includes('ash') || monsterId.includes('obsidian') || monsterId.includes('ember') || monsterId.includes('wyvern') || monsterId.includes('wisp')) return 'ashen';
  return 'forest';
}

export { M as retroHuntManifest };
