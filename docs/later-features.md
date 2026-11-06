# Later Features — Post-MVP Backlog

> **Status:** Ideas only. Nothing in this file is required for MVP.  
> **Rule:** Do not implement these until the release criteria in [mvp.md](./mvp.md) pass.

## Guiding principle

Future systems should deepen **typing mastery and monster-hunting progression**, not replace them with menus, timers, or mandatory randomized upgrades.

## Priority 1 — Replayability and mastery

### Monster variants and mastery hunts

- Rare/color variants with one altered attack behavior, not merely more HP.
- Optional timed challenge hunts and personal-best records.
- Monster collection / bestiary that records kills, part breaks, and materials discovered.
- Additional maps and boss mechanics after the initial three regions are balanced.

**Prerequisite:** Stable monster definitions and hunt history.

### Expanded gear and builds

- More armor sets, set bonuses, alternate gear appearances.
- Optional weapon styles (different damage/typing modifiers) only if they do not fragment the simple control scheme.
- Equipment loadouts and convenient swap presets.

**Prerequisite:** Demonstrated demand for builds after the 9-item MVP.

## Priority 2 — Local gacha system

### Intended experience

Players earn **local, non-purchasable currency through hunts and achievements** and spend it on randomized optional rewards. No real-money purchases in the initial version. The hunt/craft loop must remain fully playable without pulling.

**Suggested rewards:** hunter skins, companion appearances, attack effects, UI themes, rare cosmetic variations. Avoid locking mandatory equipment progression behind random pulls.

### Suggested systems

- Earnable currency wallet with clearly defined sources and sinks.
- Single-pull and ten-pull UI (ten-pull is convenience, not a required economy advantage).
- Displayed reward pool and probabilities; never misrepresent odds.
- Duplicate compensation, such as cosmetic tokens or another nonessential reward.
- Optional pity guarantee with a visible counter, if randomized results feel excessively frustrating.
- Permanent local pull history and wallet ledger for debugging/recovery.
- Content pool versioning so old records remain interpretable after updates.

### Economy design safeguards

- Currency is **only earned in game**; no cash top-ups or paid loot boxes in this version.
- Do not force daily logins, time-limited purchases, or fear-of-missing-out mechanics.
- Do not use gacha as a gate to winning bosses or acquiring essential armor.
- Show duplicate handling and odds before players spend currency.
- Simulate many pulls to validate probabilities and expected time to rewards before release.
- Local saves can be edited by users; strong anti-cheat protection is not a goal for an offline economy.

### Proposed technical extensions (not MVP migrations)

- `currency_wallets`: balance by currency ID.
- `currency_ledger`: immutable earn/spend entries with idempotent transaction IDs.
- `gacha_pools`: versioned catalog definitions (bundled data, not necessarily a DB table).
- `gacha_pull_history`: pool/version, result IDs, spent amount, time.
- `cosmetic_unlocks`: owned cosmetics.
- `gacha_pity_state`: per-banner counters, only if pity is implemented.

**Atomicity requirement:** A pull transaction must debit once, choose rewards once, grant them once, and store history once. Duplicated calls must return the original settled result.

## Priority 3 — Desktop companion polish

- System tray control and minimize-to-tray behavior.
- Optional safe global shortcut to **show/focus the window** only (never to capture background typing).
- Move/resize presets, per-monitor placement, optional startup with Windows.
- Alternate idle animations and small nonintrusive visual events.
- Controller/touch options only if the game design expands beyond typing.

## Priority 4 — Optional connected features

These are a **separate architectural decision**, not a natural consequence of adding gacha:

- Optional cloud backup / cross-device save.
- Account system and conflict resolution for syncing saves.
- Community leaderboards for timed hunts.
- Online events or shared challenge boards.

If online features are approved, create a separate backend/security/data migration design before implementation. Do not send existing local save data to a service without explicit user consent.

## Parking lot

- Pets/familiars with cosmetic or minor noncombat effects.
- Achievements and completion milestones.
- Daily/weekly *optional* challenges without login pressure.
- Additional typing languages or accessibility presets.
- Music packs, alternate retro palettes, richer environment animations.

## Backlog decision template

Before approving any future feature, answer:

1. Which existing player problem does it solve?
2. What is the smallest version worth shipping?
3. Does it still respect short desktop sessions and keyboard focus?
4. How does it affect the hunting/crafting loop?
5. What schema or save migrations are required?
6. What are its measurable success criteria and rollback strategy?

Keep this file as a backlog, not a commitment or schedule.
