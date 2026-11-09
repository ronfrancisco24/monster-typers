import { useEffect, useState } from 'react';
import { loadGameSave } from '../../persistence/gameRepository';
import type { InventoryEntry } from '../../persistence/types';
import { materialName } from '../../content/materials';

interface Props {
  onReturnToHub: () => void;
}

export default function InventoryScreen({ onReturnToHub }: Props) {
  const [inventory, setInventory] = useState<InventoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGameSave()
      .then((save) => setInventory(save.inventory))
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Inventory</h1>
        <p className="hub__subtitle">Stored materials from completed hunts.</p>
      </header>

      {error !== null && <p className="results__empty">{error}</p>}

      {inventory === null && error === null && (
        <p className="results__empty">Loading…</p>
      )}

      {inventory !== null && inventory.length === 0 && (
        <p className="results__empty">No materials yet. Complete a hunt to earn some.</p>
      )}

      {inventory !== null && inventory.length > 0 && (
        <div className="inventory-list">
          {inventory.map((entry) => (
            <div key={entry.material_id} className="inventory-row">
              <span className="inventory-row__name">{materialName(entry.material_id)}</span>
              <span className="inventory-row__qty">x{entry.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="btn" onClick={onReturnToHub}>
        Back to Hub
      </button>
    </section>
  );
}