# Phase 01 — Combat Prototype

> **Status:** In progress — framework-free logic layer done, Tauri shell pending toolchain  
> **Goal:** Prove that attacking monsters by typing feels fun in a working desktop window.  
> **Scope:** One hunter, one placeholder monster, one short hunt. No progression economy yet.  
> **Dependencies:** None  
> **Next:** [Phase 02 — Complete Hunt](../02-complete-hunt/steps.md)

## Deliverable

A runnable Windows desktop prototype with a basic Tauri shell, a Phaser scene containing placeholder hunter/monster visuals, a React typing HUD, deterministic word attacks, victory/defeat, and reliable pause-on-focus-loss behavior.

## Current progress (2026-11-05)

Agreed order change: build the framework-free domain/controller layer before the Tauri shell, because Rust and the MSVC C++ build tools are not installed yet on the development machine. This reverses steps 1 and 3–4; the phase checklist stays unchecked until each behavior is verified end to end.

Done and verified with Vitest (`npm test`) and TypeScript strict typecheck (`npm run typecheck`):

- Typing acceptance (`applyTypedCharacter`): case-insensitive letters, mistype resets combo without losing correct word progress, non-letter/Backspace input ignored.
- Damage (`calculateDamage`): combo bonus with cap, flawless-word multiplier, minimum 1 damage.
- Hunt controller: `ready/active/paused/victory/defeat/abandoned`, one attack per completed word, one monster attack per cadence, pause shifts the attack deadline, exactly-once terminal states, unique prompt per word with no immediate repeats.
- 26 unit tests; one placeholder monster (`monster.moss_slime`) and placeholder hunter stats in `src/content/`.

Remaining: Tauri 2 shell and packaging (step 1), React HUD and Phaser placeholder scene (step 2), focused input wiring and focus-loss pause (steps 3–5), SQLite persistence spike (step 6), playtests (step 7).

## Steps

### 1. Bootstrap the application

- [ ] Create Tauri 2 + React + TypeScript + Vite project.
- [ ] Add Phaser and a minimal game viewport embedded in the React UI.
- [ ] Configure TypeScript strict mode, formatter/linter, unit test runner.
- [ ] Add `src/game/domain`, `controller`, `renderer`, `input`, `content`, `platform` directories only as needed.
- [ ] Confirm development window launches on Windows and builds a desktop package.

### 2. Build one placeholder encounter

- [ ] Draw a simple hunter, monster, ground, and hit effect (rectangles/sprites are fine).
- [ ] Show player HP, monster HP, one target word, and combo count.
- [ ] Create a one-monster definition with an authored word pool.
- [ ] Initialize one hunt from a Start Hunt action and offer a replay action.

### 3. Implement typing-to-attack rules

- [ ] Create a focusable input exclusively active during a hunt.
- [ ] Compare typed letters with the expected next character, case-insensitively.
- [ ] Correct letters advance; incorrect letters show an error and reset combo.
- [ ] Completing a word triggers **exactly one** attack and generates a new word.
- [ ] Calculate damage in pure TypeScript, not in the Phaser scene.
- [ ] Display strike animation and damage feedback without blocking input processing.
- [ ] Decide and test how non-letter keys and Backspace are handled (see `design.md`).

### 4. Add elementary encounter state

- [ ] Implement `ready`, `active`, `paused`, `victory`, and `defeat` states.
- [ ] Apply a simple, clearly telegraphed monster attack at intervals.
- [ ] Reduce player HP once per enemy attack that lands.
- [ ] Stop combat immediately on either side reaching zero HP.
- [ ] Prevent attacks, timers, and keystrokes after a terminal state.

### 5. Validate taskbar-window feasibility early

- [ ] Configure a small borderless window placed near (not inside) the taskbar.
- [ ] Pause simulation on Alt+Tab, minimize, hide, or focus loss.
- [ ] Require a deliberate Resume click after refocusing.
- [ ] Confirm typing in another program does **not** reach the game.
- [ ] Confirm game remains usable on the developer's intended monitor/scaling setup.

### 6. Persistence spike (minimal)

- [ ] Open a local SQLite database through the proposed Tauri/Rust persistence bridge.
- [ ] Apply a first versioned migration and load a starter profile.
- [ ] Restart the app and verify a trivial saved setting/profile value survives.
- [ ] Do **not** build full inventory or progression yet.

### 7. Tests and feedback

- [ ] Unit tests: correct character, incorrect character, word completion, combo reset.
- [ ] Controller tests: attack once, victory once, input ignored while paused.
- [ ] Manual smoke test: focus loss during an enemy countdown freezes it.
- [ ] Complete at least five short playtest rounds and record friction notes.
- [ ] Refine feedback/readability based on playtesting before adding content.

## Definition of done

A tester can launch the packaged app, select **Start Hunt**, defeat the placeholder monster by typing, experience a readable incoming attack, replay the encounter, and Alt+Tab safely. One action never results in duplicate damage. The first local save round-trip works.

## Explicitly defer

Inventory, material drops, boss phases, equipment, skills, multiple maps, polished sprites, gacha, and online features.

## End-of-phase notes

- **What felt good:** _To fill in after playtest_
- **What felt frustrating:** _To fill in after playtest_
- **Decisions changed:** _To fill in after implementation_
