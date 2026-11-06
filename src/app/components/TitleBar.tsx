import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';
import { loadGameSave, setSetting } from '../../persistence/gameRepository';

export default function TitleBar() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const value = save.settings['window.always_on_top'] === 'true';
        setAlwaysOnTop(value);
        void getCurrentWindow().setAlwaysOnTop(value);
      })
      .catch(() => {});
  }, []);

  async function toggleAlwaysOnTop() {
    const next = !alwaysOnTop;
    await getCurrentWindow().setAlwaysOnTop(next);
    setAlwaysOnTop(next);
    try {
      await setSetting('window.always_on_top', String(next));
    } catch {
      // Persistence is best-effort in the spike; the toggle still works in-session.
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