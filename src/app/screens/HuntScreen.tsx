import { useEffect, useRef, useState } from 'react';
import { PhaserViewport, type PhaserViewportHandle } from '../components/PhaserViewport';
import { loadGameSave } from '../../persistence/gameRepository';
import { mossSlime } from '../../content/monsters';
import { hunterDefinition } from '../../content/hunter';
import { createHuntController, type HuntController } from '../../game/controller/huntController';

type Flash = 'hit' | 'miss' | 'monster' | null;

function makeController(): HuntController {
  return createHuntController({
    huntId: crypto.randomUUID(),
    monster: mossSlime,
    playerMaxHp: hunterDefinition.baseMaxHp,
    baseAttackDamage: hunterDefinition.baseAttackDamage,
    now: () => performance.now(),
    random: Math.random,
  });
}

function hpPercent(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export default function HuntScreen() {
  const [controller, setController] = useState(makeController);
  const [state, setState] = useState(controller.getState());
  const [flash, setFlash] = useState<Flash>(null);
  const [hunterLevel, setHunterLevel] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const phaserRef = useRef<PhaserViewportHandle>(null);
  const flashTimer = useRef<number | null>(null);

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
      if (last.type === 'PLAYER_ATTACK') triggerFlash('hit');
      else if (last.type === 'MISTYPE') triggerFlash('miss');
      else if (last.type === 'MONSTER_ATTACK') triggerFlash('monster');
    }
    phaserRef.current?.applyEvents(events);
    const next = controller.getState();
    phaserRef.current?.applyState(next);
    setState(next);
  };

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
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

  function replay() {
    setController(makeController());
  }

  const prompt = state.prompt;

  return (
    <section className={`hunt hunt--${state.status}`}>
      <header className="hud-top">
        <span className="monster-name">{mossSlime.name}</span>
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
          <p>The slime is defeated.</p>
          <button type="button" className="btn btn--primary" onClick={replay}>
            Replay
          </button>
        </div>
      )}

      {state.status === 'defeat' && (
        <div className="overlay overlay--defeat">
          <h2>Defeat</h2>
          <p>You were knocked out.</p>
          <button type="button" className="btn btn--primary" onClick={replay}>
            Replay
          </button>
        </div>
      )}

      {state.status === 'abandoned' && (
        <div className="overlay">
          <h2>Abandoned</h2>
          <p>No rewards were awarded.</p>
          <button type="button" className="btn btn--primary" onClick={replay}>
            Replay
          </button>
        </div>
      )}
    </section>
  );
}