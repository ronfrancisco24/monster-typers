import { useEffect, useState } from 'react';
import { maps } from '../../content/maps';
import { getMonster } from '../../content/monsters';
import { materialName } from '../../content/materials';
import type { MonsterDefinition } from '../../game/domain/types';
import { loadGameSave, reconcileProgression, unlockMap } from '../../persistence/gameRepository';
import type { PlayerProfile } from '../../persistence/types';
import { levelFromXp, xpProgressInLevel, xpToNextLevel } from '../../game/domain/progression';
import { playMusic, playUi } from '../../platform/uiAudio';

interface Props {
  onStartHunt: (monster: MonsterDefinition) => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onOpenCrafting: () => void;
  onOpenEquipment: () => void;
}

function materialLabel(id: string): string {
  return materialName(id);
}

export default function HubScreen({ onStartHunt, onOpenInventory, onOpenSkills, onOpenCrafting, onOpenEquipment }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [unlockedMaps, setUnlockedMaps] = useState<string[]>(['map.verdant_forest']);
  const [defeatedMonsters, setDefeatedMonsters] = useState<string[]>([]);

  useEffect(() => {
    let started = false;
    const startMusic = () => {
      if (started) return;
      started = true;
      playMusic('bgm.menu_hearth');
      document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);
    return () => document.removeEventListener('click', startMusic);
  }, []);

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
        setUnlockedMaps(save.unlocked_maps && save.unlocked_maps.length ? save.unlocked_maps : ['map.verdant_forest']);
        setDefeatedMonsters(save.defeated_monsters ?? []);
      })
      .catch(() => {});
  }, []);

  const progress = profile ? xpProgressInLevel(profile.total_xp) : null;

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Hunt Board</h1>
        <p className="hub__subtitle">Hunt Board</p>
        {profile && (
          <div className="hub__profile">
            <span>Level {levelFromXp(profile.total_xp)}</span>
            <span>XP {progress?.current ?? 0}/{progress?.needed ?? 0}</span>
            <span>Next in {xpToNextLevel(profile.total_xp)}</span>
            <span>Skill points: {profile.unspent_skill_points + Math.max(0, levelFromXp(profile.total_xp) - profile.hunter_level)}</span>
          </div>
        )}
        <button type="button" className="btn" onClick={() => { playUi('select'); onOpenInventory(); }}>
          Inventory
        </button>
        <button type="button" className="btn" onClick={() => { playUi('select'); onOpenSkills(); }}>
          Skills
        </button>
        <button type="button" className="btn" onClick={() => { playUi('select'); onOpenCrafting(); }}>
          Crafting
        </button>
        <button type="button" className="btn" onClick={() => { playUi('select'); onOpenEquipment(); }}>
          Equipment
        </button>
      </header>

      <div className="monster-list">
        {maps.map((map) => {
          const unlocked = unlockedMaps.includes(map.id);
          const mapMonsters = map.monsterIds
            .map((id) => getMonster(id))
            .filter((m): m is MonsterDefinition => m !== undefined);
          const boss = getMonster(map.bossId);
          return (
            <section key={map.id} className="map-section">
              <h2 className="map-section__title">{map.name}</h2>
              {!unlocked && (
                <p className="map-section__locked">
                  Locked — defeat {map.unlockRequirement.type === 'boss' ? getMonster(map.unlockRequirement.bossId)?.name ?? 'the boss' : 'the previous boss'} to unlock.
                </p>
              )}
              {unlocked && (
                <>
                  {mapMonsters.map((monster) => {
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
                          <div><dt>Health</dt><dd>{monster.hp}</dd></div>
                          <div><dt>Attack</dt><dd>{monster.attackDamage}</dd></div>
                          <div><dt>Cadence</dt><dd>{monster.attackCadenceMs / 1000}s</dd></div>
                        </dl>
                        <div className="monster-card__materials">
                          <span className="monster-card__materials-label">Possible materials</span>
                          <div className="material-chips">
                            {materials.length === 0 ? (
                              <span className="material-chip material-chip--empty">None</span>
                            ) : (
                              materials.map((materialId) => (
                                <span key={materialId} className="material-chip">{materialLabel(materialId)}</span>
                              ))
                            )}
                          </div>
                        </div>
                        <button type="button" className="btn btn--primary monster-card__start" onClick={() => { playUi('confirm'); onStartHunt(monster); }}>
                          Start Hunt
                        </button>
                      </article>
                    );
                  })}
                  {boss && (() => {
                    const bossUnlocked = map.monsterIds.every((id) => defeatedMonsters.includes(id));
                    if (!bossUnlocked) {
                      return (
                        <article key={boss.id} className="monster-card monster-card--boss monster-card--locked">
                          <div className="monster-card__header">
                            <h2 className="monster-card__name">{boss.name}</h2>
                            <span className="difficulty difficulty--hard">boss</span>
                          </div>
                          <p className="map-section__locked">
                            Defeat all 3 standard monsters in this region to unlock.
                          </p>
                        </article>
                      );
                    }
                    return (
                      <article key={boss.id} className="monster-card monster-card--boss">
                        <div className="monster-card__header">
                          <h2 className="monster-card__name">{boss.name}</h2>
                          <span className="difficulty difficulty--hard">boss</span>
                        </div>
                        <dl className="monster-card__stats">
                          <div><dt>Health</dt><dd>{boss.hp}</dd></div>
                          <div><dt>Attack</dt><dd>{boss.attackDamage}</dd></div>
                          <div><dt>Cadence</dt><dd>{boss.attackCadenceMs / 1000}s</dd></div>
                        </dl>
                        <div className="monster-card__materials">
                          <span className="monster-card__materials-label">Possible materials</span>
                          <div className="material-chips">
                            {(boss.drops?.map((d) => d.materialId) ?? []).map((materialId) => (
                              <span key={materialId} className="material-chip">{materialLabel(materialId)}</span>
                            ))}
                          </div>
                        </div>
                        <button type="button" className="btn btn--primary monster-card__start" onClick={() => { playUi('confirm'); onStartHunt(boss); }}>
                          Start Hunt
                        </button>
                      </article>
                    );
                  })()}
                </>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}