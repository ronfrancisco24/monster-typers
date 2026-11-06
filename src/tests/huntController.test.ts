import { describe, expect, it } from 'vitest';
import { hunterDefinition } from '../content/hunter';
import { mossSlime } from '../content/monsters';
import {
  createHuntController,
  type HuntController,
} from '../game/controller/huntController';
import type { HuntEvent, MonsterDefinition } from '../game/domain/types';

function setup(monster: MonsterDefinition = mossSlime) {
  let time = 0;
  const controller = createHuntController({
    huntId: 'hunt-1',
    monster,
    playerMaxHp: hunterDefinition.baseMaxHp,
    baseAttackDamage: hunterDefinition.baseAttackDamage,
    now: () => time,
    random: () => 0,
  });

  return {
    controller,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

function completePromptWord(controller: HuntController): string {
  const word = controller.getState().prompt?.word;
  if (word === undefined) {
    throw new Error('Expected an active prompt');
  }
  for (const char of word) {
    controller.typeCharacter(char);
  }
  return word;
}

function eventsOfType(events: HuntEvent[], type: HuntEvent['type']): HuntEvent[] {
  return events.filter((event) => event.type === type);
}

describe('huntController', () => {
  it('starts ready with full health and no prompt', () => {
    const { controller } = setup();
    const state = controller.getState();

    expect(state.status).toBe('ready');
    expect(state.playerHp).toBe(hunterDefinition.baseMaxHp);
    expect(state.monsterHp).toBe(mossSlime.hp);
    expect(state.prompt).toBeNull();
    expect(controller.drainEvents()).toEqual([]);
  });

  it('starts one hunt with an attack prompt', () => {
    const { controller } = setup();

    controller.start();

    expect(controller.getState().status).toBe('active');
    expect(controller.getState().prompt?.word).toBe(mossSlime.attackWords[0]);
    expect(controller.drainEvents()).toEqual([{ type: 'HUNT_STARTED' }]);

    controller.start();
    expect(controller.drainEvents()).toEqual([]);
  });

  it('deals one hit per completed word and picks a different next word', () => {
    const { controller } = setup();
    controller.start();
    controller.drainEvents();

    const firstWord = completePromptWord(controller);
    const events = controller.drainEvents();
    const hits = eventsOfType(events, 'PLAYER_ATTACK');

    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual({
      type: 'PLAYER_ATTACK',
      word: firstWord,
      damage: 8,
      flawless: true,
    });
    expect(controller.getState().monsterHp).toBe(mossSlime.hp - 8);
    expect(controller.getState().prompt?.word).not.toBe(firstWord);
  });

  it('resets the combo and reports the expected letter on a mistype', () => {
    const { controller } = setup();
    controller.start();
    completePromptWord(controller);
    expect(controller.getState().combo).toBe(1);
    controller.drainEvents();

    const expected = controller.getState().prompt?.word.charAt(0);
    controller.typeCharacter('x');

    expect(controller.getState().combo).toBe(0);
    expect(controller.drainEvents()).toEqual([{ type: 'MISTYPE', expected }]);
  });

  it('applies one monster attack when the cadence elapses', () => {
    const { controller, advance } = setup();
    controller.start();
    controller.drainEvents();

    advance(mossSlime.attackCadenceMs - 1);
    controller.tick();
    expect(controller.getState().playerHp).toBe(hunterDefinition.baseMaxHp);
    expect(controller.drainEvents()).toEqual([]);

    advance(1);
    controller.tick();
    expect(controller.getState().playerHp).toBe(
      hunterDefinition.baseMaxHp - mossSlime.attackDamage,
    );
    expect(controller.drainEvents()).toEqual([
      { type: 'MONSTER_ATTACK', damage: mossSlime.attackDamage },
    ]);

    controller.tick();
    expect(controller.drainEvents()).toEqual([]);
  });

  it('does not queue several attacks after a long stall', () => {
    const { controller, advance } = setup();
    controller.start();

    advance(mossSlime.attackCadenceMs * 10);
    controller.tick();

    expect(controller.getState().playerHp).toBe(
      hunterDefinition.baseMaxHp - mossSlime.attackDamage,
    );
    expect(eventsOfType(controller.drainEvents(), 'MONSTER_ATTACK')).toHaveLength(1);
  });

  it('freezes the attack deadline while paused and restores it on resume', () => {
    const { controller, advance } = setup();
    controller.start();
    advance(3000);
    controller.pause();
    expect(controller.drainEvents()).toEqual([{ type: 'HUNT_STARTED' }, { type: 'PAUSED' }]);

    advance(60_000);
    controller.tick();
    expect(controller.getState().playerHp).toBe(hunterDefinition.baseMaxHp);

    controller.resume();
    advance(mossSlime.attackCadenceMs - 3000 - 1);
    controller.tick();
    expect(controller.getState().playerHp).toBe(hunterDefinition.baseMaxHp);

    advance(1);
    controller.tick();
    expect(controller.getState().playerHp).toBe(
      hunterDefinition.baseMaxHp - mossSlime.attackDamage,
    );
  });

  it('ignores typing while paused and after a terminal state', () => {
    const { controller } = setup();
    controller.start();
    const word = controller.getState().prompt?.word ?? '';
    controller.pause();
    controller.drainEvents();

    for (const char of word) {
      controller.typeCharacter(char);
    }
    expect(controller.getState().monsterHp).toBe(mossSlime.hp);
    expect(controller.drainEvents()).toEqual([]);

    controller.resume();
    controller.abandon();
    controller.drainEvents();
    for (const char of word) {
      controller.typeCharacter(char);
    }
    expect(controller.drainEvents()).toEqual([]);
  });

  it('settles victory exactly once', () => {
    const { controller } = setup({ ...mossSlime, hp: 5 });
    controller.start();
    controller.drainEvents();

    completePromptWord(controller);
    const events = controller.drainEvents();

    expect(controller.getState().status).toBe('victory');
    expect(controller.getState().prompt).toBeNull();
    expect(eventsOfType(events, 'VICTORY')).toHaveLength(1);

    controller.typeCharacter('a');
    controller.tick();
    expect(controller.drainEvents()).toEqual([]);
  });

  it('settles defeat exactly once', () => {
    const { controller, advance } = setup();
    controller.start();
    controller.drainEvents();

    // 30 HP at 8 damage per hit: the fourth hit defeats.
    for (let hit = 1; hit <= 4; hit += 1) {
      advance(mossSlime.attackCadenceMs);
      controller.tick();
    }

    const events = controller.drainEvents();
    expect(controller.getState().status).toBe('defeat');
    expect(controller.getState().playerHp).toBe(0);
    expect(eventsOfType(events, 'MONSTER_ATTACK')).toHaveLength(4);
    expect(eventsOfType(events, 'DEFEAT')).toHaveLength(1);

    advance(mossSlime.attackCadenceMs);
    controller.tick();
    expect(controller.drainEvents()).toEqual([]);
  });

  it('abandons only an active or paused hunt', () => {
    const { controller } = setup();
    controller.abandon();
    expect(controller.getState().status).toBe('ready');
    expect(controller.drainEvents()).toEqual([]);

    controller.start();
    controller.abandon();
    controller.drainEvents();

    expect(controller.getState().status).toBe('abandoned');
    expect(controller.getState().prompt).toBeNull();
  });
});
