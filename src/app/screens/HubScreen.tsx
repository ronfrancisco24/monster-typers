import { useEffect, useState } from 'react';
import { bristleBoar, mossSlime } from '../../content/monsters';
import { materialName } from '../../content/materials';
import type { MonsterDefinition } from '../../game/domain/types';
import { loadGameSave, reconcileProgression } from '../../persistence/gameRepository';
import type { PlayerProfile } from '../../persistence/types';
import { levelFromXp, xpProgressInLevel, xpToNextLevel } from '../../game/domain/progression';

interface Props {
  onStartHunt: (monster: MonsterDefinition) => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onOpenCrafting: () => void;
  onOpenEquipment: () => void;
}

const MONSTERS = [mossSlime, bristleBoar];

function materialLabel(id: string): string {
  return materialName(id);
}

export default function HubScreen({ onStartHunt, onOpenInventory, onOpenSkills, onOpenCrafting, onOpenEquipment }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const computedLevel = levelFromXp(save.profile.total_xp);
        const computedPoints =
          save.profile.unspent_skill_points + Math.max(0, computedLevel - save.profile.hunter_level);
        if (computedLevel !== save.profile.hunter_level || computedPoints !== save.profile.unspent_skill_points) {
          reconcileProgression(computedLevel, computedPoints)
            .then(() => {
              setProfile({ ...save.profile, hunter_level: computedLevel, unspent_skill_points: computedPoints });
            })
            .catch(() => setProfile(save.profile));
        } else {
          setProfile(save.profile);
        }
      })
      .catch(() => {});
  }, []);

  const progress = profile ? xpProgressInLevel(profile.total_xp) : null;

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Hunt Board</h1>
        <p className="hub__subtitle">Verdant Forest — {MONSTERS.length} monsters available.</p>
        {profile && (
          <div className="hub__profile">
            <span>Level {levelFromXp(profile.total_xp)}</span>
            <span>XP {progress?.current ?? 0}/{progress?.needed ?? 0}</span>
            <span>Next in {xpToNextLevel(profile.total_xp)}</span>
            <span>Skill points: {profile.unspent_skill_points + Math.max(0, levelFromXp(profile.total_xp) - profile.hunter_level)}</span>
          </div>
        )}
        <button type="button" className="btn" onClick={onOpenInventory}>
          Inventory
        </button>
        <button type="button" className="btn" onClick={onOpenSkills}>
          Skills
        </button>
        <button type="button" className="btn" onClick={onOpenCrafting}>
          Crafting
        </button>
        <button type="button" className="btn" onClick={onOpenEquipment}>
          Equipment
        </button>
      </header>

      <div className="monster-list">
        {MONSTERS.map((monster) => {
          const materials = monster.drops?.map((drop) => drop.materialId) ?? [];
          return (
            <article key={monster.id} className="monster-card">
              <div className="monster-card__header">
                <h2 className="monster-card__name">{monster.name}</h2>
                <span className={`difficulty difficulty--${monster.difficulty ?? 'easy'}`}>
                  {monster.difficulty ?? 'easy'}
                </span>
              </div>

              <dl className="monster-card__stats">
                <div>
                  <dt>Health</dt>
                  <dd>{monster.hp}</dd>
                </div>
                <div>
                  <dt>Attack</dt>
                  <dd>{monster.attackDamage}</dd>
                </div>
                <div>
                  <dt>Cadence</dt>
                  <dd>{monster.attackCadenceMs / 1000}s</dd>
                </div>
              </dl>

              <div className="monster-card__materials">
                <span className="monster-card__materials-label">Possible materials</span>
                <div className="material-chips">
                  {materials.length === 0 ? (
                    <span className="material-chip material-chip--empty">None</span>
                  ) : (
                    materials.map((materialId) => (
                      <span key={materialId} className="material-chip">
                        {materialLabel(materialId)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary monster-card__start"
                onClick={() => onStartHunt(monster)}
              >
                Start Hunt
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}