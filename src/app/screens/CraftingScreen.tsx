import { useCallback, useEffect, useState } from 'react';
import { craftEquipment, loadGameSave } from '../../persistence/gameRepository';
import type { GameSave } from '../../persistence/types';
import { equipmentName, getRecipe, recipes, getEquipment, setName } from '../../content/equipment';
import { materialSources } from '../../content/monsters';
import {
  canCraft,
  missingMaterials,
  ownedQuantity,
} from '../../game/domain/equipment';
import { materialName } from '../../content/materials';

interface Props {
  onReturnToHub: () => void;
}

export default function CraftingScreen({ onReturnToHub }: Props) {
  const [save, setSave] = useState<GameSave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    loadGameSave()
      .then((s) => setSave(s))
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCraft = async (recipeId: string) => {
    const recipe = getRecipe(recipeId);
    if (!recipe || !save) return;
    setBusy(recipeId);
    setError(null);
    try {
      const result = await craftEquipment({
        equipment_id: recipe.equipmentId,
        requirements: recipe.requirements.map((r) => ({
          material_id: r.materialId,
          quantity: r.quantity,
        })),
      });
      setSave((prev) =>
        prev
          ? { ...prev, inventory: result.inventory, owned_equipment: result.owned }
          : prev,
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  };

  if (save === null) {
    return (
      <section className="hub">
        <header className="hub__header">
          <h1 className="hub__title">Crafting</h1>
        </header>
        {error !== null && <p className="results__empty">{error}</p>}
        {error === null && <p className="results__empty">Loading…</p>}
        <button type="button" className="btn" onClick={onReturnToHub}>
          Back to Hub
        </button>
      </section>
    );
  }

  const ownedSet = new Set(save.owned_equipment);
  const inventory = save.inventory;

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Crafting</h1>
        <p className="hub__subtitle">Turn gathered materials into armor.</p>
      </header>

      {error !== null && <p className="results__empty">{error}</p>}

      <div className="crafting-list">
        {recipes.map((recipe) => {
          const owned = ownedSet.has(recipe.equipmentId);
          const craftable = canCraft(recipe, inventory, ownedSet);
          const missing = missingMaterials(recipe, inventory);
          const isBusy = busy === recipe.id;
          return (
            <div key={recipe.id} className="crafting-row">
              <div className="crafting-row__head">
                <img
                  className="crafting-row__icon"
                  src={`/sprites/items/${recipe.equipmentId}.png`}
                  alt=""
                  width={24}
                  height={24}
                />
                <span className="crafting-row__name">{equipmentName(recipe.equipmentId)}</span>
                {getEquipment(recipe.equipmentId)?.setId && (
                  <span className="crafting-row__set">{setName(getEquipment(recipe.equipmentId)!.setId!)}</span>
                )}
                {owned && <span className="crafting-row__owned">Crafted</span>}
              </div>
              <ul className="crafting-reqs">
                {recipe.requirements.map((r) => {
                  const have = ownedQuantity(inventory, r.materialId);
                  return (
                    <li key={r.materialId} className={have >= r.quantity ? 'ok' : 'missing'}>
                      {materialName(r.materialId)}: {have}/{r.quantity}
                    </li>
                  );
                })}
              </ul>
              {!owned && missing.length > 0 && (
                <>
                  <p className="crafting-row__missing">
                    Missing: {missing.map((m) => `${materialName(m.materialId)} x${m.quantity}`).join(', ')}
                  </p>
                  <ul className="crafting-row__sources">
                    {missing.map((m) => (
                      <li key={m.materialId}>
                        {materialName(m.materialId)} —{' '}
                        {materialSources(m.materialId)
                          .map((src) =>
                            src.kind === 'break'
                              ? `break the part on ${src.monsterName}`
                              : `${src.monsterName}: ${src.minQuantity === src.maxQuantity ? src.minQuantity : `${src.minQuantity}–${src.maxQuantity}`} per win (${src.chance >= 1 ? 'guaranteed' : `~${Math.round(src.chance * 100)}%`})`,
                          )
                          .join('; ') || 'no known source'}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button
                type="button"
                className="btn btn--primary"
                disabled={!craftable || isBusy}
                onClick={() => void handleCraft(recipe.id)}
              >
                {isBusy ? 'Crafting…' : owned ? 'Already crafted' : 'Craft'}
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="btn" onClick={onReturnToHub}>
        Back to Hub
      </button>
    </section>
  );
}
