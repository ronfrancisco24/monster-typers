# Phase 04 — Content Expansion and Balance

> **Status:** Not started  
> **Goal:** Deliver the complete MVP monster, map, gear, and skill roster with meaningful variety.  
> **Dependencies:** [Phase 03](../03-progression/steps.md) complete  
> **Next:** [Phase 05 — Desktop Polish](../05-desktop-polish/steps.md)

## Deliverable

All three hunting regions, twelve monsters, three distinct boss encounters, nine armor pieces, nine skills, and tested unlock progression. Content uses the same rules engine as the first vertical slice.

## Steps

### 1. Complete the content catalogs

- [ ] Add all three maps: Verdant Forest, Crystal Caverns, Ashen Wastes.
- [ ] Add all nine standard monsters (three per map).
- [ ] Add all three bosses (Grove Guardian, Crystal Serpent, Ember Wyvern).
- [ ] Define appropriate word lists, timing, HP, attacks, drops, and visuals references for each.
- [ ] Ensure stable IDs are unique and all referenced materials exist.
- [ ] Add catalog validation tests for counts and cross-references.

### 2. Differentiate encounters

- [ ] Forest teaches short words, basic dodges, and optional part breaks.
- [ ] Caverns introduces armor/break emphasis and more defensive pressure.
- [ ] Wastes introduces longer words, faster cadence, and stronger consequences for errors.
- [ ] Give each boss at least one recognizable phase change.
- [ ] Give at least selected monsters a breakable part and a useful exclusive drop.
- [ ] Test that encounters differ in timing, mechanics, or resource goals (not only HP).

### 3. Unlock progression

- [ ] Start with Forest unlocked.
- [ ] Unlock a map's boss after winning against all three standard monsters there.
- [ ] Defeating Grove Guardian unlocks Caverns.
- [ ] Defeating Crystal Serpent unlocks Wastes.
- [ ] Persist unlocked maps and protect against duplicate unlock/reward events.
- [ ] Clearly show locked content and the exact unlock requirement.

### 4. Complete armor and skills

- [ ] Add Forest, Cavern, and Ashen armor sets.
- [ ] Supply helmet, chest, and boots for each set: nine recipes total.
- [ ] Make set strengths meaningfully different (combo, defense/break, offense).
- [ ] Finish all three skill branches with three skills each.
- [ ] Test all skill ranks for measurable effects and rank limits.
- [ ] Verify each recipe has a reachable material source in an unlocked or discoverable region.

### 5. Balance the economy and pacing

- [ ] Standard hunts average roughly 1–3 minutes for expected player skill.
- [ ] Bosses target roughly 3–5 minutes without excessive HP padding.
- [ ] Common material drops reliably progress crafting goals.
- [ ] Rare drops feel exciting but do not make first armor crafts excessively grindy.
- [ ] Easy monsters remain usable for low-pressure repeat hunts.
- [ ] Stronger gear and skills help but do not make defense typing irrelevant.
- [ ] Use scripted/seeded simulations for drop probabilities and progression pacing.

### 6. Content quality assurance

- [ ] Play through from a brand-new save to the Ashen Wastes boss.
- [ ] Test all hunt results, boss phase boundaries, and optional part drops.
- [ ] Test all recipes and equipment slot effects.
- [ ] Confirm no mission is blocked by an unavailable material or incorrect unlock.
- [ ] Test migration of an earlier save with new catalog content.
- [ ] Record playtest feedback and finalize initial difficulty values.

## Definition of done

A player can progress from their first forest hunt through all three regions, defeat all bosses, craft all nine armor pieces, and purchase the documented skills. There are no inaccessible drops, soft-locking unlock rules, or duplicate rewards.

## Explicitly defer

Rare monster variants beyond the roster, collection achievements, new maps, gacha, cosmetic banners, online functions, and daily events.

## End-of-phase notes

- **Hardest difficulty spike:** _To fill in_
- **Most/least fun monster:** _To fill in_
- **Recipes needing rebalance:** _To fill in_
