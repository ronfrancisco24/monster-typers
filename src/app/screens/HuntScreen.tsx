import { useEffect, useRef, useState } from 'react';
import { PhaserViewport, type PhaserViewportHandle } from '../components/PhaserViewport';
import { loadGameSave } from '../../persistence/gameRepository';
import { mossSlime } from '../../content/monsters';
import { hunterDefinition } from '../../content/hunter';
import { createHuntController, type HuntController } from '../../game/controller/huntController';
import type { MonsterDefinition } from '../../game/domain/types';
import { calculateHuntRewards } from '../../game/domain/rewards';
import { getMaterial } from '../../content/materials';
import { finalizeHunt } from '../../persistence/gameRepository';
import type { FinalizedHunt } from '../../persistence/types';

type Flash = 'hit' | 'miss' | 'monster' | null;

function makeController(monster: MonsterDefinition): HuntController {
  return createHuntController({
    huntId: crypto.randomUUID(),
    monster,
    playerMaxHp: hunterDefinition.baseMaxHp,
    baseAttackDamage: hunterDefinition.baseAttackDamage,
    now: () => performance.now(),
    random: Math.random,
  });
}

function hpPercent(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export default function HuntScreen({
  monster: initialMonster = mossSlime,
  onReturnToHub,
}: {
  monster?: MonsterDefinition;
  onReturnToHub?: () => void;
}) {
  const [monster] = useState(initialMonster);
  const [controller, setController] = useState(() => makeController(monster));
  const [state, setState] = useState(controller.getState());
  const [flash, setFlash] = useState<Flash>(null);
  const [hunterLevel, setHunterLevel] = useState(1);
  const [flawlessFlash, setFlawlessFlash] = useState(false);
  const [comboLostFlash, setComboLostFlash] = useState(false);
  const [settlement, setSettlement] = useState<
    | { status: 'idle' }
    | { status: 'pending' }
    | { status: 'done'; result: FinalizedHunt }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const settledRef = useRef<string | null>(null);
  const [settleTick, setSettleTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const phaserRef = useRef<PhaserViewportHandle>(null);
  const flashTimer = useRef<number | null>(null);
  const flawlessTimer = useRef<number | null>(null);
  const comboLostTimer = useRef<number | null>(null);
  const prevComboRef = useRef(0);

  const triggerFlash = (kind: Exclude<Flash, null>) => {
    setFlash(kind);
    if (flashTimer.current !== null) {
      window.clearTimeout(flashTimer.current);
    }
    flashTimer.current = window.setTimeout(() => setFlash(null), 200);
  };

  const sync = () => {
    const events = controller.drainEvents();
    const last = events[events.length - 1];
    if (last !== undefined) {
      if (last.type === 'PLAYER_ATTACK') {
        triggerFlash('hit');
        if (last.flawless) {
          setFlawlessFlash(true);
          if (flawlessTimer.current !== null) window.clearTimeout(flawlessTimer.current);
          flawlessTimer.current = window.setTimeout(() => setFlawlessFlash(false), 900);
        }
      } else if (last.type === 'MISTYPE') {
        triggerFlash('miss');
        if (prevComboRef.current > 0) {
          setComboLostFlash(true);
          if (comboLostTimer.current !== null) window.clearTimeout(comboLostTimer.current);
          comboLostTimer.current = window.setTimeout(() => setComboLostFlash(false), 900);
        }
      } else if (last.type === 'MONSTER_ATTACK') {
        triggerFlash('monster');
      } else if (last.type === 'DEFENSE_STARTED') {
        triggerFlash('monster');
      } else if (last.type === 'DEFENSE_SUCCESS') {
        triggerFlash('hit');
      } else if (last.type === 'DEFENSE_FAILED') {
        triggerFlash('miss');
      } else if (last.type === 'PART_BROKEN') {
        triggerFlash('hit');
      }
    }
    phaserRef.current?.applyEvents(events);
    const next = controller.getState();
    phaserRef.current?.applyState(next);
    prevComboRef.current = state.combo;
    setState(next);
  };

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      if (flawlessTimer.current !== null) window.clearTimeout(flawlessTimer.current);
      if (comboLostTimer.current !== null) window.clearTimeout(comboLostTimer.current);
    };
  }, []);

  useEffect(() => {
    loadGameSave()
      .then((save) => setHunterLevel(save.profile.hunter_level))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      controller.tick();
      sync();
    }, 100);
    return () => window.clearInterval(id);
  }, [controller]);

  useEffect(() => {
    const pause = () => {
      controller.pause();
      sync();
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [controller]);

  useEffect(() => {
    const isTerminal =
      state.status === 'victory' || state.status === 'defeat' || state.status === 'abandoned';
    if (!isTerminal) return;
    if (settledRef.current === state.huntId) return;
    settledRef.current = state.huntId;

    const outcome = state.status as 'victory' | 'defeat' | 'abandoned';
    const rewards = calculateHuntRewards({
      huntId: state.huntId,
      monster,
      outcome,
      partBroken: state.part?.broken ?? false,
    });
    const stats = controller.getStats();

    setSettlement({ status: 'pending' });
    finalizeHunt({
      hunt_id: state.huntId,
      map_id: monster.mapId,
      monster_id: monster.id,
      outcome,
      duration_ms: stats.durationMs,
      correct_keystrokes: stats.correctKeystrokes,
      incorrect_keystrokes: stats.incorrectKeystrokes,
      words_completed: stats.wordsCompleted,
      xp_awarded: rewards.xp,
      loot: rewards.drops.map((drop) => ({ material_id: drop.materialId, quantity: drop.quantity })),
      broken_part_ids: rewards.brokenPartIds,
    })
      .then((result) => setSettlement({ status: 'done', result }))
      .catch((err) => setSettlement({ status: 'error', message: String(err) }));
  }, [state.status, state.huntId, settleTick, controller, monster]);

  useEffect(() => {
    if (state.status === 'active') {
      inputRef.current?.focus();
    }
  }, [state.status, controller]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    event.preventDefault();
    controller.typeCharacter(event.key);
    sync();
  }

  function start() {
    controller.start();
    sync();
  }

  function pause() {
    controller.pause();
    sync();
  }

  function resume() {
    controller.resume();
    sync();
    inputRef.current?.focus();
  }

  function abandon() {
    if (!window.confirm('Abandon this hunt? No loot is awarded.')) return;
    controller.abandon();
    sync();
  }

  function retrySettle() {
    settledRef.current = null;
    setSettlement({ status: 'idle' });
    setSettleTick((value) => value + 1);
  }

  function replay() {
    settledRef.current = null;
    setSettlement({ status: 'idle' });
    setController(makeController(monster));
  }

  const prompt = state.prompt;
  const isDefense = prompt?.kind === 'defense';
  const isBreak = prompt?.kind === 'break';
  const defenseRemainingMs =
    state.defenseDeadlineMs !== null ? Math.max(0, state.defenseDeadlineMs - performance.now()) : 0;

  return (
    <section className={`hunt hunt--${state.status}`}>
      <header className="hud-top">
        <span className="monster-name">{monster.name}</span>
        <span className="combo">{state.combo > 0 ? `Combo x${state.combo}` : ''}</span>
      </header>

      <section className="hp-row">
        <div className="hp">
          <div className="hp__label">Hunter</div>
          <div className="hp__bar" role="progressbar" aria-valuenow={state.playerHp} aria-valuemax={state.playerMaxHp}>
            <div className="hp__fill hp__fill--player" style={{ width: hpPercent(state.playerHp, state.playerMaxHp) }} />
          </div>
          <div className="hp__value">
            {state.playerHp}/{state.playerMaxHp}
          </div>
        </div>
        <div className="hp">
          <div className="hp__label">Monster</div>
          <div className="hp__bar" role="progressbar" aria-valuenow={state.monsterHp} aria-valuemax={state.monsterMaxHp}>
            <div className="hp__fill hp__fill--monster" style={{ width: hpPercent(state.monsterHp, state.monsterMaxHp) }} />
          </div>
          <div className="hp__value">
            {state.monsterHp}/{state.monsterMaxHp}
          </div>
        </div>
      </section>

      {state.part !== null && (
        <section className="part-row">
          <span className="part-row__label">{state.part.name}</span>
          <div className="part-row__bar" role="progressbar" aria-valuenow={state.part.gauge} aria-valuemax={state.part.threshold}>
            <div
              className={`part-row__fill ${state.part.broken ? 'part-row__fill--broken' : ''}`}
              style={{ width: `${Math.min(100, (state.part.gauge / state.part.threshold) * 100)}%` }}
            />
          </div>
          <span className="part-row__value">
            {state.part.broken ? 'Broken' : `${state.part.gauge}/${state.part.threshold}`}
          </span>
        </section>
      )}

      {state.status === 'ready' && (
        <section className="panel">
          <p>Hunter level {hunterLevel}</p>
          <p>Type the displayed word to attack. React to the monster&apos;s attacks.</p>
          <button type="button" className="btn btn--primary" onClick={start}>
            Start Hunt
          </button>
        </section>
      )}

      {(state.status === 'active' || state.status === 'paused') && prompt !== null && (
        <section className="word-area">
          <PhaserViewport ref={phaserRef} width={640} height={160} />
          {isDefense && (
            <div className="defense-banner">
              <span className="defense-banner__label">Defend</span>
              <span className="defense-banner__countdown">{(defenseRemainingMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {isBreak && (
            <div className="break-banner">
              <span className="break-banner__label">Break: {state.part?.name}</span>
              <span className="break-banner__hint">Type to break the part</span>
            </div>
          )}
          <div className={`word ${flash === 'miss' ? 'word--shake' : ''} ${flash === 'hit' ? 'word--hit' : ''}`}>
            {prompt.word.split('').map((char, index) => {
              const done = index < prompt.cursor;
              const current = index === prompt.cursor;
              return (
                <span
                  key={index}
                  className={`char ${done ? 'char--done' : ''} ${current ? 'char--current' : ''} ${current && prompt.mistyped ? 'char--error' : ''}`}
                >
                  {char.toUpperCase()}
                </span>
              );
            })}
          </div>
          {flawlessFlash && <div className="feedback feedback--flawless">Flawless!</div>}
          {comboLostFlash && <div className="feedback feedback--combo-lost">Combo lost</div>}
          <input
            ref={inputRef}
            className="typing-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Combat typing input"
            onKeyDown={handleKeyDown}
          />
          <div className="controls">
            {state.status === 'active' ? (
              <button type="button" className="btn" onClick={pause}>
                Pause
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={resume}>
                Resume
              </button>
            )}
            <button type="button" className="btn" onClick={abandon}>
              Abandon
            </button>
          </div>
        </section>
      )}

      {state.status === 'paused' && (
        <div className="overlay">
          <h2>Paused</h2>
          <p>The fight is frozen. Press Resume when you are ready.</p>
          <button type="button" className="btn btn--primary" onClick={resume}>
            Resume
          </button>
        </div>
      )}

      {state.status === 'victory' && (
        <div className="overlay overlay--victory">
          <h2>Victory</h2>
          <p>The {monster.name} is defeated.</p>
          {settlement.status === 'pending' && <p className="results__empty">Settling rewards…</p>}
          {settlement.status === 'error' && (
            <div className="results">
              <p className="results__empty">Settlement failed: {settlement.message}</p>
              <button type="button" className="btn" onClick={retrySettle}>
                Retry
              </button>
            </div>
          )}
          {settlement.status === 'done' && (
            <div className="results">
              <div className="results__row">
                <span>XP</span>
                <span>+{settlement.result.xp_awarded}</span>
              </div>
              {settlement.result.loot.map((drop) => (
                <div key={drop.material_id} className="results__row">
                  <span>{getMaterial(drop.material_id)?.name ?? drop.material_id}</span>
                  <span>x{drop.quantity}</span>
                </div>
              ))}
              {settlement.result.loot.length === 0 && (
                <p className="results__empty">No materials dropped.</p>
              )}
            </div>
          )}
          <div className="controls">
            <button type="button" className="btn btn--primary" onClick={replay}>
              Replay
            </button>
            {onReturnToHub && (
              <button type="button" className="btn" onClick={onReturnToHub}>
                Return to Hub
              </button>
            )}
          </div>
        </div>
      )}

      {state.status === 'defeat' && (
        <div className="overlay overlay--defeat">
          <h2>Defeat</h2>
          <p>You were knocked out.</p>
          {settlement.status === 'pending' && <p className="results__empty">Settling…</p>}
          {settlement.status === 'error' && (
            <div className="results">
              <p className="results__empty">Settlement failed: {settlement.message}</p>
              <button type="button" className="btn" onClick={retrySettle}>
                Retry
              </button>
            </div>
          )}
          {(settlement.status === 'done' || settlement.status === 'idle') && (
            <p className="results__empty">No rewards.</p>
          )}
          <div className="controls">
            <button type="button" className="btn btn--primary" onClick={replay}>
              Replay
            </button>
            {onReturnToHub && (
              <button type="button" className="btn" onClick={onReturnToHub}>
                Return to Hub
              </button>
            )}
          </div>
        </div>
      )}

      {state.status === 'abandoned' && (
        <div className="overlay">
          <h2>Abandoned</h2>
          <p>No rewards were awarded.</p>
          <div className="controls">
            <button type="button" className="btn btn--primary" onClick={replay}>
              Replay
            </button>
            {onReturnToHub && (
              <button type="button" className="btn" onClick={onReturnToHub}>
                Return to Hub
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}