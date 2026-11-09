# Current Work

Last updated: 2026-11-09

## Objective

Phase 02 — Complete Hunt Loop. Step 5 (transactional persistence) implemented; verification (step 6) is next.

## Current Status

Phase 02 steps 1–5 complete. Step 5 added migration 002 (hunt_history, inventory_materials), idempotent atomic `finalize_hunt` in Rust, controller stats, settlement flow in HuntScreen (shows only committed rewards), and an Inventory screen. 48 TS tests + 4 Rust tests passing. Step 6 (verification + playtest) not started.

## Completed

- Phase 01 fully closed.
- Phase 02 steps 1–4 complete.
- Phase 02 step 5: transactional local persistence.
  - Migration 002: hunt_history + inventory_materials tables and indexes; user_version 2.
  - `finalize_hunt` command: validates input, idempotent on duplicate hunt_id, atomic transaction (history + XP + inventory), returns committed summary.
  - `load_game_save` now returns inventory.
  - Controller: correct/incorrect keystrokes, words completed, duration; `getStats()`.
  - HuntScreen: settles once per hunt on terminal state; shows "Settling…", committed XP/loot, or error with Retry.
  - InventoryScreen: lists stored materials with names/quantities; empty state; reachable from Hub.
  - Rust tests: 4 passing (migration v2, victory pays once, defeat pays nothing, invalid input rollback).

## In Progress

Verification and playtest (Phase 02 step 6) — not started.

## Remaining (Phase 02)

- Step 6: tests for defense success/failure, prompt priority, repeated part-break input (done), drop ranges + seeded reproducibility (done), double settlement (Rust done), rollback (Rust done), manual win/defeat/abandon/restart/Alt+Tab + persisted values, playtest pace.

## Blockers

None.

## Relevant Files

- `src-tauri/src/db.rs`
- `src-tauri/src/commands.rs`
- `src-tauri/src/migrations/002_hunt_history.sql`
- `src/persistence/types.ts`, `src/persistence/gameRepository.ts`
- `src/game/controller/huntController.ts`
- `src/app/screens/HuntScreen.tsx`
- `src/app/screens/InventoryScreen.tsx`
- `src/app/screens/HubScreen.tsx`
- `src/app/App.tsx`

## Relevant Memory

- [[architecture/decisions/0001-domain-first-before-tauri-shell]]
- [[project/stack]]

## Next Recommended Step

Phase 02 step 6: verification. Run the app, complete win/defeat/abandon flows, check inventory persists across restart, retry settlement, Alt+Tab pause, and tune pace. Add any missing automated tests (e.g., controller stats). Then playtest and fill end-of-phase notes.