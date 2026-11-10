import { describe, it, expect } from 'vitest';
import type { InventoryEntry } from '../persistence/types';
import {
  canCraft,
  missingMaterials,
  mergeStats,
  ownedQuantity,
} from '../game/domain/equipment';
import { equipmentCatalog, getRecipe, recipes } from '../content/equipment';
import { materialSources } from '../content/monsters';

const inventory = (entries: { material_id: string; quantity: number }[]): InventoryEntry[] =>
  entries as InventoryEntry[];

describe('crafting helpers', () => {
  it('reports missing materials', () => {
    const recipe = getRecipe('recipe.mossweave_vest')!;
    const inv = inventory([{ material_id: 'material.moss_gel', quantity: 1 }]);
    const missing = missingMaterials(recipe, inv);
    expect(missing).toEqual([
      { materialId: 'material.moss_gel', quantity: 2 },
      { materialId: 'material.slime_core', quantity: 1 },
    ]);
  });

  it('canCraft is false when materials are missing', () => {
    const recipe = getRecipe('recipe.mossweave_vest')!;
    const inv = inventory([{ material_id: 'material.moss_gel', quantity: 3 }]);
    expect(canCraft(recipe, inv, new Set())).toBe(false);
  });

  it('canCraft is true when all materials are present', () => {
    const recipe = getRecipe('recipe.mossweave_vest')!;
    const inv = inventory([
      { material_id: 'material.moss_gel', quantity: 3 },
      { material_id: 'material.slime_core', quantity: 1 },
    ]);
    expect(canCraft(recipe, inv, new Set())).toBe(true);
  });

  it('canCraft is false when already owned', () => {
    const recipe = getRecipe('recipe.mossweave_vest')!;
    const inv = inventory([
      { material_id: 'material.moss_gel', quantity: 3 },
      { material_id: 'material.slime_core', quantity: 1 },
    ]);
    expect(canCraft(recipe, inv, new Set(['equipment.mossweave_vest']))).toBe(false);
  });

  it('ownedQuantity defaults to 0', () => {
    expect(ownedQuantity([], 'material.moss_gel')).toBe(0);
  });

  it('merges stats across items', () => {
    const items = equipmentCatalog.filter((e) => e.id === 'equipment.mossweave_vest' || e.id === 'equipment.moss_boots');
    const merged = mergeStats(items);
    expect(merged.maxHpBonus).toBe(5);
    expect(merged.attackDamageBonus).toBe(1);
    expect(merged.defenseWindowBonusMs).toBe(300);
  });
});

describe('material sources', () => {
  it('every recipe material has at least one monster source', () => {
    for (const recipe of recipes) {
      for (const req of recipe.requirements) {
        expect(materialSources(req.materialId).length).toBeGreaterThan(0);
      }
    }
  });

  it('sources reference valid monsters and positive quantities', () => {
    for (const src of materialSources('material.moss_gel')) {
      expect(src.monsterId).toMatch(/^monster\./);
      expect(src.minQuantity).toBeGreaterThan(0);
      expect(src.maxQuantity).toBeGreaterThanOrEqual(src.minQuantity);
    }
  });

  it('break bonuses are listed as break sources', () => {
    const sources = materialSources('material.moss_crown');
    expect(sources.some((s) => s.kind === 'break')).toBe(true);
  });
});
