import { invoke } from '@tauri-apps/api/core';
import type { GameSave } from './types';

export async function loadGameSave(): Promise<GameSave> {
  return invoke<GameSave>('load_game_save');
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>('set_setting', { key, value });
}