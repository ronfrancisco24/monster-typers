import { useCallback, useEffect, useState } from 'react';
import { craftEquipment, loadGameSave } from '../../persistence/gameRepository';
import type { GameSave } from '../../persistence/types';
import { equipmentName, getEquipment, getRecipe, recipes, setName } from '../../content/equipment';
import { materialSources } from '../../content/monsters';
import { canCraft, missingMaterials, ownedQuantity } from '../../game/domain/equipment';
import { materialName } from '../../content/materials';
import MaterialIcon from '../components/MaterialIcon';
import ScreenShell from '../components/ScreenShell';

function sourceText(materialId: string): string {
  return (
    materialSources(materialId)
      .map((source) =>
        source.kind === 'break'
          ? `break the part on ${source.monsterName}`
          : `${source.monsterName}: ${
              source.minQuantity === source.maxQuantity
                ? source.minQuantity
                : `${source.minQuantity}–${source.maxQuantity}`
            } per win (${source.chance >= 1 ? 'guaranteed' : `~${Math.round(source.chance * 100)}%`})`,
      )
      .join('; ') || 'no known source'
  );
}

export default function CraftingScreen() {
  const [save, setSave] = useState<GameSave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    loadGameSave()
      .then((nextSave) => setSave(nextSave))
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCraft(recipeId: string) {
    const recipe = getRecipe(recipeId);
    if (recipe === undefined || save === null) return;
    setBusy(recipeId);
    setError(null);
    try {
      const result = await craftEquipment({
        equipment_id: recipe.equipmentId,
        requirements: recipe.requirements.map((requirement) => ({
          material_id: requirement.materialId,
          quantity: requirement.quantity,
        })),
      });
      setSave((current) =>
        current === null ? current : { ...current, inventory: result.inventory, owned_equipment: result.owned },
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  if (save === null) {
    return (
      <ScreenShell title="Crafting" subtitle="Turn gathered materials into armor.">
        {error === null ? <p className="empty-state">Loading…</p> : <p className="alert">{error}</p>}
      </ScreenShell>
    );
  }

  const ownedSet = new Set(save.owned_equipment);
  const inventory = save.inventory;
  const craftableCount = recipes.filter((recipe) => canCraft(recipe, inventory, ownedSet)).length;

  return (
    <ScreenShell
      title="Crafting"
      subtitle="Turn gathered materials into armor."
      meta={<span className="meta-chip">{craftableCount} craftable</span>}
    >
      {error !== null && <p className="alert">{error}</p>}

      <div className="recipe-grid">
        {recipes.map((recipe) => {
          const owned = ownedSet.has(recipe.equipmentId);
          const craftable = canCraft(recipe, inventory, ownedSet);
          const missing = missingMaterials(recipe, inventory);
          const isBusy = busy === recipe.id;
          const setId = getEquipment(recipe.equipmentId)?.setId;
          return (
            <article
              key={recipe.id}
              className={`recipe-card${owned ? ' recipe-card--owned' : ''}${
                craftable ? ' recipe-card--craftable' : ''
              }`}
            >
              <div className="recipe-card__head">
                <img
                  className="recipe-card__icon"
                  src={`/sprites/items/${recipe.equipmentId}.png`}
                  alt=""
                  width={32}
                  height={32}
                />
                <div className="recipe-card__id">
                  <h3 className="recipe-card__name">{equipmentName(recipe.equipmentId)}</h3>
                  {setId !== undefined && <span className="recipe-card__set">{setName(setId)}</span>}
                </div>
                {owned && <span className="badge">Crafted</span>}
              </div>

              <ul className="recipe-reqs">
                {recipe.requirements.map((requirement) => {
                  const have = ownedQuantity(inventory, requirement.materialId);
                  const ok = have >= requirement.quantity;
                  return (
                    <li key={requirement.materialId} className={ok ? 'ok' : 'missing'}>
                      <MaterialIcon id={requirement.materialId} size={16} />
                      <span className="recipe-reqs__name">{materialName(requirement.materialId)}</span>
                      <span className="recipe-reqs__count">
                        {ok ? '✓' : '✗'} {have}/{requirement.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {!owned && missing.length > 0 && (
                <details className="recipe-sources">
                  <summary>Where to find</summary>
                  <ul>
                    {missing.map((material) => (
                      <li key={material.materialId}>
                        {materialName(material.materialId)}: {sourceText(material.materialId)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <button
                type="button"
                className="btn btn--primary recipe-card__craft"
                disabled={!craftable || isBusy}
                onClick={() => void handleCraft(recipe.id)}
              >
                {isBusy ? 'Crafting…' : owned ? 'Already crafted' : 'Craft'}
              </button>
            </article>
          );
        })}
      </div>
    </ScreenShell>
  );
}
