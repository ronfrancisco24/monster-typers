# Agent Instructions — Taskbar Hunter

> Instructions for an AI coding assistant or any contributor working in this repository.

## Project context

Taskbar Hunter is a **Windows-first, offline, single-player typing-combat monster-hunting desktop game**. It uses a small window near the Windows taskbar. Core gameplay is type → attack/defend → win → collect materials → craft armor / upgrade skills → unlock harder hunts.

The MVP is tightly scoped: 3 maps, 12 monsters (3 bosses), 9 armor items, 9 skills, and a single local player save. Read the docs before implementing features.

## Read in this order

1. [`product.md`](./product.md) — intended player experience and principles.
2. [`mvp.md`](./mvp.md) — exact release scope, exclusions, acceptance criteria.
3. [`design.md`](./design.md) — gameplay/UI rules and input behavior.
4. [`architecture.md`](./architecture.md) — system responsibilities, file boundaries, persistence lifecycle.
5. [`data.md`](./data.md) — catalog IDs, schema, migrations, invariants.
6. [`phases/*/steps.md`](./phases/01-combat-prototype/steps.md) — implementation sequence.
7. [`later-features.md`](./later-features.md) — deferred ideas; **do not implement as MVP by default**.

### How to resolve conflicts

- `mvp.md` wins on **scope**.
- `design.md` wins on **combat behavior and UX**.
- `architecture.md` wins on **technical boundaries and module ownership**.
- `data.md` wins on **persistent data and schema rules**.
- Phase steps explain **order of work** and must be updated when an agreed implementation decision changes.

If two docs contradict each other, **call out the contradiction and update the relevant docs** rather than silently guessing.

## Working rules

1. Work on the **earliest incomplete phase** unless a task explicitly says otherwise.
2. For each task, identify the relevant checklist item and a clear definition of done.
3. Make the smallest viable change that delivers a working, testable slice.
4. Keep game rules in plain TypeScript modules, separate from React components and Phaser scenes.
5. Keep Phaser visual/presentational. Never let sprite animation code award damage, XP, loot, or unlocks.
6. Use one authoritative typing input path. Do not register a global keyboard hook.
7. Pause combat whenever the app loses focus, becomes hidden, or is minimized. Resume only when the user explicitly requests it.
8. Use typed contracts for commands, results, content catalogs, and database responses.
9. Use a local SQLite database for player state; static map/monster/recipe catalogs remain bundled, not user-save tables.
10. Update related docs whenever a decision changes the contracted behavior.
11. Do not add dependencies or infrastructure just because they might be useful later.
12. Do not create copyrighted lookalike assets; use placeholder shapes/sprites until original assets are specified.

## MVP boundaries: do not add without permission

- Gacha, currency wallets, pity systems, or monetization.
- Backend APIs, login, PostgreSQL, cloud sync, remote save, analytics.
- Multiplayer, chat, leaderboard, battle passes, daily rewards.
- More than the documented 12 monsters/3 maps/9 pieces/9 skills.
- Global shortcuts, passive auto-hunting, background keyboard interception.
- General-purpose game framework abstractions unrelated to the current feature.

## Preferred implementation approach

- **Small pure functions:** `calculateDamage`, `applyTypedCharacter`, `rollDrops`, `canCraft`, `applyXp`, `checkUnlocks`.
- **Data-driven content:** use stable catalog IDs, schema validation at load time, and tests for missing references.
- **Explicit state transitions:** ready → active → paused → terminal; never settle the same hunt twice.
- **Transactional writes:** crafting, spending points, and hunt finalization are indivisible database operations.
- **Deterministic tests:** inject a clock and seeded RNG for combat/timing/drop testing.
- **Incremental UI:** ship playable functionality with minimal placeholder art before visual polish.
- **Readable code:** avoid `any`, duplicated rule logic, hidden mutations, and oversized all-in-one components.

## Definition of done for any feature

- [ ] It matches the relevant gameplay and MVP specification.
- [ ] It does not break focus safety or offline play.
- [ ] Edge cases and invalid states are handled.
- [ ] Unit/integration tests exist where logic or persistence changes.
- [ ] Relevant phase checklist items are updated only after verification.
- [ ] Relevant documentation is updated for changed rules, schema, or decisions.
- [ ] Manual smoke test describes how to exercise the feature.
- [ ] No placeholders/TODOs remain in the requested behavior, except clearly recorded deferred work.

## Testing emphasis

Test not just the happy path:

- Typing mistakes, empty/invalid keys, interrupted words, duplicate events.
- Defense timeout right as a prompt finishes.
- Focus loss during an active enemy countdown.
- Victory/defeat occurring near the same time.
- App closing during an unfinished hunt.
- Insufficient materials and double-craft attempts.
- Duplicate hunt-settlement command and database reload.
- Upgrading an older save after a migration.
- Monitor resolution/taskbar changes while the window is open.

## Response/report format for coding work

When delivering a change, summarize:

1. **Implemented:** What changed and which phase step it satisfies.
2. **Files:** Main source and documentation files touched.
3. **Verified:** Tests/build/manual checks actually run; distinguish passing from not run.
4. **Remaining:** Known limitations and the next immediate checklist item.

Never claim a build, test, playtest, or installer was verified unless it was actually run. Ask for clarification only when a missing decision would materially change the implementation; otherwise select the documented MVP default.

## Data and UX safety invariants

- Never intercept typing outside a focused active hunt.
- Never apply damage during pause or app focus loss.
- Never award loot twice for the same `huntId`.
- Never spend materials/skill points without a committed transaction.
- Never silently delete or replace a save after an error.
- Never make gacha a prerequisite for progression.

**First task:** Complete [`phases/01-combat-prototype/steps.md`](./phases/01-combat-prototype/steps.md) before expanding content.
