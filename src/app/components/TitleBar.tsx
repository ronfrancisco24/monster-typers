import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { loadGameSave, setSetting } from '../../persistence/gameRepository';

const COMPACT = { width: 240, height: 135 };
const EXPANDED = { width: 720, height: 405 };

export default function TitleBar() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [reducedEffects, setReducedEffects] = useState(false);
  const [compact, setCompact] = useState(false);

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

  return (
    <header className="titlebar">
      <div className="titlebar__drag" data-tauri-drag-region>
        Monster Typers
      </div>
      <div className="titlebar__controls">
        <button
          type="button"
          className={`titlebar__btn ${alwaysOnTop ? 'titlebar__btn--active' : ''}`}
          onClick={() => void toggleAlwaysOnTop()}
          aria-label="Toggle always on top"
          aria-pressed={alwaysOnTop}
        >
          Pin
        </button>
        <button
          type="button"
          className={`titlebar__btn ${reducedEffects ? 'titlebar__btn--active' : ''}`}
          onClick={() => void toggleReducedEffects()}
          aria-label="Toggle reduced effects"
          aria-pressed={reducedEffects}
        >
          FX
        </button>
        <button
          type="button"
          className={`titlebar__btn ${compact ? 'titlebar__btn--active' : ''}`}
          onClick={() => void toggleCompact()}
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
