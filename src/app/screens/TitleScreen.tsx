import { useEffect, useRef, useState } from 'react';
import { levelFromXp } from '../../game/domain/progression';
import { loadGameSave } from '../../persistence/gameRepository';
import { playUi } from '../../platform/uiAudio';
import HowToPlayList from '../components/HowToPlay';

export default function TitleScreen({ onContinue }: { onContinue: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [meta, setMeta] = useState<string | null>(null);

  useEffect(() => {
    loadGameSave()
      .then((save) => {
        const level = levelFromXp(save.profile.total_xp);
        setMeta(`Lv ${level} · ${save.defeated_monsters.length}/12 felled`);
      })
      .catch(() => setMeta('Save unavailable'));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || dialogRef.current?.open === true) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button, a, input, select, textarea') !== null) return;
      event.preventDefault();
      playUi('confirm');
      onContinue();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onContinue]);

  function handleContinue() {
    playUi('confirm');
    onContinue();
  }

  function openHowToPlay() {
    playUi('select');
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
  }

  function closeHowToPlay() {
    playUi('back');
    dialogRef.current?.close();
  }

  return (
    <section className="title-screen">
      <div className="title-screen__logo">
        <h1 className="title-screen__title">
          MONSTER <span>TYPERS</span>
        </h1>
        <p className="title-screen__tagline">Type fast · Hunt monsters · Return to the hearth</p>
      </div>

      <div className="title-screen__scene" aria-hidden="true">
        <div className="title-screen__sprite title-screen__sprite--hunter" />
        <div className="title-screen__sprite title-screen__sprite--monster" />
      </div>

      <div className="title-screen__menu">
        <button type="button" className="btn btn--primary title-screen__cta" autoFocus onClick={handleContinue}>
          <span>Continue</span>
          <span className="title-screen__cta-meta">{meta ?? 'Loading save…'}</span>
        </button>
        <button type="button" className="btn" onClick={openHowToPlay}>
          How to Play
        </button>
        <p className="title-screen__hint">Press Enter</p>
      </div>

      <footer className="title-screen__foot">
        <span>Offline save</span>
        <span>v0.1.0</span>
      </footer>

      <dialog ref={dialogRef} className="title-dialog">
        <h2>How to play</h2>
        <HowToPlayList />
        <button type="button" className="btn" onClick={closeHowToPlay}>
          Close
        </button>
      </dialog>
    </section>
  );
}
