import { useCallback, useEffect, useState } from 'react';
import { loadGameSave, setEquipment } from '../../persistence/gameRepository';
import type { GameSave } from '../../persistence/types';
import { equipmentCatalog, equipmentForLoadout, equipmentName, equipmentSets, getEquipment, getSet, slotIconForSet } from '../../content/equipment';
import { deriveHunterStats } from '../../game/domain/stats';
import { equipItem, unequipSlot } from '../../game/domain/equipment';
import { hunterDefinition } from '../../content/hunter';

interface Props {
  onReturnToHub: () => void;
}

const BASE = { maxHp: hunterDefinition.baseMaxHp, attackDamage: hunterDefinition.baseAttackDamage };

function statText(item: { stats: { maxHpBonus?: number; attackDamageBonus?: number; defenseWindowBonusMs?: number; rareDropChanceBonus?: number } }): string {
  const parts: string[] = [];
  if (item.stats.maxHpBonus) parts.push(`+${item.stats.maxHpBonus} max HP`);
  if (item.stats.attackDamageBonus) parts.push(`+${item.stats.attackDamageBonus} attack`);
  if (item.stats.defenseWindowBonusMs) parts.push(`+${item.stats.defenseWindowBonusMs}ms defense`);
  if (item.stats.rareDropChanceBonus) parts.push(`+${Math.round(item.stats.rareDropChanceBonus * 100)}% rare drop`);
  return parts.join(', ') || 'No stat changes';
}

export default function EquipmentScreen({ onReturnToHub }: Props) {
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

  const handleEquip = async (itemId: string) => {
    const item = getEquipment(itemId);
    if (!item || !save) return;
    const next = equipItem(save.equipment_loadout, item);
    if (next === null) {
      setError('That item is already equipped in another slot.');
      return;
    }
    setBusy(itemId);
    setError(null);
    try {
      const loadout = await setEquipment(item.slot, itemId);
      setSave({ ...save, equipment_loadout: loadout });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  };

  const handleUnequip = async (slot: string) => {
    if (!save) return;
    setBusy(slot);
    setError(null);
    try {
      const loadout = await setEquipment(slot, null);
      setSave({ ...save, equipment_loadout: loadout });
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
          <h1 className="hub__title">Equipment</h1>
        </header>
        {error !== null && <p className="results__empty">{error}</p>}
        {error === null && <p className="results__empty">Loading…</p>}
        <button type="button" className="btn" onClick={onReturnToHub}>
          Back to Hub
        </button>
      </section>
    );
  }

  const loadout = save.equipment_loadout;
  const equippedItems = equipmentForLoadout(loadout);
  const stats = deriveHunterStats(BASE, equippedItems, save.skill_ranks, equipmentSets);
  const mossbound = getSet('set.mossbound');
  const mossboundCount = equippedItems.filter((i) => i.setId === 'set.mossbound').length;
  const ownedIds = new Set(save.owned_equipment);
  const ownedItems = equipmentCatalog.filter((e) => ownedIds.has(e.id));

  const slots: Array<'head' | 'chest' | 'feet'> = ['head', 'chest', 'feet'];

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Equipment</h1>
        <p className="hub__subtitle">Equip crafted armor to change your stats.</p>
      </header>

      {error !== null && <p className="results__empty">{error}</p>}

      <div className="equipment-slots">
        {slots.map((slot) => {
          const equippedId = loadout[slot];
          const equipped = equippedId ? getEquipment(equippedId) : undefined;
          return (
            <div key={slot} className="equipment-slot">
              <img
                className="equipment-slot__icon"
                src={`/sprites/ui/${slotIconForSet(equipped?.setId)}.png`}
                alt=""
                width={16}
                height={16}
              />
              <span className="equipment-slot__label">{slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
              {equipped ? (
                <>
                  <img
                    className="equipment-slot__item-icon"
                    src={`/sprites/items/${equipped.id}.png`}
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="equipment-slot__item">{equipped.name}</span>
                  <span className="equipment-slot__stats">{statText(equipped)}</span>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy === slot}
                    onClick={() => void handleUnequip(slot)}
                  >
                    {busy === slot ? 'Working…' : 'Unequip'}
                  </button>
                </>
              ) : (
                <span className="equipment-slot__empty">Empty</span>
              )}
            </div>
          );
        })}
      </div>

      {mossbound && (
        <div className="equipment-set">
          <h2>{mossbound.name} Set ({mossboundCount}/{mossbound.bonuses[mossbound.bonuses.length - 1]!.pieces})</h2>
          <ul>
            {mossbound.bonuses.map((bonus) => (
              <li key={bonus.pieces} className={mossboundCount >= bonus.pieces ? 'active' : 'inactive'}>
                {bonus.pieces} pieces: {bonus.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="equipment-totals">
        <h2>Totals</h2>
        <p>Max HP: {hunterDefinition.baseMaxHp} → {stats.maxHp}</p>
        <p>Attack damage: {hunterDefinition.baseAttackDamage} → {stats.attackDamage}</p>
        <p>Defense window bonus: +{stats.defenseWindowBonusMs}ms</p>
        <p>Rare drop chance bonus: +{Math.round(stats.rareDropChanceBonus * 100)}%</p>
      </div>

      <div className="equipment-owned">
        <h2>Crafted items</h2>
        {ownedItems.length === 0 && (
          <p className="results__empty">No crafted items yet. Visit Crafting.</p>
        )}
        {ownedItems.map((item) => {
          const isEquipped = Object.values(loadout).includes(item.id);
          // preview if equipped into its slot
          const previewLoadout = isEquipped ? loadout : equipItem(loadout, item) ?? loadout;
          const previewStats = deriveHunterStats(BASE, equipmentForLoadout(previewLoadout), save.skill_ranks, equipmentSets);
          const deltaHp = previewStats.maxHp - stats.maxHp;
          const deltaAtk = previewStats.attackDamage - stats.attackDamage;
          const deltaDef = previewStats.defenseWindowBonusMs - stats.defenseWindowBonusMs;
          const deltaRare = previewStats.rareDropChanceBonus - stats.rareDropChanceBonus;
          return (
            <div key={item.id} className="equipment-owned__row">
              <div className="equipment-owned__info">
                <img
                  className="equipment-owned__icon"
                  src={`/sprites/items/${item.id}.png`}
                  alt=""
                  width={24}
                  height={24}
                />
                <span className="equipment-owned__name">{item.name}</span>
                <span className="equipment-owned__slot">({item.slot})</span>
                <span className="equipment-owned__stats">{statText(item)}</span>
              </div>
              {!isEquipped && (
                <span className="equipment-owned__preview">
                  Equip → HP {deltaHp >= 0 ? '+' : ''}{deltaHp}, Atk {deltaAtk >= 0 ? '+' : ''}{deltaAtk}, Def {deltaDef >= 0 ? '+' : ''}{deltaDef}ms, Rare {deltaRare >= 0 ? '+' : ''}{Math.round(deltaRare * 100)}%
                </span>
              )}
              <button
                type="button"
                className="btn btn--primary"
                disabled={isEquipped || busy === item.id}
                onClick={() => void handleEquip(item.id)}
              >
                {isEquipped ? 'Equipped' : busy === item.id ? 'Equipping…' : 'Equip'}
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
