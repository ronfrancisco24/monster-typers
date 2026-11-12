import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio {
  static instances: FakeAudio[] = [];
  volume = 1;
  muted = false;
  paused = true;
  currentTime = 0;
  loop = false;
  preload = '';
  readyState = 4;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  addEventListener = vi.fn();

  constructor() {
    FakeAudio.instances.push(this);
  }
}

async function loadUiAudio() {
  vi.resetModules();
  return import('../platform/uiAudio');
}

describe('uiAudio', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies music volume changes to the track already playing', async () => {
    const ui = await loadUiAudio();
    ui.playMusic('bgm.menu_hearth');

    const track = FakeAudio.instances[0]!;
    expect(track.volume).toBeCloseTo(0.4 * 0.7);

    ui.setUiMusicVolume(0.2);
    expect(track.volume).toBeCloseTo(0.4 * 0.2);
  });

  it('mutes the playing track immediately and unmutes it', async () => {
    const ui = await loadUiAudio();
    ui.playMusic('bgm.menu_hearth');
    const track = FakeAudio.instances[0]!;

    ui.setUiMuted(true);
    expect(track.muted).toBe(true);

    ui.setUiMuted(false);
    expect(track.muted).toBe(false);
  });

  it('starts music muted so unmuting reveals it', async () => {
    const ui = await loadUiAudio();
    ui.setUiMuted(true);
    ui.playMusic('bgm.menu_hearth');

    const track = FakeAudio.instances[0]!;
    expect(track.muted).toBe(true);
    expect(track.play).toHaveBeenCalled();

    ui.setUiMuted(false);
    expect(track.muted).toBe(false);
  });
});
