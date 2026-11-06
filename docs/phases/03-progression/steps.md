# Phase 03 — Progression and Equipment

> **Status:** Not started  
> **Goal:** Make repeated hunts meaningfully improve the hunter.  
> **Dependencies:** [Phase 02](../02-complete-hunt/steps.md) complete  
> **Next:** [Phase 04 — Content Expansion](../04-content-expansion/steps.md)

## Deliverable

Working XP/levels, skill spending, armor crafting, equipment loadout, derived stats, recipe goals, and saved progression. Implement the full generic systems using a small subset of first-region content; Phase 04 fills in all 9 armor items and 9 skills.

## Steps

### 1. Leveling

- [ ] Define a configurable XP curve and initial level cap.
- [ ] Grant a skill point exactly once per level earned.
- [ ] Show current level, XP progress, and available skill points.
- [ ] Support receiving enough XP to gain multiple levels in one settlement.
- [ ] Persist level, total XP, and unspent points atomically with hunt rewards.

### 2. Skills system

- [ ] Implement branch/skill/rank catalog types.
- [ ] Build a Skill screen with clear cost, next-rank effect, and max-rank status.
- [ ] Implement at least one working Offense, Defense, and Gathering skill.
- [ ] Make effects change actual combat/drop calculations, not only UI numbers.
- [ ] Implement atomic `purchase_skill_rank` with insufficient-points protection.
- [ ] Keep the generic design ready for the complete 9-skill catalog.

### 3. Materials and crafting

- [ ] Implement equipment and recipe definitions using stable IDs.
- [ ] Display crafting requirements and current owned material quantities.
- [ ] Implement `craft_equipment` as one transactional inventory deduction + ownership grant.
- [ ] Prevent duplicate crafting of the same unique item.
- [ ] Return meaningful insufficient-material and already-owned messages.
- [ ] Provide at least one reachable forest armor recipe as an end-to-end test.

### 4. Equipping and derived stats

- [ ] Implement head, chest, and feet slots.
- [ ] Implement equip/unequip for owned items only.
- [ ] Validate correct slot and unique loadout items.
- [ ] Compute final stats from base hunter values + equipped armor + skill ranks.
- [ ] Verify damage, max health, defense, and gathering bonuses update immediately.
- [ ] Display current loadout and before/after stats in the UI.

### 5. Persistence and save compatibility

- [ ] Add `owned_equipment`, `equipment_loadout`, and `skill_ranks` migrations.
- [ ] Add saved settings or profile updates needed by progression screens.
- [ ] Confirm old Phase 02 saves migrate without losing hunt history/materials.
- [ ] Verify crafting and skill transactions roll back on failures.
- [ ] Confirm equipped gear and purchased ranks restore after restart.

### 6. Gameplay test

- [ ] A fresh player wins enough hunts to craft and equip a piece.
- [ ] Leveling earns a point, and spending it changes the next fight.
- [ ] Gathering effect changes seeded drop test outcomes as specified.
- [ ] No duplication from rapid repeated clicks or concurrent UI commands.
- [ ] The screen clearly communicates **what to hunt next** for a selected recipe.

## Definition of done

A player can repeatedly hunt a monster, collect ingredients, craft and equip armor, earn and spend a skill point, see changed combat stats, quit, and load those upgrades again. The generic systems can support all planned content without structural rewrites.

## Explicitly defer

Final balancing, nine-item content completion, map boss gates, finished art, achievements, local currency, gacha.

## End-of-phase notes

- **First useful upgrade:** _To fill in_
- **Average hunts to craft it:** _To fill in_
- **Progression confusion found:** _To fill in_
