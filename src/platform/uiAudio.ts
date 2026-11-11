// Lightweight HTMLAudio-based player for React UI sounds and menu music.
// Reuses the same files as the Phaser audio pack (OGG first, WAV fallback).
const BASE = '/assets/retro-hunt-audio';

const UI_KEYS = ['sfx.ui.hover', 'sfx.ui.select', 'sfx.ui.back', 'sfx.ui.confirm'] as const;
const MUSIC_KEYS = ['bgm.menu_hearth', 'bgm.verdant_forest', 'bgm.crystal_caverns', 'bgm.ashen_wastes', 'bgm.hunt_victory'] as const;

type UiKey = 'hover' | 'select' | 'back' | 'confirm';

const UI_KEY_MAP: Record<UiKey, string> = {
  hover: 'sfx.ui.hover',
  select: 'sfx.ui.select',
  back: 'sfx.ui.back',
  confirm: 'sfx.ui.confirm',
};
type MusicKey = (typeof MUSIC_KEYS)[number];

const cache = new Map<string, HTMLAudioElement>();

function audioPath(key: string): string {
  // manifest paths: audio/sfx/ui/sfx.ui.hover.ogg etc.
  const cat = key.startsWith('bgm.') ? 'bgm' : 'sfx/ui';
  const name = key.split('.').pop()!;
  // build from known layout
  if (key.startsWith('bgm.')) return `${BASE}/audio/bgm/${key}.ogg`;
  return `${BASE}/audio/sfx/ui/${key}.ogg`;
}

function getAudio(key: string): HTMLAudioElement {
  let a = cache.get(key);
  if (!a) {
    a = new Audio(audioPath(key));
    a.preload = 'auto';
    cache.set(key, a);
  }
  return a;
}

let muted = false;
let volume = 0.5;

export function setUiMuted(value: boolean): void {
  muted = value;
}

export function setUiVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
}

export function playUi(key: UiKey): void {
  if (muted) return;
  const fullKey = UI_KEY_MAP[key];
  const a = getAudio(fullKey);
  const recommended = key === 'hover' ? 0.13 : key === 'select' ? 0.32 : key === 'back' ? 0.26 : 0.4;
  a.volume = recommended * volume;
  a.currentTime = 0;
  void a.play().catch(() => {});
}

let currentMusic: HTMLAudioElement | null = null;
let currentMusicKey: string | null = null;

export function playMusic(key: MusicKey): void {
  if (muted) return;
  if (currentMusicKey === key && currentMusic && !currentMusic.paused) return;
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  const a = getAudio(key);
  const recommended = key === 'bgm.hunt_victory' ? 0.38 : 0.28;
  a.volume = recommended * volume;
  a.loop = key !== 'bgm.hunt_victory';
  a.currentTime = 0;
  void a.play().catch(() => {});
  currentMusic = a;
  currentMusicKey = key;
}

export function stopMusic(): void {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
    currentMusicKey = null;
  }
}
