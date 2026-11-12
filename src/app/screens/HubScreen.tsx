import { useEffect, useState } from 'react';
import { maps, type MapDefinition } from '../../content/maps';
import { getMonster } from '../../content/monsters';
import { materialName } from '../../content/materials';
import type { MonsterDefinition } from '../../game/domain/types';
import { loadGameSave, reconcileProgression } from '../../persistence/gameRepository';
import type { PlayerProfile } from '../../persistence/types';
import { levelFromXp, xpProgressInLevel } from '../../game/domain/progression';
import { playUi } from '../../platform/uiAudio';
import MaterialIcon from '../components/MaterialIcon';
import ScreenShell from '../components/ScreenShell';

interface Props {
  onStartHunt: (monster: MonsterDefinition) => void;
}

function regionClass(mapId: string): string {
  if (mapId === 'map.crystal_caverns') return 'crystal';
  if (mapId === 'map.ashen_wastes') return 'ash';
  return 'forest';
}

function unlockRequirementText(map: MapDefinition): string {
  if (map.unlockRequirement.type === 'boss') {
    return `Defeat ${getMonster(map.unlockRequirement.bossId)?.name ?? 'the previous boss'} to unlock.`;
  }
  return '';
}

function MonsterTile({
  monster,
  boss,
  locked,
  onStart,
}: {
  monster: MonsterDefinition;
  boss: boolean;
  locked: boolean;
  onStart: () => void;
}) {
  const drops = monster.drops?.map((drop) => drop.materialId) ?? [];
  const difficulty = boss ? 'hard' : (monster.difficulty ?? 'easy');

  return (
    <article className={`monster-tile${boss ? ' monster-tile--boss' : ''}${locked ? ' monster-tile--locked' : ''}`}>
      <div className="monster-tile__top">
        <img
          className="monster-tile__sprite"
          src={`/sprites/${boss ? 'bosses' : 'monsters'}/${monster.id}.idle.00.png`}
          alt=""
          width={48}
          height={48}
        />
        <div className="monster-tile__id">
          <h3 className="monster-tile__name">{monster.name}</h3>
          <span className={`difficulty difficulty--${difficulty}`}>{boss ? 'boss' : difficulty}</span>
        </div>
      </div>

      {locked ? (
        <p className="monster-tile__note">Defeat all 3 standard monsters in this region to unlock.</p>
      ) : (
        <>
          <div className="monster-tile__stats">
            <span className="stat-chip">
              <span>HP</span> {monster.hp}
            </span>
            <span className="stat-chip">
              <span>ATK</span> {monster.attackDamage}
            </span>
            <span className="stat-chip">
              <span>CD</span> {(monster.attackCadenceMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div
            className="monster-tile__drops"
            role="img"
            aria-label={drops.length === 0 ? 'No drops' : `Drops: ${drops.map(materialName).join(', ')}`}
          >
            {drops.length === 0 ? (
              <span className="monster-tile__nodrops">No drops</span>
            ) : (
              drops.map((materialId) => (
                <MaterialIcon key={materialId} id={materialId} title={materialName(materialId)} />
              ))
            )}
          </div>
        </>
      )}

      <button
        type="button"
        className="btn btn--primary monster-tile__start"
        disabled={locked}
        onClick={() => {
          if (locked) return;
          playUi('confirm');
          onStart();
        }}
      >
        {locked ? 'Locked' : 'Start Hunt'}
      </button>
    </article>
  );
}

export default function HubScreen({ onStartHunt }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [unlockedMaps, setUnlockedMaps] = useState<string[]>(['map.verdant_forest']);
  const [defeatedMonsters, setDefeatedMonsters] = useState<string[]>([]);
  const [selectedMapId, setSelectedMapId] = useState('map.verdant_forest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const unlocked = save.unlocked_maps.length > 0 ? save.unlocked_maps : ['map.verdant_forest'];
        setUnlockedMaps(unlocked);
        setSelectedMapId((current) => (unlocked.includes(current) ? current : (unlocked[0] ?? 'map.verdant_forest')));
        setDefeatedMonsters(save.defeated_monsters);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ScreenShell title="Monsters" subtitle="Choose a hunt.">
        <p className="empty-state">Loading…</p>
      </ScreenShell>
    );
  }

  if (error !== null) {
    return (
      <ScreenShell title="Monsters" subtitle="Choose a hunt.">
        <p className="alert">{error}</p>
      </ScreenShell>
    );
  }

  const activeMap = maps.find((map) => map.id === selectedMapId) ?? maps[0]!;
  const standardMonsters = activeMap.monsterIds
    .map((id) => getMonster(id))
    .filter((monster): monster is MonsterDefinition => monster !== undefined);
  const boss = getMonster(activeMap.bossId);
  const regionDefeated = activeMap.monsterIds.filter((id) => defeatedMonsters.includes(id)).length;
  const bossUnlocked = regionDefeated === activeMap.monsterIds.length;
  const bossDefeated = defeatedMonsters.includes(activeMap.bossId);

  const level = profile === null ? null : levelFromXp(profile.total_xp);
  const progress = profile === null ? null : xpProgressInLevel(profile.total_xp);
  const points =
    profile === null ? 0 : profile.unspent_skill_points + Math.max(0, (level ?? profile.hunter_level) - profile.hunter_level);
  const xpPercent =
    progress === null ? 0 : progress.needed === 0 ? 100 : Math.min(100, (progress.current / progress.needed) * 100);
  const xpLabel = progress === null ? '—' : progress.needed === 0 ? 'MAX' : `${progress.current}/${progress.needed} XP`;

  const meta = profile === null ? null : (
    <div className="hunter-meta">
      <span className="hunter-meta__level">Lv {level}</span>
      <span
        className="xp-bar"
        role="progressbar"
        aria-label="Experience"
        aria-valuemin={0}
        aria-valuemax={progress === null || progress.needed === 0 ? 1 : progress.needed}
        aria-valuenow={progress?.current ?? 0}
      >
        <span className="xp-bar__fill" style={{ width: `${xpPercent}%` }} />
      </span>
      <span className="hunter-meta__xp">{xpLabel}</span>
      <span className="hunter-meta__points">{points} SP</span>
    </div>
  );

  return (
    <ScreenShell title="Monsters" subtitle={activeMap.description} meta={meta}>
      <div className="monsters-layout">
        <aside className="region-rail" aria-label="Regions">
          {maps.map((map) => {
            const unlocked = unlockedMaps.includes(map.id);
            const done = map.monsterIds.filter((id) => defeatedMonsters.includes(id)).length;
            const total = map.monsterIds.length;
            const selected = map.id === activeMap.id;
            return (
              <button
                key={map.id}
                type="button"
                className={`region-btn region-btn--${regionClass(map.id)}${selected ? ' region-btn--active' : ''}`}
                aria-pressed={selected}
                disabled={!unlocked}
                title={unlocked ? map.description : `Locked — ${unlockRequirementText(map)}`}
                onClick={() => {
                  if (!selected) {
                    playUi('select');
                    setSelectedMapId(map.id);
                  }
                }}
              >
                <span className="region-btn__name">{map.name}</span>
                <span className="region-btn__meta">{unlocked ? `${done}/${total} felled` : 'Locked'}</span>
                <span className="region-btn__bar" aria-hidden="true">
                  <span
                    className="region-btn__fill"
                    style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
                  />
                </span>
              </button>
            );
          })}
        </aside>

        <div className="region-panel">
          <div className="region-panel__head">
            <h2 className="region-panel__name">{activeMap.name}</h2>
            <span className="region-panel__progress">
              {regionDefeated}/{activeMap.monsterIds.length} ·{' '}
              {bossDefeated ? 'boss felled' : bossUnlocked ? 'boss ready' : 'boss locked'}
            </span>
          </div>
          <div className="monster-grid">
            {standardMonsters.map((monster) => (
              <MonsterTile
                key={monster.id}
                monster={monster}
                boss={false}
                locked={false}
                onStart={() => onStartHunt(monster)}
              />
            ))}
            {boss !== undefined && (
              <MonsterTile
                key={boss.id}
                monster={boss}
                boss
                locked={!bossUnlocked}
                onStart={() => onStartHunt(boss)}
              />
            )}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
