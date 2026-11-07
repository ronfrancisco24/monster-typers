# Current Work

Last updated: 2026-11-06

## Objective

Phase 02 — Complete Hunt Loop. Combat depth (step 3) implemented; loot/XP (step 4) is next.

## Current Status

Phase 02 steps 1–3 complete. Step 3 added optional part-break prompt with gauge (breaks once per hunt), a second monster (Bristle Boar) as a data-driven behavior difference, break/defense/attack prompt priority, and clearer feedback (flawless, combo-lost, break, part-broken). 37 tests passing. Step 4 (loot/XP with seeded RNG) not started.

## Completed

- Phase 01 fully closed.
- Phase 02 step 1: hub + Hunt Board (now lists Moss Slime and Bristle Boar), Return-to-Hub.
- Phase 02 step 2: defensive typing end to end.
- Phase 02 step 3: combat depth.
  - `Prompt.kind` now `'attack' | 'defense' | 'break'`; `HuntState.part` tracks gauge/threshold/broken.
  - `MonsterDefinition.breakPart` (id, name, words, threshold, intervalMs, bonusMaterialId).
  - Controller: break timer, startBreak, break typing increments gauge, breaks once, defense interrupts break (BREAK_LOST), pause shifts break timer, abandon clears it.
  - New events: BREAK_STARTED, BREAK_PROGRESS, PART_BROKEN, BREAK_LOST.
  - Moss Slime: break part "Moss Crown" (threshold 2, interval 8s); Bristle Boar: "Boar Tusk".
  - HuntScreen accepts a `monster` prop; HubScreen starts hunts with the selected monster.
  - HUD: part gauge row, break banner, flawless/combo-lost flashes, part-broken bonus line.
  - Phaser: break/part-broken visuals.
  - Tests: 37 passing (added break-appears, two-breaks-break-part, defense-interrupts-break).

## In Progress

Loot and experience (Phase 02 step 4) — not started.

## Remaining (Phase 02)

- Step 4: material catalog with stable IDs, seeded RNG drops + XP, part-bonus material on victory, results summary with correct numbers; defeat/abandon no materials.
- Step 5: `hunt_history` + `inventory_materials` tables, `finalize_hunt` (idempotent, atomic), Inventory screen, UI shows only committed rewards.
- Step 6: verification (defense/priority/repeated part-break, drop ranges + reproducibility, double settlement, rollback, manual win/defeat/abandon/restart/Alt+Tab), playtest.

## Blockers

None.

## Relevant Files

- `src/game/controller/huntController.ts`
- `src/game/domain/types.ts`
- `src/content/monsters.ts`
- `src/app/screens/HubScreen.tsx`
- `src/app/screens/HuntScreen.tsx`
- `src/app/App.tsx`
- `src/game/renderer/huntScene.ts`
- `src/tests/huntController.test.ts`

## Relevant Memory

- [[architecture/decisions/0001-domain-first-before-tauri-shell]]
- [[project/stack]]

## Next Recommended Step

Phase 02 step 4: loot and XP. Add a materials catalog, pure `rollDrops`/`calculateXp` functions with seeded RNG, part-bonus material on victory, and a results overlay showing XP + drops. Then step 5 persistence.