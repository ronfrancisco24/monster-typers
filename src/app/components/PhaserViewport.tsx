import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { HuntScene } from '../../game/renderer/huntScene';
import type { HuntEvent, HuntState } from '../../game/domain/types';

export interface PhaserViewportHandle {
  applyEvents: (events: HuntEvent[]) => void;
  applyState: (state: HuntState) => void;
  setEquipment: (loadout: Record<string, string>) => void;
  playTypingCorrect: () => void;
  playTypingError: () => void;
  unlockAudio: () => void;
  playUi: (key: 'hover' | 'select' | 'back' | 'confirm') => void;
  applyAudioSettings: (muted: boolean, volume: number) => void;
}

interface Props {
  width: number;
  height: number;
}

export const PhaserViewport = forwardRef<PhaserViewportHandle, Props>(
  function PhaserViewport({ width, height }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
      if (containerRef.current === null) return;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        width,
        height,
        parent: containerRef.current,
        backgroundColor: '#0b0e14',
        scene: HuntScene,
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      });
      gameRef.current = game;

      return () => {
        game.destroy(true);
        gameRef.current = null;
      };
    }, [width, height]);

    useImperativeHandle(
      ref,
      () => ({
        applyEvents: (events) => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.applyEvents(events);
        },
        applyState: (state) => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.applyState(state);
        },
        setEquipment: (loadout) => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.setEquipment(loadout);
        },
        playTypingCorrect: () => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.playTypingCorrect();
        },
        playTypingError: () => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.playTypingError();
        },
        unlockAudio: () => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.unlockAudio();
        },
        playUi: (key) => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.playUi(key);
        },
        applyAudioSettings: (muted, volume) => {
          const scene = gameRef.current?.scene.getScene('HuntScene') as HuntScene | undefined;
          scene?.applyAudioSettings(muted, volume);
        },
      }),
      [],
    );

    return <div ref={containerRef} className="phaser-viewport" />;
  },
);