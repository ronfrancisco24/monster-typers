import Phaser from 'phaser';
import { findRetroHuntAudio, RETRO_HUNT_AUDIO } from './audioMap';

export class RetroAudioManager {
  scene: Phaser.Scene;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  currentMusic: Phaser.Sound.BaseSound | null;
  currentMusicKey: string | null;
  correctIndex: number;
  lastPlayed: Map<string, number>;
  reducedEffects: boolean;

  constructor(scene: Phaser.Scene, opts: { musicVolume?: number; sfxVolume?: number; muted?: boolean; reducedEffects?: boolean } = {}) {
    this.scene = scene;
    this.musicVolume = Math.max(0, Math.min(1, opts.musicVolume ?? 1));
    this.sfxVolume = Math.max(0, Math.min(1, opts.sfxVolume ?? 1));
    this.muted = opts.muted ?? false;
    this.reducedEffects = opts.reducedEffects ?? false;
    this.currentMusic = null;
    this.currentMusicKey = null;
    this.correctIndex = 0;
    this.lastPlayed = new Map();
  }

  useScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  unlockFromGesture(): void {
    const ctx = (this.scene.sound as { context?: AudioContext }).context;
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  setMuted(value: boolean): void {
    this.muted = value;
    this.scene.sound.mute = value;
  }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value));
    const asset = this.currentMusicKey ? findRetroHuntAudio(this.currentMusicKey) : null;
    if (this.currentMusic && this.currentMusic.isPlaying && asset) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(asset.recommendedVolume * this.musicVolume);
    }
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  }

  setReducedEffects(value: boolean): void {
    this.reducedEffects = value;
  }

  play(key: string, opts: { volume?: number; cooldownMs?: number } = {}): boolean {
    const asset = findRetroHuntAudio(key);
    if (!asset || asset.type !== 'sfx' || !this.scene.cache.audio.exists(key)) return false;
    if (this.muted) return false;
    const now = this.scene.time.now;
    const prev = this.lastPlayed.get(key) ?? -Infinity;
    if (now - prev < (opts.cooldownMs ?? 0)) return false;
    this.lastPlayed.set(key, now);
    const snd = this.scene.sound.play(key, {
      volume: asset.recommendedVolume * this.sfxVolume * (opts.volume ?? 1),
    });
    return !!snd;
  }

  playTypingCorrect(): boolean {
    const variants = ['sfx.typing.correct_01', 'sfx.typing.correct_02', 'sfx.typing.correct_03'];
    const key = variants[this.correctIndex++ % variants.length]!;
    return this.play(key, { cooldownMs: 28 });
  }

  playTypingError(): boolean {
    return this.play('sfx.typing.error', { cooldownMs: 90 });
  }

  playWordComplete(): boolean {
    return this.play('sfx.typing.word_complete');
  }

  playStreakStart(): boolean {
    return this.play('sfx.typing.streak_start');
  }

  playStreakBreak(): boolean {
    return this.play('sfx.typing.streak_break');
  }

  playDefenseReady(): boolean {
    return this.play('sfx.typing.defense_ready');
  }

  playCombat(key: string, cooldownMs = 0): boolean {
    return this.play(key, { cooldownMs });
  }

  playMonsterAttack(monsterId: string): boolean {
    return this.play(`sfx.monster.${monsterId.replace('monster.', '')}.attack`);
  }

  playMonsterRoar(monsterId: string): boolean {
    const id = monsterId.replace('monster.', '');
    return this.play(`sfx.monster.${id}.roar`);
  }

  playMonsterDefeat(monsterId: string): boolean {
    const id = monsterId.replace('monster.', '');
    return this.play(`sfx.monster.${id}.defeat`);
  }

  playUi(key: 'hover' | 'select' | 'back' | 'confirm'): boolean {
    return this.play(`sfx.ui.${key}`);
  }

  playLoot(key: 'material_drop' | 'pickup' | 'rare_drop' | 'reward_reveal'): boolean {
    return this.play(`sfx.loot.${key}`);
  }

  playEquipment(key: 'equip' | 'craft' | 'upgrade' | 'skill_unlock'): boolean {
    return this.play(`sfx.equipment.${key}`);
  }

  playProgression(key: 'hunt_start' | 'hunt_victory' | 'hunt_failed'): boolean {
    return this.play(`sfx.progression.hunt_${key.replace('hunt_', '')}`);
  }

  playMusic(key: string, fadeMs = 650): boolean {
    const asset = findRetroHuntAudio(key);
    if (!asset || asset.type !== 'bgm' || !this.scene.cache.audio.exists(key)) return false;
    if (this.muted) return false;
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return true;

    const oldMusic = this.currentMusic;
    const newMusic = this.scene.sound.add(key, { loop: asset.loop, volume: 0 });
    this.currentMusic = newMusic;
    this.currentMusicKey = key;
    newMusic.play();
    this.scene.tweens.add({
      targets: newMusic,
      volume: asset.recommendedVolume * this.musicVolume,
      duration: fadeMs,
      onComplete: () => {
        if (!asset.loop) {
          newMusic.once('complete', () => {
            if (this.currentMusic === newMusic) {
              this.currentMusic = null;
              this.currentMusicKey = null;
            }
            newMusic.destroy();
          });
        }
      },
    });
    if (oldMusic) {
      this.scene.tweens.add({
        targets: oldMusic,
        volume: 0,
        duration: fadeMs,
        onComplete: () => { oldMusic.stop(); oldMusic.destroy(); },
      });
    }
    return true;
  }

  playMusicForRegion(region: 'forest' | 'caverns' | 'ashen'): boolean {
    const key = region === 'forest' ? 'bgm.verdant_forest' : region === 'caverns' ? 'bgm.crystal_caverns' : 'bgm.ashen_wastes';
    return this.playMusic(key);
  }

  playMenuMusic(): boolean {
    return this.playMusic('bgm.menu_hearth');
  }

  playVictoryMusic(): boolean {
    return this.playMusic('bgm.hunt_victory');
  }

  stopMusic(fadeMs = 300): void {
    const oldMusic = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = null;
    if (!oldMusic) return;
    if (!fadeMs) { oldMusic.stop(); oldMusic.destroy(); return; }
    this.scene.tweens.add({
      targets: oldMusic,
      volume: 0,
      duration: fadeMs,
      onComplete: () => { oldMusic.stop(); oldMusic.destroy(); },
    });
  }
}
