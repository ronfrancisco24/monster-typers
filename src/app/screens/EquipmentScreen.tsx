import { useCallback, useEffect, useState } from 'react';
import { loadGameSave, setEquipment } from '../../persistence/gameRepository';
import type { GameSave } from '../../persistence/types';
import {
  equipmentCatalog,
  equipmentForLoadout,
  equipmentSets,
  getEquipment,
  slotIconForSet,
  slotLabel,
} from '../../content/equipment';
import { deriveHunterStats } from '../../game/domain/stats';
import { equipItem, type EquipmentDefinition, type EquipmentSlot } from '../../game/domain/equipment';
import { hunterDefinition } from '../../content/hunter';
import { playUi } from '../../platform/uiAudio';
import ScreenShell from '../components/ScreenShell';

const BASE = { maxHp: hunterDefinition.baseMaxHp, attackDamage: hunterDefinition.baseAttackDamage };
const SLOTS: readonly EquipmentSlot[] = ['head', 'chest', 'feet'];

function statText(item: EquipmentDefinition): string {
  const parts: string[] = [];
  if (item.stats.maxHpBonus) parts.push(`+${item.stats.maxHpBonus} HP`);
  if (item.stats.attackDamageBonus) parts.push(`+${item.stats.attackDamageBonus} ATK`);
  if (item.stats.defenseWindowBonusMs) parts.push(`+${item.stats.defenseWindowBonusMs}ms DEF`);
  if (item.stats.rareDropChanceBonus) parts.push(`+${Math.round(item.stats.rareDropChanceBonus * 100)}% RARE`);
  return parts.join(' · ') || 'No stat changes';
}

export default function EquipmentScreen({ onGoToCrafting }: { onGoToCrafting: () => void }) {
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

  async function handleEquip(itemId: string) {
    const item = getEquipment(itemId);
    if (item === undefined || save === null) return;
    if (equipItem(save.equipment_loadout, item) === null) {
      setError('That item is already equipped in another slot.');
      return;
    }
    setBusy(itemId);
    setError(null);
    try {
      const loadout = await setEquipment(item.slot, itemId);
      setSave((current) => (current === null ? current : { ...current, equipment_loadout: loadout }));
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleUnequip(slot: EquipmentSlot) {
    if (save === null) return;
    setBusy(slot);
    setError(null);
    try {
      const loadout = await setEquipment(slot, null);
      setSave((current) => (current === null ? current : { ...current, equipment_loadout: loadout }));
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  if (save === null) {
    return (
      <ScreenShell title="Equipment" subtitle="Equip crafted armor to change your stats.">
        {error === null ? <p className="empty-state">Loading…</p> : <p className="alert">{error}</p>}
      </ScreenShell>
    );
  }

  const loadout = save.equipment_loadout;
  const equippedItems = equipmentForLoadout(loadout);
  const stats = deriveHunterStats(BASE, equippedItems, save.skill_ranks, equipmentSets);
  const equippedIds = new Set(equippedItems.map((item) => item.id));
  const ownedIds = new Set(save.owned_equipment);
  const ownedItems = equipmentCatalog
    .filter((item) => ownedIds.has(item.id))
    .sort((a, b) => Number(equippedIds.has(a.id)) - Number(equippedIds.has(b.id)));
  const activeSets = equipmentSets
    .map((set) => ({ set, count: equippedItems.filter((item) => item.setId === set.id).length }))
    .filter(({ count }) => count > 0);

  return (
    <ScreenShell
      title="Equipment"
      subtitle="Equip crafted armor to change your stats."
      meta={
        <span className="meta-chip">
          {equippedItems.length}/{SLOTS.length} equipped
        </span>
      }
    >
      {error !== null && <p className="alert">{error}</p>}

      <div className="gear-layout">
        <div className="paper-doll">
          {SLOTS.map((slot) => {
            const equippedId = loadout[slot];
            const equipped = equippedId === undefined ? undefined : getEquipment(equippedId);
            return (
              <div key={slot} className={`slot-card${equipped === undefined ? ' slot-card--empty' : ''}`}>
                {equipped === undefined ? (
                  <span className="slot-card__empty-icon" aria-hidden="true" />
                ) : (
                  <img
                    className="slot-card__item-icon"
                    src={`/sprites/items/${equipped.id}.png`}
                    alt=""
                    width={32}
                    height={32}
                  />
                )}
                <div className="slot-card__info">
                  <span className="slot-card__slot">
                    <img
                      src={`/sprites/ui/${slotIconForSet(equipped?.setId)}.png`}
                      alt=""
                      width={12}
                      height={12}
                    />
                    {slotLabel(slot)}
                  </span>
                  <span className="slot-card__name">
                    {equipped === undefined ? 'Empty slot' : equipped.name}
                  </span>
                  {equipped !== undefined && (
                    <span className="slot-card__stats">{statText(equipped)}</span>
                  )}
                </div>
                {equipped !== undefined && (
                  <button
                    type="button"
                    className="btn btn--small"
                    disabled={busy === slot}
                    onClick={() => void handleUnequip(slot)}
                  >
                    {busy === slot ? '…' : 'Unequip'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="gear-side">
          <div className="stat-panel">
            <h2>Hunter stats</h2>
            <div className="stat-row">
              <span>Max HP</span>
              <span>
                {hunterDefinition.baseMaxHp} → <b>{stats.maxHp}</b>
              </span>
            </div>
            <div className="stat-row">
              <span>Attack</span>
              <span>
                {hunterDefinition.baseAttackDamage} → <b>{stats.attackDamage}</b>
              </span>
            </div>
            <div className="stat-row">
              <span>Defense window</span>
              <span>
                +<b>{stats.defenseWindowBonusMs}</b>ms
              </span>
            </div>
            <div className="stat-row">
              <span>Rare drop</span>
              <span>
                +<b>{Math.round(stats.rareDropChanceBonus * 100)}</b>%
              </span>
            </div>
          </div>

          {activeSets.length === 0 ? (
            <div className="set-panel">
              <h2>Set bonuses</h2>
              <p className="set-panel__empty">Equip 2–3 pieces of one set to activate bonuses.</p>
            </div>
          ) : (
            activeSets.map(({ set, count }) => {
              const maxPieces = set.bonuses[set.bonuses.length - 1]?.pieces ?? 3;
              return (
                <div key={set.id} className="set-panel">
                  <h2>
                    {set.name} <span>{count}/{maxPieces}</span>
                  </h2>
                  <ul>
                    {set.bonuses.map((bonus) => {
                      const active = count >= bonus.pieces;
                      return (
                        <li key={bonus.pieces} className={active ? 'active' : ''}>
                          <span aria-hidden="true">{active ? '✓' : '○'}</span> {bonus.pieces} pieces:{' '}
                          {bonus.description}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="owned-panel">
        <div className="owned-panel__head">
          <h2>Owned armor</h2>
          <span className="meta-chip">{ownedItems.length} pieces</span>
        </div>

        {ownedItems.length === 0 ? (
          <div className="empty-state empty-state--inline">
            <p>No armor crafted yet.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                playUi('select');
                onGoToCrafting();
              }}
            >
              Go to Crafting
            </button>
          </div>
        ) : (
          <div className="owned-grid">
            {ownedItems.map((item) => {
              const isEquipped = equippedIds.has(item.id);
              const previewLoadout = isEquipped ? loadout : (equipItem(loadout, item) ?? loadout);
              const previewStats = deriveHunterStats(
                BASE,
                equipmentForLoadout(previewLoadout),
                save.skill_ranks,
                equipmentSets,
              );
              const deltaHp = previewStats.maxHp - stats.maxHp;
              const deltaAtk = previewStats.attackDamage - stats.attackDamage;
              const deltaDef = previewStats.defenseWindowBonusMs - stats.defenseWindowBonusMs;
              const deltaRare = previewStats.rareDropChanceBonus - stats.rareDropChanceBonus;
              const deltaText = [
                `HP ${deltaHp >= 0 ? '+' : ''}${deltaHp}`,
                `ATK ${deltaAtk >= 0 ? '+' : ''}${deltaAtk}`,
                `DEF ${deltaDef >= 0 ? '+' : ''}${deltaDef}ms`,
                `RARE ${deltaRare >= 0 ? '+' : ''}${Math.round(deltaRare * 100)}%`,
              ].join(' · ');

              return (
                <article key={item.id} className="owned-card">
                  <div className="owned-card__head">
                    <img
                      className="owned-card__icon"
                      src={`/sprites/items/${item.id}.png`}
                      alt=""
                      width={32}
                      height={32}
                    />
                    <div className="owned-card__id">
                      <span className="owned-card__name">{item.name}</span>
                      <span className="owned-card__slot">{slotLabel(item.slot)}</span>
                    </div>
                  </div>
                  <span className="owned-card__stats">{statText(item)}</span>
                  {!isEquipped && <span className="owned-card__delta">{deltaText}</span>}
                  {isEquipped ? (
                    <span className="badge owned-card__equipped">Equipped</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--primary btn--small owned-card__equip"
                      disabled={busy === item.id}
                      onClick={() => void handleEquip(item.id)}
                    >
                      {busy === item.id ? 'Equipping…' : 'Equip'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
