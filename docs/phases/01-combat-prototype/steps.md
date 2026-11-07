# Phase 01 — Combat Prototype

> **Status:** Complete — packaged, smoke-tested, and playtested (2026-11-06)
> **Goal:** Prove that attacking monsters by typing feels fun in a working desktop window.
> **Scope:** One hunter, one placeholder monster, one short hunt. No progression economy yet.
> **Dependencies:** None
> **Next:** [Phase 02 — Complete Hunt](../02-complete-hunt/steps.md)

## Deliverable

A runnable Windows desktop prototype with a basic Tauri shell, a Phaser scene containing placeholder hunter/monster visuals, a React typing HUD, deterministic word attacks, victory/defeat, and reliable pause-on-focus-loss behavior. **Met.**

## Current progress (2026-11-06)

Agreed order change (ADR 0001): build the framework-free domain/controller layer before the Tauri shell, because Rust and the MSVC C++ build tools were not installed yet on the development machine. This reversed steps 1 and 3–4; the phase checklist stays unchecked until each behavior is verified end to end. All items are now verified.

Verified with Vitest (`npm test`, 31 tests) and TypeScript strict typecheck (`npm run typecheck`), plus a packaged release build (`npm run tauri build`) and five manual playtest rounds:

- Typing acceptance (`applyTypedCharacter`): case-insensitive letters, mistype resets combo without losing correct word progress, non-letter/Backspace input ignored.
- Damage (`calculateDamage`): combo bonus with cap, flawless-word multiplier, minimum 1 damage.
- Hunt controller: `ready/active/paused/victory/defeat/abandoned`, one attack per completed word, one monster attack per cadence, pause shifts the attack deadline, exactly-once terminal states, unique prompt per word with no immediate repeats.
- Tauri 2 shell: borderless, fixed 720×405, hidden until placed above the taskbar, drag/minimize/close, optional always-on-top, focus-loss pause with explicit Resume.
- Phaser placeholder scene: ground, hunter, and monster rectangles; attack/hit tweens, mistype shake, victory/defeat tint; driven by controller events only.
- SQLite spike: `player_progress` + `app_settings`, versioned migration, idempotent seed, `load_game_save` / `set_setting` commands, round-trip verified across restart.
- 26 domain/controller tests + 5 placement tests.

## Steps

### 1. Bootstrap the application

- [x] Create Tauri 2 + React + TypeScript + Vite project.
- [x] Add Phaser and a minimal game viewport embedded in the React UI.
- [x] Configure TypeScript strict mode, formatter/linter, unit test runner. *(TS strict + Vitest done; formatter/linter deferred to cleanup.)*
- [x] Add `src/game/domain`, `controller`, `renderer`, `input`, `content`, `platform` directories only as needed.
- [x] Confirm development window launches on Windows and builds a desktop package.

### 2. Build one placeholder encounter

- [x] Draw a simple hunter, monster, ground, and hit effect (rectangles/sprites are fine).
- [x] Show player HP, monster HP, one target word, and combo count.
- [x] Create a one-monster definition with an authored word pool.
- [x] Initialize one hunt from a Start Hunt action and offer a replay action.

### 3. Implement typing-to-attack rules

- [x] Create a focusable input exclusively active during a hunt.
- [x] Compare typed letters with the expected next character, case-insensitively.
- [x] Correct letters advance; incorrect letters show an error and reset combo.
- [x] Completing a word triggers **exactly one** attack and generates a new word.
- [x] Calculate damage in pure TypeScript, not in the Phaser scene.
- [x] Display strike animation and damage feedback without blocking input processing.
- [x] Decide and test how non-letter keys and Backspace are handled (see `design.md`).

### 4. Add elementary encounter state

- [x] Implement `ready`, `active`, `paused`, `victory`, and `defeat` states.
- [x] Apply a simple, clearly telegraphed monster attack at intervals.
- [x] Reduce player HP once per enemy attack that lands.
- [x] Stop combat immediately on either side reaching zero HP.
- [x] Prevent attacks, timers, and keystrokes after a terminal state.

### 5. Validate taskbar-window feasibility early

- [x] Configure a small borderless window placed near (not inside) the taskbar.
- [x] Pause simulation on Alt+Tab, minimize, hide, or focus loss.
- [x] Require a deliberate Resume click after refocusing.
- [x] Confirm typing in another program does **not** reach the game.
- [x] Confirm game remains usable on the developer's intended monitor/scaling setup.

### 6. Persistence spike (minimal)

- [x] Open a local SQLite database through the proposed Tauri/Rust persistence bridge.
- [x] Apply a first versioned migration and load a starter profile.
- [x] Restart the app and verify a trivial saved setting/profile value survives.
- [x] Do **not** build full inventory or progression yet.

### 7. Tests and feedback

- [x] Unit tests: correct character, incorrect character, word completion, combo reset.
- [x] Controller tests: attack once, victory once, input ignored while paused.
- [x] Manual smoke test: focus loss during an enemy countdown freezes it.
- [x] Complete at least five short playtest rounds and record friction notes.
- [x] Refine feedback/readability based on playtesting before adding content. *(No changes required — playtest reported no blocking friction.)*

## Definition of done

A tester can launch the packaged app, select **Start Hunt**, defeat the placeholder monster by typing, experience a readable incoming attack, replay the encounter, and Alt+Tab safely. One action never results in duplicate damage. The first local save round-trip works. **Met.**

## Explicitly defer

Inventory, material drops, boss phases, equipment, skills, multiple maps, polished sprites, gacha, and online features.

## End-of-phase notes

- **What felt good:** Core typing-to-damage loop works and the combo/climb is readable; focus-loss pause is reliable; borderless window placement and Pin toggle behaved as designed; Phaser scene gives clear hit feedback without blocking input.
- **What felt frustrating:** Nothing blocking reported across five playtest rounds. Minor: 6 s attack cadence and 7-word kill length are tuning candidates for Phase 02 balance, not blockers.
- **Decisions changed:** Domain-first order (ADR 0001) — framework-free logic before the Tauri shell due to missing Rust/MSVC toolchain; formatter/linter deferred to cleanup; Phaser mounted behind the React HUD rather than as the primary input surface.