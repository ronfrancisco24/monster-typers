import Phaser from 'phaser';
import type { HuntEvent, HuntState } from '../domain/types';
import { preloadRetroHunt, createRetroHuntAnimations, regionForMonster } from './assetLoader';
import { playMusic as playHtmlMusic } from '../../platform/uiAudio';
import { createArmorOverlayLayer, type ArmorOverlayLayer } from './armorOverlay';
import { RetroAudioManager } from '../audio/audioManager';
import { preloadRetroHuntAudio } from '../audio/audioMap';

export class HuntScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.TileSprite;
  private hunter!: Phaser.GameObjects.Sprite;
  private monster!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Image;
  private hitText!: Phaser.GameObjects.Text;
  private currentMonsterId: string | null = null;
  private huntStarted = false;
  private equipmentLoadout: Record<string, string> = {};
  private armor: ArmorOverlayLayer | null = null;
  private audio: RetroAudioManager | null = null;

  constructor() {
    super('HuntScene');
  }

  preload(): void {
    preloadRetroHunt(this);
    preloadRetroHuntAudio(this);
  }

  create(): void {
    createRetroHuntAnimations(this);

    const { width, height } = this.scale;

    this.background = this.add.image(width / 2, height / 2, 'map.forest').setOrigin(0.5);
    this.background.setDisplaySize(width, height);

    this.ground = this.add.tileSprite(width / 2, height - 8, width, 16, 'tile.forest.ground');

    this.hunter = this.add.sprite(110, height - 16, 'hunter.default').setOrigin(0.5, 1);
    if (this.anims.exists('hunter.default.idle')) this.hunter.play('hunter.default.idle');
    this.armor = createArmorOverlayLayer(this, this.hunter);

    const audio = (this.game.registry.get('audio') as RetroAudioManager | undefined) ?? new RetroAudioManager(this);
    audio.useScene(this);
    this.game.registry.set('audio', audio);
    this.audio = audio;
    (window as { __retroAudio?: RetroAudioManager }).__retroAudio = audio;

    this.monster = this.add.sprite(width - 110, height - 16, 'monster.moss_slime').setOrigin(0.5, 1);
    if (this.anims.exists('monster.moss_slime.idle')) this.monster.play('monster.moss_slime.idle');

    this.hitText = this.add
      .text(width / 2, 32, '', { fontFamily: 'Tiny5', fontSize: '22px', color: '#fff9eb', fontStyle: 'bold' })
      .setOrigin(0.5);
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

  playTypingCorrect(): void {
    this.audio?.playTypingCorrect();
  }

  playTypingError(): void {
    this.audio?.playTypingError();
  }

  playUi(key: 'hover' | 'select' | 'back' | 'confirm'): void {
    this.audio?.playUi(key);
  }

  applyAudioSettings(muted: boolean, musicVolume: number, sfxVolume = musicVolume): void {
    if (!this.audio) return;
    this.audio.setMuted(muted);
    this.audio.setMusicVolume(musicVolume);
    this.audio.setSfxVolume(sfxVolume);
  }

  unlockAudio(): void {
    this.audio?.unlockFromGesture();
    const ctx = (this.sound as { context?: AudioContext }).context;
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  applyEvents(events: HuntEvent[]): void {
    for (const event of events) {
      if (event.type === 'HUNT_STARTED') {
        // Audio now starts from applyState (state-driven) so it survives the
        // viewport mount race. Keep only the one-shot monster roar here.
        if (this.currentMonsterId) {
          const isBoss = this.currentMonsterId.includes('guardian') || this.currentMonsterId.includes('serpent') || this.currentMonsterId.includes('wyvern');
          if (isBoss) this.audio?.playMonsterRoar(this.currentMonsterId);
        }
      } else if (event.type === 'PLAYER_ATTACK') {
        this.audio?.play('sfx.combat.swing_light', { cooldownMs: 60 });
        this.audio?.playWordComplete();
        if (event.flawless) this.audio?.play('sfx.combat.critical_hit');
        else this.audio?.play('sfx.combat.hit_light');
        if (this.textures.exists('hunter.default.attack') && this.anims.exists('hunter.default.attack')) {
          this.hunter.setTexture('hunter.default.attack');
          this.hunter.play('hunter.default.attack');
          this.time.delayedCall(420, () => {
            if (this.hunter.active && this.textures.exists('hunter.default')) {
              this.hunter.setTexture('hunter.default');
              if (this.anims.exists('hunter.default.idle')) this.hunter.play('hunter.default.idle');
            }
          });
        }
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
        if (this.currentMonsterId) {
          const hitKey = `${this.currentMonsterId}.hit`;
          if (this.textures.exists(hitKey) && this.anims.exists(hitKey)) {
            this.monster.setTexture(hitKey);
            this.monster.play(hitKey);
            this.time.delayedCall(260, () => {
              if (this.monster.active && this.currentMonsterId && this.textures.exists(this.currentMonsterId)) {
                this.monster.setTexture(this.currentMonsterId);
                const idleKey = `${this.currentMonsterId}.idle`;
                if (this.anims.exists(idleKey)) this.monster.play(idleKey);
              }
            });
          }
        }
        this.hitText.setText(`-${event.damage}`);
        this.time.delayedCall(700, () => this.hitText.setText(''));
      } else if (event.type === 'MONSTER_ATTACK') {
        if (this.currentMonsterId) this.audio?.playMonsterAttack(this.currentMonsterId);
        this.audio?.play('sfx.combat.player_hurt');
        if (this.textures.exists('hunter.default.hit') && this.anims.exists('hunter.default.hit')) {
          this.hunter.setTexture('hunter.default.hit');
          this.hunter.play('hunter.default.hit');
          this.time.delayedCall(260, () => {
            if (this.hunter.active && this.textures.exists('hunter.default')) {
              this.hunter.setTexture('hunter.default');
              if (this.anims.exists('hunter.default.idle')) this.hunter.play('hunter.default.idle');
            }
          });
        }
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
        this.audio?.playTypingError();
        if (!this.reducedEffects()) {
          this.cameras.main.shake(140, 0.006);
        }
      } else if (event.type === 'DEFENSE_STARTED') {
        this.audio?.playDefenseReady();
        if (this.anims.exists(`${this.currentMonsterId}.attack`)) {
          this.monster.play(`${this.currentMonsterId}.attack`);
        }
        this.hitText.setText('Defend!');
      } else if (event.type === 'DEFENSE_SUCCESS') {
        this.audio?.play('sfx.combat.block');
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
        this.audio?.play('sfx.combat.part_break');
        this.hitText.setText('Broken');
        this.time.delayedCall(900, () => this.hitText.setText(''));
      } else if (event.type === 'VICTORY') {
        if (this.currentMonsterId && (this.currentMonsterId.includes('guardian') || this.currentMonsterId.includes('serpent') || this.currentMonsterId.includes('wyvern'))) {
          this.audio?.playMonsterDefeat(this.currentMonsterId);
        }
        // Play the victory stinger through HTMLAudio: the Phaser scene is
        // destroyed the moment the victory overlay renders, which would cut it.
        playHtmlMusic('bgm.hunt_victory');
        if (this.anims.exists(`${this.currentMonsterId}.defeat`)) {
          this.monster.play(`${this.currentMonsterId}.defeat`);
        }
        this.hitText.setText('Victory');
      } else if (event.type === 'DEFEAT') {
        this.audio?.playProgression('hunt_failed');
        if (this.anims.exists('hunter.default.defeat')) {
          this.hunter.play('hunter.default.defeat');
        }
        this.hitText.setText('Defeat');
      } else if (event.type === 'PAUSED') {
        this.audio?.stopMusic(0);
      } else if (event.type === 'RESUMED') {
        // music stays stopped during pause; resume not auto-restarted to avoid restart spam
      }
    }
  }

  setEquipment(loadout: Record<string, string>): void {
    this.equipmentLoadout = { ...loadout };
    if (!this.hunter || !this.armor) return;
    this.armor.setEquipment(loadout);
    this.armor.sync(null);
    this.hunter.clearTint();
  }



  override update(): void {
    if (this.armor && this.hunter) {
      this.armor.sync(null);
    }
  }

  applyState(state: HuntState): void {
    if (!this.hunter || !this.monster || !this.background) return;
    this.setMonster(state.monsterId);
    if (state.status === 'ready') this.huntStarted = false;
    if (state.status === 'active' && !this.huntStarted) {
      this.huntStarted = true;
      this.audio?.unlockFromGesture();
      this.audio?.playProgression('hunt_start');
      const isBoss = state.monsterId.includes('guardian') || state.monsterId.includes('serpent') || state.monsterId.includes('wyvern');
      if (isBoss) this.audio?.playMonsterRoar(state.monsterId);
    }
    if (state.status === 'active') {
      this.audio?.playMusicForRegion(regionForMonster(state.monsterId));
    }
    if (state.status === 'ready' || state.status === 'active') {
      if (state.prompt?.kind !== 'defense' && state.prompt?.kind !== 'break') {
        const hunterAnim = this.hunter.anims.currentAnim?.key;
        const hunterBusy =
          this.hunter.anims.isPlaying &&
          (hunterAnim === 'hunter.default.attack' ||
            hunterAnim === 'hunter.default.hit' ||
            hunterAnim === 'hunter.default.defeat');
        if (!hunterBusy) {
          if (this.textures.exists('hunter.default') && this.hunter.texture.key !== 'hunter.default') {
            this.hunter.setTexture('hunter.default');
          }
          if (this.anims.exists('hunter.default.idle')) this.hunter.play('hunter.default.idle', true);
        }
        if (this.currentMonsterId) {
          const id = this.currentMonsterId;
          const idleKey = `${id}.idle`;
          const monsterAnim = this.monster.anims.currentAnim?.key;
          const monsterBusy =
            this.monster.anims.isPlaying &&
            (monsterAnim === `${id}.hit` ||
              monsterAnim === `${id}.attack` ||
              monsterAnim === `${id}.defeat`);
          if (!monsterBusy) {
            if (this.textures.exists(id) && this.monster.texture.key !== id) {
              this.monster.setTexture(id);
            }
            if (this.anims.exists(idleKey)) this.monster.play(idleKey, true);
          }
        }
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
