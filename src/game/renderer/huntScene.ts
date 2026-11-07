import Phaser from 'phaser';
import type { HuntEvent, HuntState } from '../domain/types';

export class HuntScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.Rectangle;
  private hunter!: Phaser.GameObjects.Rectangle;
  private monster!: Phaser.GameObjects.Rectangle;
  private hitText!: Phaser.GameObjects.Text;

  constructor() {
    super('HuntScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.ground = this.add.rectangle(width / 2, height - 16, width, 16, 0x2a3342);
    this.hunter = this.add.rectangle(110, height - 70, 44, 64, 0x38bdf8);
    this.monster = this.add.rectangle(width - 110, height - 70, 64, 64, 0xf97316);
    this.hitText = this.add
      .text(width / 2, 48, '', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
  }

  applyEvents(events: HuntEvent[]): void {
    for (const event of events) {
      if (event.type === 'PLAYER_ATTACK') {
        this.tweens.add({
          targets: this.hunter,
          x: this.hunter.x + 70,
          duration: 110,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
        this.tweens.add({
          targets: this.monster,
          alpha: 0.35,
          duration: 90,
          yoyo: true,
          repeat: 1,
        });
        this.hitText.setText(`-${event.damage}`);
        this.time.delayedCall(700, () => this.hitText.setText(''));
      } else if (event.type === 'MONSTER_ATTACK') {
        this.tweens.add({
          targets: this.monster,
          x: this.monster.x - 70,
          duration: 110,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
        this.tweens.add({
          targets: this.hunter,
          alpha: 0.35,
          duration: 90,
          yoyo: true,
          repeat: 1,
        });
        this.hitText.setText(`-${event.damage}`);
        this.time.delayedCall(700, () => this.hitText.setText(''));
      } else if (event.type === 'MISTYPE') {
        this.cameras.main.shake(140, 0.006);
      } else if (event.type === 'DEFENSE_STARTED') {
        this.monster.setFillStyle(0xfb923c);
        this.tweens.add({
          targets: this.monster,
          scale: 1.15,
          duration: 120,
          yoyo: true,
        });
        this.hitText.setText('Defend!');
      } else if (event.type === 'DEFENSE_SUCCESS') {
        this.monster.setFillStyle(0x22c55e);
        this.hitText.setText('Blocked');
        this.time.delayedCall(700, () => this.hitText.setText(''));
      } else if (event.type === 'DEFENSE_FAILED') {
        this.monster.setFillStyle(0xf97316);
      } else if (event.type === 'BREAK_STARTED') {
        this.monster.setFillStyle(0xa855f7);
        this.tweens.add({
          targets: this.monster,
          scale: 1.12,
          duration: 120,
          yoyo: true,
        });
        this.hitText.setText('Break!');
      } else if (event.type === 'BREAK_PROGRESS') {
        this.hitText.setText('Hit!');
        this.time.delayedCall(400, () => this.hitText.setText(''));
      } else if (event.type === 'PART_BROKEN') {
        this.monster.setFillStyle(0x4b5563);
        this.hitText.setText('Broken');
        this.time.delayedCall(900, () => this.hitText.setText(''));
      } else if (event.type === 'VICTORY') {
        this.monster.setFillStyle(0x4b5563);
        this.hitText.setText('Victory');
      } else if (event.type === 'DEFEAT') {
        this.hunter.setFillStyle(0x4b5563);
        this.hitText.setText('Defeat');
      }
    }
  }

  applyState(state: HuntState): void {
    if (state.status === 'ready' || state.status === 'active') {
      if (state.prompt?.kind !== 'defense' && state.prompt?.kind !== 'break') {
        this.hunter.setFillStyle(0x38bdf8);
        this.monster.setFillStyle(0xf97316);
      }
    }
    if (state.status === 'paused') {
      this.hunter.setAlpha(0.7);
      this.monster.setAlpha(0.7);
    } else {
      this.hunter.setAlpha(1);
      this.monster.setAlpha(1);
    }
    if (state.status === 'ready') {
      this.hitText.setText('');
    }
  }
}