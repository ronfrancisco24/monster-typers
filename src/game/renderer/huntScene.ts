import Phaser from 'phaser';
import type { HuntEvent, HuntState } from '../domain/types';
import { preloadRetroHunt, createRetroHuntAnimations, regionForMonster } from './assetLoader';

export class HuntScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.TileSprite;
  private hunter!: Phaser.GameObjects.Sprite;
  private monster!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Image;
  private hitText!: Phaser.GameObjects.Text;
  private currentMonsterId: string | null = null;

  constructor() {
    super('HuntScene');
  }

  preload(): void {
    preloadRetroHunt(this);
  }

  create(): void {
    const { width, height } = this.scale;

    this.background = this.add.image(width / 2, height / 2, 'map.forest').setOrigin(0.5);
    this.background.setDisplaySize(width, height);

    this.ground = this.add.tileSprite(width / 2, height - 8, width, 16, 'tile.forest.ground');

    this.hunter = this.add.sprite(110, height - 70, 'hunter.default').setOrigin(0.5, 1);
    this.hunter.play('hunter.default.idle');

    this.monster = this.add.sprite(width - 110, height - 70, 'monster.moss_slime').setOrigin(0.5, 1);
    this.monster.play('monster.moss_slime.idle');

    this.hitText = this.add
      .text(width / 2, 48, '', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);

    createRetroHuntAnimations(this);
  }

  private reducedEffects(): boolean {
    return document.body.classList.contains('reduced-effects');
  }

  private setMonster(monsterId: string): void {
    if (monsterId === this.currentMonsterId) return;
    this.currentMonsterId = monsterId;
    const region = regionForMonster(monsterId);
    if (this.background && this.textures.exists(`map.${region}`)) {
      this.background.setTexture(`map.${region}`);
      this.background.setDisplaySize(this.scale.width, this.scale.height);
    }
    const tileKey = `tile.${region}.ground`;
    if (this.ground && this.textures.exists(tileKey)) {
      this.ground.setTexture(tileKey);
    }
    if (this.textures.exists(monsterId)) {
      this.monster.setTexture(monsterId);
      const idleKey = `${monsterId}.idle`;
      if (this.anims.exists(idleKey)) this.monster.play(idleKey);
    }
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
        if (this.anims.exists(`${this.currentMonsterId}.hit`)) {
          this.monster.play(`${this.currentMonsterId}.hit`);
        }
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
        if (!this.reducedEffects()) {
          this.cameras.main.shake(140, 0.006);
        }
      } else if (event.type === 'DEFENSE_STARTED') {
        if (this.anims.exists(`${this.currentMonsterId}.attack`)) {
          this.monster.play(`${this.currentMonsterId}.attack`);
        }
        this.hitText.setText('Defend!');
      } else if (event.type === 'DEFENSE_SUCCESS') {
        this.hitText.setText('Blocked');
        this.time.delayedCall(700, () => this.hitText.setText(''));
      } else if (event.type === 'BREAK_STARTED') {
        if (this.anims.exists(`${this.currentMonsterId}.attack`)) {
          this.monster.play(`${this.currentMonsterId}.attack`);
        }
        this.hitText.setText('Break!');
      } else if (event.type === 'BREAK_PROGRESS') {
        this.hitText.setText('Hit!');
        this.time.delayedCall(400, () => this.hitText.setText(''));
      } else if (event.type === 'PART_BROKEN') {
        this.hitText.setText('Broken');
        this.time.delayedCall(900, () => this.hitText.setText(''));
      } else if (event.type === 'VICTORY') {
        if (this.anims.exists(`${this.currentMonsterId}.defeat`)) {
          this.monster.play(`${this.currentMonsterId}.defeat`);
        }
        this.hitText.setText('Victory');
      } else if (event.type === 'DEFEAT') {
        if (this.anims.exists('hunter.default.defeat')) {
          this.hunter.play('hunter.default.defeat');
        }
        this.hitText.setText('Defeat');
      }
    }
  }

  applyState(state: HuntState): void {
    this.setMonster(state.monsterId);
    if (state.status === 'ready' || state.status === 'active') {
      if (state.prompt?.kind !== 'defense' && state.prompt?.kind !== 'break') {
        if (this.anims.exists('hunter.default.idle')) this.hunter.play('hunter.default.idle');
        const idleKey = `${this.currentMonsterId}.idle`;
        if (this.currentMonsterId && this.anims.exists(idleKey)) this.monster.play(idleKey);
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
