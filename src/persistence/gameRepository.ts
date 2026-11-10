import { invoke } from '@tauri-apps/api/core';
import type { CraftEquipmentInput, FinalizeHuntInput, FinalizedHunt, GameSave, InventoryEntry } from './types';

export async function loadGameSave(): Promise<GameSave> {
  return invoke<GameSave>('load_game_save');
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>('set_setting', { key, value });
}

export async function finalizeHunt(input: FinalizeHuntInput): Promise<FinalizedHunt> {
  return invoke<FinalizedHunt>('finalize_hunt', { input });
}

export async function purchaseSkillRank(skillId: string, cost: number): Promise<{ points: number; ranks: Record<string, number> }> {
  const result = await invoke<[number, Record<string, number>]>('purchase_skill_rank', { skillId, cost });
  return { points: result[0], ranks: result[1] };
}

export async function reconcileProgression(hunterLevel: number, unspentSkillPoints: number): Promise<void> {
  await invoke<[number, number]>('reconcile_progression', { hunterLevel, unspentSkillPoints });
}

export async function setEquipment(slot: string, equipmentId: string | null): Promise<Record<string, string>> {
  return invoke<Record<string, string>>('set_equipment', { slot, equipmentId });
}

export async function unlockMap(mapId: string): Promise<void> {
  await invoke<void>('unlock_map', { mapId });
}

export async function craftEquipment(input: CraftEquipmentInput): Promise<{ inventory: InventoryEntry[]; owned: string[] }> {
  const result = await invoke<[InventoryEntry[], string[]]>('craft_equipment', { input });
  return { inventory: result[0], owned: result[1] };
}