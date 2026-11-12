import { useEffect, useState } from 'react';
import { loadGameSave, purchaseSkillRank, reconcileProgression } from '../../persistence/gameRepository';
import { levelFromXp } from '../../game/domain/progression';
import type { PlayerProfile } from '../../persistence/types';
import {
  SKILLS,
  currentRank,
  nextRankDef,
  derivedAttackBonus,
  derivedDefenseWindowBonusMs,
  derivedRareDropChanceBonus,
  type SkillDefinition,
} from '../../game/domain/skills';
import ScreenShell from '../components/ScreenShell';

const BRANCHES = [
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'gathering', label: 'Gathering' },
] as const;

export default function SkillsScreen() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const computedLevel = levelFromXp(save.profile.total_xp);
        const computedPoints =
          save.profile.unspent_skill_points + Math.max(0, computedLevel - save.profile.hunter_level);
        const apply = (nextProfile: PlayerProfile) => {
          setProfile(nextProfile);
          setRanks(save.skill_ranks);
        };
        if (computedLevel !== save.profile.hunter_level || computedPoints !== save.profile.unspent_skill_points) {
          reconcileProgression(computedLevel, computedPoints)
            .then(() =>
              apply({ ...save.profile, hunter_level: computedLevel, unspent_skill_points: computedPoints }),
            )
            .catch(() => apply(save.profile));
        } else {
          apply(save.profile);
        }
      })
      .catch((err) => setError(String(err)));
  }, []);

  async function handleBuy(skill: SkillDefinition) {
    const next = nextRankDef(skill, ranks);
    if (next === null) return;
    setBusy(skill.id);
    setError(null);
    try {
      const result = await purchaseSkillRank(skill.id, next.cost);
      setProfile((current) => (current === null ? current : { ...current, unspent_skill_points: result.points }));
      setRanks(result.ranks);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  if (profile === null) {
    return (
      <ScreenShell title="Skills" subtitle="Spend points to sharpen your hunt.">
        {error === null ? <p className="empty-state">Loading…</p> : <p className="alert">{error}</p>}
      </ScreenShell>
    );
  }

  const points = profile.unspent_skill_points;

  return (
    <ScreenShell
      title="Skills"
      subtitle="Spend points to sharpen your hunt."
      meta={
        <span className="meta-chip">
          Lv {profile.hunter_level} · {points} SP
        </span>
      }
    >
      {error !== null && <p className="alert">{error}</p>}

      <div className="chip-row">
        <span className="chip">+{derivedAttackBonus(ranks)} ATK</span>
        <span className="chip">+{derivedDefenseWindowBonusMs(ranks)}ms DEF</span>
        <span className="chip">+{Math.round(derivedRareDropChanceBonus(ranks) * 100)}% RARE</span>
      </div>

      <div className="branch-grid">
        {BRANCHES.map((branch) => (
          <section key={branch.id} className={`branch branch--${branch.id}`}>
            <h2 className="branch__title">{branch.label}</h2>
            {SKILLS.filter((skill) => skill.branch === branch.id).map((skill) => {
              const rank = currentRank(ranks, skill.id);
              const next = nextRankDef(skill, ranks);
              const canBuy = next !== null && points >= next.cost && busy !== skill.id;
              return (
                <article key={skill.id} className="skill-tile">
                  <div className="skill-tile__head">
                    <h3 className="skill-tile__name">{skill.name}</h3>
                    <span className="pips" role="img" aria-label={`Rank ${rank} of ${skill.maxRank}`}>
                      {Array.from({ length: skill.maxRank }, (_, index) => (
                        <span
                          key={index}
                          className={`pip${index < rank ? ' pip--filled' : ''}`}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  </div>
                  {next === null ? (
                    <p className="skill-tile__maxed">Maxed</p>
                  ) : (
                    <>
                      <p className="skill-tile__effect">{next.description}</p>
                      <div className="skill-tile__foot">
                        <span className="skill-tile__cost">{next.cost} SP</span>
                        <button
                          type="button"
                          className="btn btn--primary btn--small"
                          disabled={!canBuy}
                          onClick={() => void handleBuy(skill)}
                        >
                          {busy === skill.id ? 'Buying…' : 'Buy'}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </ScreenShell>
  );
}
