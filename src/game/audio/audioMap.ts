import manifest from '../../content/retroHuntAudioManifest.json';

export type AudioAsset = {
  key: string;
  category: string;
  type: 'sfx' | 'bgm';
  ogg: string;
  wav: string;
  recommendedVolume: number;
  loop: boolean;
  usage?: string | undefined;
};

const M = manifest as { assets: AudioAsset[]; assetRoot: string };

export const RETRO_HUNT_AUDIO: AudioAsset[] = M.assets.map((a) => ({
  key: a.key,
  category: a.category,
  type: a.type as 'sfx' | 'bgm',
  ogg: a.ogg,
  wav: a.wav,
  recommendedVolume: a.recommendedVolume,
  loop: a.loop,
  usage: a.usage,
}));

export function findRetroHuntAudio(key: string): AudioAsset | null {
  return RETRO_HUNT_AUDIO.find((a) => a.key === key) ?? null;
}

export function preloadRetroHuntAudio(scene: Phaser.Scene, basePath = '/assets/retro-hunt-audio'): void {
  const prefix = basePath.replace(/\/$/, '');
  for (const asset of RETRO_HUNT_AUDIO) {
    if (scene.cache.audio.exists(asset.key)) continue;
    scene.load.audio(asset.key, [`${prefix}/${asset.ogg}`, `${prefix}/${asset.wav}`]);
  }
}
