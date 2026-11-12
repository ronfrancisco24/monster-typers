import { useEffect, useState } from 'react';
import { getMaterial, materialName, type MaterialRarity } from '../../content/materials';
import type { InventoryEntry } from '../../persistence/types';
import { loadGameSave } from '../../persistence/gameRepository';
import { playUi } from '../../platform/uiAudio';
import MaterialIcon from '../components/MaterialIcon';
import ScreenShell from '../components/ScreenShell';

interface Props {
  onGoToMonsters: () => void;
}

const RARITY_ORDER: Record<MaterialRarity, number> = { boss: 0, rare: 1, common: 2 };

export default function InventoryScreen({ onGoToMonsters }: Props) {
  const [inventory, setInventory] = useState<InventoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGameSave()
      .then((save) => setInventory(save.inventory))
      .catch((err) => setError(String(err)));
  }, []);

  if (error !== null) {
    return (
      <ScreenShell title="Inventory" subtitle="Materials from completed hunts.">
        <p className="alert">{error}</p>
      </ScreenShell>
    );
  }

  if (inventory === null) {
    return (
      <ScreenShell title="Inventory" subtitle="Materials from completed hunts.">
        <p className="empty-state">Loading…</p>
      </ScreenShell>
    );
  }

  const sorted = [...inventory].sort((a, b) => {
    const rarityA = getMaterial(a.material_id)?.rarity ?? 'common';
    const rarityB = getMaterial(b.material_id)?.rarity ?? 'common';
    return (
      RARITY_ORDER[rarityA] - RARITY_ORDER[rarityB] ||
      materialName(a.material_id).localeCompare(materialName(b.material_id))
    );
  });
  const total = inventory.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <ScreenShell
      title="Inventory"
      subtitle="Materials from completed hunts."
      meta={
        <span className="meta-chip">
          {inventory.length} types · {total} total
        </span>
      }
    >
      {inventory.length === 0 ? (
        <div className="empty-state">
          <MaterialIcon id="material.moss_gel" size={32} />
          <p>No materials yet. Complete a hunt to earn some.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              playUi('select');
              onGoToMonsters();
            }}
          >
            Go hunt
          </button>
        </div>
      ) : (
        <div className="inv-grid">
          {sorted.map((entry) => {
            const rarity = getMaterial(entry.material_id)?.rarity ?? 'common';
            return (
              <div key={entry.material_id} className={`mat-tile mat-tile--${rarity}`}>
                <MaterialIcon id={entry.material_id} size={24} />
                <div className="mat-tile__body">
                  <span className="mat-tile__name">{materialName(entry.material_id)}</span>
                  <span className="mat-tile__rarity">{rarity}</span>
                </div>
                <span className="mat-tile__qty">×{entry.quantity}</span>
              </div>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}
