import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { isTauri } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { loadGameSave, setSetting } from '../../persistence/gameRepository';
import { playUi, setUiMuted, setUiMusicVolume, setUiSfxVolume } from '../../platform/uiAudio';
import { placeWindow } from '../../platform/desktopWindow';

function win() {
  return isTauri() ? getCurrentWindow() : null;
}

const COMPACT = { width: 240, height: 135 };
const EXPANDED = { width: 720, height: 405 };

export default function TitleBar() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(false);
  const [compact, setCompact] = useState(false);
  const [muted, setMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const aot = save.settings['window.always_on_top'] === 'true';
        setAlwaysOnTop(aot);
        void win()?.setAlwaysOnTop(aot);

        const reduced = save.settings['ui.reduced_effects'] === 'true';
        setReducedEffects(reduced);
        document.body.classList.toggle('reduced-effects', reduced);

        const isCompact = save.settings['window.compact_mode'] === 'true';
        setCompact(isCompact);
        void applyWindowSize(isCompact);

        const m = save.settings['audio.muted'] === 'true';
        setMuted(m);
        setUiMuted(m);

        const mv = parseFloat(save.settings['audio.music_volume'] ?? save.settings['audio.volume'] ?? '0.5');
        const sv = parseFloat(save.settings['audio.sfx_volume'] ?? save.settings['audio.volume'] ?? '0.5');
        const mvol = Number.isFinite(mv) ? mv : 0.5;
        const svol = Number.isFinite(sv) ? sv : 0.5;
        setMusicVolume(mvol);
        setSfxVolume(svol);
        setUiMusicVolume(mvol);
        setUiSfxVolume(svol);
        const phaser = (window as { __retroAudio?: { setMusicVolume: (v: number) => void; setSfxVolume: (v: number) => void } }).__retroAudio;
        phaser?.setMusicVolume(mvol);
        phaser?.setSfxVolume(svol);
      })
      .catch(() => {});
  }, []);

  async function applyWindowSize(isCompact: boolean) {
    const size = isCompact ? COMPACT : EXPANDED;
    try {
      await win()?.setSize(new LogicalSize(size.width, size.height));
    } catch {
      // best-effort
    }
  }

  async function toggleAlwaysOnTop() {
    const next = !alwaysOnTop;
    await win()?.setAlwaysOnTop(next);
    setAlwaysOnTop(next);
    try {
      await setSetting('window.always_on_top', String(next));
    } catch {
      // best-effort
    }
  }

  async function toggleReducedEffects() {
    const next = !reducedEffects;
    setReducedEffects(next);
    document.body.classList.toggle('reduced-effects', next);
    try {
      await setSetting('ui.reduced_effects', String(next));
    } catch {
      // best-effort
    }
  }

  async function toggleCompact() {
    const next = !compact;
    setCompact(next);
    await applyWindowSize(next);
    try {
      await setSetting('window.compact_mode', String(next));
    } catch {
      // best-effort
    }
  }

  async function toggleMute() {
    const next = !muted;
    setMuted(next);
    setUiMuted(next);
    const phaser = (window as { __retroAudio?: { setMuted: (v: boolean) => void } }).__retroAudio;
    phaser?.setMuted(next);
    try {
      await setSetting('audio.muted', String(next));
    } catch {
      // best-effort
    }
  }

  async function handleMusicVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setMusicVolume(v);
    setUiMusicVolume(v);
    const phaser = (window as { __retroAudio?: { setMusicVolume: (v: number) => void } }).__retroAudio;
    phaser?.setMusicVolume(v);
    try {
      await setSetting('audio.music_volume', String(v));
    } catch {
      // best-effort
    }
  }

  async function handleSfxVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setSfxVolume(v);
    setUiSfxVolume(v);
    const phaser = (window as { __retroAudio?: { setSfxVolume: (v: number) => void } }).__retroAudio;
    phaser?.setSfxVolume(v);
    try {
      await setSetting('audio.sfx_volume', String(v));
    } catch {
      // best-effort
    }
  }

  return (
    <header className="titlebar">
      <div className="titlebar__drag" data-tauri-drag-region>
        Monster Typers
      </div>
      <div className="titlebar__controls">
        <button
          type="button"
          className={`titlebar__btn ${muted ? 'titlebar__btn--active' : ''}`}
          onClick={() => { void toggleMute(); playUi('select'); }}
          aria-label="Toggle mute"
          aria-pressed={muted}
        >
          {muted ? 'Mute' : 'Sound'}
        </button>
        <label className="titlebar__vol-label" title="Music volume">
          M
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={musicVolume}
            onChange={(e) => void handleMusicVolume(e)}
            aria-label="Music volume"
            className="titlebar__volume"
          />
        </label>
        <label className="titlebar__vol-label" title="SFX volume">
          S
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfxVolume}
            onChange={(e) => void handleSfxVolume(e)}
            onPointerUp={() => playUi('select')}
            onKeyUp={() => playUi('select')}
            aria-label="SFX volume"
            className="titlebar__volume"
          />
        </label>
        <button
          type="button"
          className={`titlebar__btn ${alwaysOnTop ? 'titlebar__btn--active' : ''}`}
          onClick={() => { void toggleAlwaysOnTop(); playUi('select'); }}
          aria-label="Toggle always on top"
          aria-pressed={alwaysOnTop}
        >
          Pin
        </button>
        <button
          type="button"
          className={`titlebar__btn titlebar__btn--fx ${reducedEffects ? 'titlebar__btn--active' : ''}`}
          onClick={() => { void toggleReducedEffects(); playUi('select'); }}
          aria-label="Toggle reduced effects"
          aria-pressed={reducedEffects}
        >
          FX
        </button>
        <button
          type="button"
          className={`titlebar__btn ${compact ? 'titlebar__btn--active' : ''}`}
          onClick={() => { void toggleCompact(); playUi('select'); }}
          aria-label="Toggle compact mode"
          aria-pressed={compact}
        >
          {compact ? 'Expand' : 'Compact'}
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--pos"
          onClick={() => { void placeWindow(); playUi('select'); }}
          aria-label="Reset window position"
        >
          Pos
        </button>
        <button
          type="button"
          className="titlebar__btn"
          onClick={() => void win()?.minimize()}
          aria-label="Minimize"
        >
          _
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--close"
          onClick={() => void win()?.close()}
          aria-label="Close"
        >
          X
        </button>
      </div>
    </header>
  );
}
