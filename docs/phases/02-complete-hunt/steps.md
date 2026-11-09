# Phase 02 — Complete Hunt Loop

> **Status:** In progress
> **Goal:** Turn the prototype into one fully playable hunt with monster behavior, rewards, and inventory.
> **Dependencies:** [Phase 01](../01-combat-prototype/steps.md) complete  
> **Next:** [Phase 03 — Progression](../03-progression/steps.md)

## Deliverable

A complete forest-monster hunt from selection through typing combat to committed results and a persistent materials inventory. The player can win, lose, or abandon without double rewards or unclear state.

## Steps

### 1. Hunt selection and entry

- [x] Build hub and Hunt Board screens for one available map.
- [x] Display the monster's name, difficulty indicator, and possible materials.
- [x] Pressing Start begins a clean new encounter with full player HP.
- [x] Assign a unique `huntId` for each encounter.
- [x] Keep one authoritative hunt controller for the encounter state.

### 2. Defensive typing

- [x] Add an enemy attack telegraph with a countdown and defensive word.
- [x] Prioritize defense over the active attack word.
- [x] Completing defense in time prevents/reduces the hit as designed.
- [x] Timeout or mistakes that prevent completing defense apply damage **once**.
- [x] Return to attack word input after defense resolves.
- [x] Verify deadlines freeze on pause and restore correctly on resume.

### 3. Combat depth

- [x] Implement combo damage with a sensible cap.
- [x] Add clear visual feedback for flawless words, combo resets, and defense.
- [x] Add a first optional part-break prompt with a gauge.
- [x] Ensure a part can break at most once per hunt.
- [x] Use injected clock and random source for deterministic unit tests.
- [x] Add a simple monster behavior difference (e.g., slow slime vs aggressive boar) without duplicating controller logic.

### 4. Loot and experience

- [x] Define a few stable `material.*` catalog IDs and drop rates.
- [x] On victory, calculate XP and material drops from a seeded/injected RNG.
- [x] Award bonus material when a qualifying part was broken.
- [x] Defeat and abandon give no monster materials in MVP.
- [x] Show victory/defeat/abandon result summary with correct numbers.

### 5. Transactional local persistence

- [x] Implement `hunt_history` and `inventory_materials` database tables.
- [x] Implement `finalize_hunt` in the Tauri/Rust persistence layer.
- [x] Save history, XP, inventory, and any unlock updates atomically.
- [x] Make duplicate `huntId` settlement return prior result without paying twice.
- [x] Display only rewards confirmed by the committed save result.
- [x] Add a simple Inventory screen showing stored materials.

### 6. Verification

- [ ] Tests: defense success/failure, prompt priority, repeated part-break input.
- [ ] Tests: dropped materials within configured ranges and seeded reproducibility.
- [ ] Tests: double settlement does not double XP or inventory.
- [ ] Tests: failure during a transaction rolls back all affected changes.
- [ ] Manual: win, defeat, abandon, restart, Alt+Tab, and confirm all persisted values.
- [ ] Playtest one complete hunt repeatedly and adjust pace before adding more systems.

## Definition of done

The player starts a hunt, fights with attack/defense words, can optionally break a monster part, wins or loses, sees a results screen, and returns to a persistent inventory. Restarting shows the same saved material quantities; retrying a settlement cannot duplicate rewards.

## Explicitly defer

Skill tree, full crafting/equipment, remaining monsters/maps, advanced boss phases, gacha, and art polish.

## End-of-phase notes

- **Most confusing combat prompt:** _To fill in_
- **Observed session duration:** _To fill in_
- **Balance changes needed:** _To fill in_
