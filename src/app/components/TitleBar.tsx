import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { loadGameSave, setSetting } from '../../persistence/gameRepository';
import { playUi, setUiMuted, setUiVolume } from '../../platform/uiAudio';

const COMPACT = { width: 240, height: 135 };
const EXPANDED = { width: 720, height: 405 };

export default function TitleBar() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(false);
  const [compact, setCompact] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const aot = save.settings['window.always_on_top'] === 'true';
        setAlwaysOnTop(aot);
        void getCurrentWindow().setAlwaysOnTop(aot);

        const reduced = save.settings['ui.reduced_effects'] === 'true';
        setReducedEffects(reduced);
        document.body.classList.toggle('reduced-effects', reduced);

        const isCompact = save.settings['window.compact_mode'] === 'true';
        setCompact(isCompact);
        void applyWindowSize(isCompact);

        const m = save.settings['audio.muted'] === 'true';
        setMuted(m);
        setUiMuted(m);

        const v = parseFloat(save.settings['audio.volume'] ?? '0.5');
        const vol = Number.isFinite(v) ? v : 0.5;
        setVolume(vol);
        setUiVolume(vol);
      })
      .catch(() => {});
  }, []);

  async function applyWindowSize(isCompact: boolean) {
    const size = isCompact ? COMPACT : EXPANDED;
    try {
      await getCurrentWindow().setSize(new LogicalSize(size.width, size.height));
    } catch {
      // best-effort
    }
  }

  async function toggleAlwaysOnTop() {
    const next = !alwaysOnTop;
    await getCurrentWindow().setAlwaysOnTop(next);
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

  async function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setUiVolume(v);
    const phaser = (window as { __retroAudio?: { setMusicVolume: (v: number) => void; setSfxVolume: (v: number) => void } }).__retroAudio;
    phaser?.setMusicVolume(v);
    phaser?.setSfxVolume(v);
    try {
      await setSetting('audio.volume', String(v));
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
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => void handleVolume(e)}
          aria-label="Volume"
          className="titlebar__volume"
        />
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
          className={`titlebar__btn ${reducedEffects ? 'titlebar__btn--active' : ''}`}
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
          className="titlebar__btn"
          onClick={() => void getCurrentWindow().minimize()}
          aria-label="Minimize"
        >
          _
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--close"
          onClick={() => void getCurrentWindow().close()}
          aria-label="Close"
        >
          X
        </button>
      </div>
    </header>
  );
}
