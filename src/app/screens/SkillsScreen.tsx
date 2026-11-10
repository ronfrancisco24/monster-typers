import { useEffect, useState } from 'react';
import { loadGameSave, purchaseSkillRank, reconcileProgression } from '../../persistence/gameRepository';
import { levelFromXp } from '../../game/domain/progression';
import type { PlayerProfile } from '../../persistence/types';
import {
  SKILLS,
  currentRank,
  nextRankDef,
  isMaxed,
  derivedAttackBonus,
  derivedDefenseWindowBonusMs,
  derivedRareDropChanceBonus,
  type SkillDefinition,
} from '../../game/domain/skills';

interface Props {
  onReturnToHub: () => void;
}

export default function SkillsScreen({ onReturnToHub }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    loadGameSave()
      .then((save) => {
        const computedLevel = levelFromXp(save.profile.total_xp);
        const computedPoints =
          save.profile.unspent_skill_points + Math.max(0, computedLevel - save.profile.hunter_level);
        const apply = (p: PlayerProfile) => {
          setProfile(p);
          setRanks(save.skill_ranks);
        };
        if (computedLevel !== save.profile.hunter_level || computedPoints !== save.profile.unspent_skill_points) {
          reconcileProgression(computedLevel, computedPoints)
            .then(() => apply({ ...save.profile, hunter_level: computedLevel, unspent_skill_points: computedPoints }))
            .catch(() => apply(save.profile));
        } else {
          apply(save.profile);
        }
      })
      .catch((err) => setError(String(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const handleBuy = async (skill: SkillDefinition) => {
    const next = nextRankDef(skill, ranks);
    if (!next) return;
    setBusy(skill.id);
    setError(null);
    try {
      const result = await purchaseSkillRank(skill.id, next.cost);
      setProfile((p) => (p ? { ...p, unspent_skill_points: result.points } : p));
      setRanks(result.ranks);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="hub">
      <header className="hub__header">
        <h1 className="hub__title">Skills</h1>
        <p className="hub__subtitle">
          {profile
            ? `Level ${profile.hunter_level} · Skill points: ${profile.unspent_skill_points}`
            : 'Loading…'}
        </p>
        <button type="button" className="btn" onClick={onReturnToHub}>
          Back to Hub
        </button>
      </header>

      {error !== null && <p className="results__empty">{error}</p>}

      <div className="skill-bonuses">
        <span>+{derivedAttackBonus(ranks)} attack damage</span>
        <span>+{derivedDefenseWindowBonusMs(ranks)}ms defense window</span>
        <span>+{Math.round(derivedRareDropChanceBonus(ranks) * 100)}% rare drop chance</span>
      </div>

      <div className="skill-list">
        {SKILLS.map((skill) => {
          const rank = currentRank(ranks, skill.id);
          const next = nextRankDef(skill, ranks);
          const maxed = isMaxed(skill, ranks);
          return (
            <article key={skill.id} className="skill-card">
              <div className="skill-card__header">
                <h2 className="skill-card__name">{skill.name}</h2>
                <span className="skill-card__branch">{skill.branch}</span>
              </div>
              <p className="skill-card__rank">
                Rank {rank}/{skill.maxRank}
                {maxed ? ' (maxed)' : ''}
              </p>
              {next ? (
                <>
                  <p className="skill-card__effect">{next.description}</p>
                  <p className="skill-card__cost">Cost: {next.cost} point(s)</p>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy === skill.id || (profile?.unspent_skill_points ?? 0) < next.cost}
                    onClick={() => handleBuy(skill)}
                  >
                    {busy === skill.id ? 'Buying…' : 'Buy rank'}
                  </button>
                </>
              ) : (
                <p className="skill-card__maxed">Max rank reached.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}