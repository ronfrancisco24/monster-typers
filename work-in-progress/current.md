# Current Work

Last updated: 2026-11-09

## Objective

Phase 03 — Progression and Equipment. Steps 1–2 done; step 3 (Materials and crafting) is next.

## Current Status

Phase 03 steps 1–2 complete. Step 2 added skill catalog (3 skills: Power Strike, Quick Reflexes, Lucky Hands), Skill screen, derived combat/drop bonuses wired into HuntScreen, atomic purchase_skill_rank (Rust), migration 003. 55 TS tests + 6 Rust tests passing. Steps 3–6 remain.

## Completed

- Phase 01 fully closed.
- Phase 02 steps 1–5 complete.
- Phase 03 step 1: Leveling.
- Phase 03 step 2: Skills system.
  - `src/game/domain/skills.ts`: catalog types, 3 skills, derived bonus helpers.
  - `src-tauri/src/migrations/003_skill_ranks.sql` + migrate v3.
  - `purchase_skill_rank` command (atomic, insufficient-points protection).
  - `SkillsScreen.tsx`: cost, next-rank effect, max-rank status, buy button, current bonuses.
  - HuntScreen: applies attack damage + defense window bonuses to controller; gather bonus to drops.
  - App/Hub: Skills navigation.

## In Progress

Phase 03 step 3 (Materials and crafting) — not started.

## Remaining

- Phase 03 steps 3–6: crafting, equipping/derived stats, persistence/migration, gameplay test.
- Phase 02 step 6: verification + playtest (still open).

## Blockers

None.

## Relevant Files

- `src/game/domain/skills.ts`
- `src-tauri/src/db.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`
- `src-tauri/src/migrations/003_skill_ranks.sql`
- `src/app/screens/SkillsScreen.tsx`
- `src/app/screens/HuntScreen.tsx`
- `src/app/App.tsx`, `src/app/screens/HubScreen.tsx`
- `docs/phases/03-progression/steps.md`

## Relevant Memory

- [[architecture/decisions/0001-domain-first-before-tauri-shell]]
- [[project/stack]]

## Next Recommended Step

Phase 03 step 3: Materials and crafting. Define equipment + recipe types with stable IDs, show crafting requirements with owned quantities, implement atomic craft_equipment (inventory deduction + ownership grant), prevent duplicate crafting, return meaningful messages, and provide one reachable forest armor recipe end-to-end. Start with equipment/recipe domain types and a Crafting screen.