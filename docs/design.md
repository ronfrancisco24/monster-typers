# Design — Gameplay, UX, and Combat Rules

> **Type:** Game design document (GDD), MVP  
> **Related:** [Product](./product.md) · [MVP](./mvp.md) · [Architecture](./architecture.md)

## 1. Experience goals

- A quick, visually satisfying typing-based hunt.
- Clear consequences for typing accurately, quickly, and defensively.
- Monsters feel different without making players learn a large control scheme.
- The interface remains legible in a compact desktop window.
- The player controls when the game takes focus or appears above other apps.

The intended art direction is **8-bit-inspired retro pixel art**, not a strict hardware palette/resolution restriction. Decide final sprites and animation sheets later; use placeholder shapes until the mechanics work.

## 2. States and screens

```text
Boot / Load Save
    ├─ First launch → Tutorial
    └─ Existing save → Idle / Hub
                             ├─ Hunt Board → Map → Monster → Hunt → Results → Hub
                             ├─ Inventory → Craft / Equip → Hub
                             ├─ Skills → Spend Points → Hub
                             └─ Settings / Quit
```

### Desktop window modes

| Mode | Intended behavior |
| --- | --- |
| Compact / Idle | Small window with hunter animation and a Start Hunt entry; no passive combat or farmed rewards. |
| Expanded / Hub | Map selection, inventory, crafting, skills, settings. |
| Expanded / Hunt | 2D fight view, typing input, health, combo, defense prompts. |
| Paused | Timers and combat simulation frozen; resume explicitly. |

Initial layout suggestions (adjust after testing): compact around `240 × 120` CSS pixels; expanded around `640 × 360` or `720 × 405`, scaled for high-DPI displays. These are design targets, not mandatory exact sizes.

**Taskbar model:** The application is a normal borderless window near the taskbar, not an extension of the Windows taskbar. Auto-position inside the monitor's work area; allow manual repositioning if the taskbar moves.

## 3. Hunt flow

1. Player selects an **unlocked** map and monster.
2. Pre-hunt panel shows monster name, expected materials, difficulty, and suggested gear.
3. Player presses **Start Hunt**; typing input receives focus.
4. Monster enters; attack word appears.
5. Completing the word triggers a hunter attack and refreshes the attack word.
6. Monster periodically telegraphs an attack; a defensive word temporarily takes priority.
7. Optional part-break prompts can appear for bonus materials.
8. Victory triggers a single results/rewards settlement and returns control to menus.
9. Defeat or abandon closes the encounter without monster loot.

Do not transition away from the results screen until the player can review rewards and unlocks.

## 4. Typing mechanics

### Input rules

- **MVP language:** English alphabetic words (`a`–`z`), displayed in uppercase or lowercase stylistically; matching is case-insensitive.
- Use a focusable **game-specific text input** (or equivalent controlled input surface). Only accept input while hunt mode is active and the game has focus.
- Completing a word triggers one attack automatically; **Enter is not required**.
- Punctuation, shortcuts, and modifier-only keys are not combat input.
- A correct character advances the displayed cursor.
- An incorrect character flashes the expected position, increments mistake count, and breaks the active combo. It does **not** discard already-correct characters or require Backspace to recover.
- Backspace may be ignored during combat because wrong characters are not inserted; this must be indicated in the tutorial.
- When a word changes, previous partially typed input is discarded. Never accept untyped characters from a previous word.
- Paused, minimized, hidden, or unfocused game windows ignore combat input entirely.

### Attack rule

```text
completed attack word
    → compute base damage from hunter stats
    → apply combo and flawless-word modifiers
    → reduce monster HP
    → emit attack animation / damage feedback
    → show next word (if still alive)
```

- Start at combo `0`; each fully correct word without a typo increases combo by `1`.
- A mistype resets combo to `0` immediately; the current word can still be completed.
- A defensive-word success does not increment the attack combo.
- The core damage calculation is implemented as a **pure function**, not inside the animation scene.
- Cap the combo damage modifier to avoid extreme damage from long streaks.
- Word pool and difficulty are data-driven per monster, never hard-coded into scene logic.

### Monster defense prompts

- Monster telegraphs (visual + textual cue), then a short word such as `ROLL`, `DUCK`, or `GUARD` appears with a countdown.
- Defense input **temporarily replaces** attack input; partial attack-word progress is reset after the defense resolves.
- Successful completion before deadline avoids the attack (or reduces damage for guard-type attacks).
- Failure or timeout applies monster damage exactly once.
- Clear prompt priority: **defense > break opportunity > normal attack**; never show two simultaneously active typing targets.
- For first implementation use a fixed defense window; later tune by monster attack speed and `Quick Reflexes` skill.
- Attack timers are paused while an unavoidable animation lock is in effect; avoid charging the player for invisible time.

### Part-breaking opportunities

For selected monsters, a **BREAK: [part]** prompt appears with a designated bonus word. Completing it adds to that part's break gauge. On reaching its threshold, the part breaks and marks a bonus reward for **successful completion of the hunt**.

- A monster may have zero or one breakable part in the MVP.
- Breaking a part is optional; a hunt is winnable without it.
- The bonus is included only once per part per hunt.
- The part-break prompt must be easily distinguishable from a monster attack prompt.

## 5. Difficulty and pacing

| Region | Word challenge | Defense challenge | Gameplay focus |
| --- | --- | --- | --- |
| Forest | 3–5 letters, simple words | Slow and clearly telegraphed | Learn attacks, combos, first part break |
| Caverns | 4–7 letters | Armor / special break windows | Prioritization and accuracy |
| Wastes | 5–9 letters, faster flow | Tighter attack cycles | Mastery of defensive timing |

These ranges are **starting hypotheses**, not final balance. Players should be able to choose easier monsters for farming. Use authored word pools, avoid offensive language, and prevent repeats appearing excessively within a hunt.

## 6. Health, victory, and defeat

- Hunt starts at **full current health** calculated from base stats and equipped gear/skills.
- Monster HP reaching `0` triggers a victory exactly once.
- Hunter HP reaching `0` triggers defeat exactly once.
- If both would reach `0` on the same update, resolve the active action first and apply a documented tie-breaking rule (recommend: completed player word resolves before queued monster damage).
- Abandoning requires confirmation and yields no monster loot.
- For MVP, player HP does **not** need to persist between hunts; each new hunt restores health.
- No equipment durability or permanent penalties for defeat.

## 7. Economy and rewards

- Every victory provides **visible XP and common material drops**.
- Rare materials have lower drop rates; show them as possible rewards on the monster detail panel without promising specific outcomes.
- Breaking a part adds its guaranteed (or explicitly configured) part material when the hunt is won.
- Boss-specific materials gate an armor piece or set milestone.
- Crafting consumes exact quantities and grants a permanently owned equipment piece.
- Different armor sets favor distinct styles: Forest = balanced/combo, Cavern = defense/part-breaking, Ashen = high-pressure offense.
- No paid items, real-money purchases, or currency wallet in MVP.

## 8. Skill upgrades

Three branches (Offense, Defense, Gathering), three skills each, proposed three ranks per skill. Skill points are earned by leveling. An upgrade must show its **before / after** effect, cost, and confirmation. Players cannot spend points they do not own or exceed rank caps.

Recommended progression sequence: first skill point comes early, first armor recipe is achievable after a handful of forest hunts, and the first boss is available before the player feels forced to grind excessively.

## 9. UI hierarchy

### Hunt HUD priority

1. Active typing word and cursor position (largest/highest contrast)
2. Defensive countdown and enemy telegraph (when relevant)
3. Enemy HP and player HP
4. Combo, impact feedback, and part-break progress
5. Ambient art, secondary labels, and decorative effects

### Readability guidance

- Choose a legible bitmap font with enough spacing for the smallest window size.
- Do not rely on color alone for success/error/defense feedback; add icons, movement, text, or shape.
- Show a real pause indicator when the app loses focus.
- Avoid windows that cover the Windows taskbar itself by default.
- Offer volume, animations/screen shake, window mode, and always-on-top preferences.
- Give the user a way to close or minimize the app from every non-combat screen.

## 10. Feedback / juice

- Correct keystroke: subtle highlight.
- Completed word: strike pose, hit spark, sound, damage number.
- Perfect word: distinct but brief accent; do not overwhelm the HUD.
- Mistype: tiny shake or flash, never a harsh full-screen effect.
- Successful dodge: visibly avoided hit and short visual effect.
- Part break: distinct sound/banner plus completion marker.
- Victory: rewards shown clearly, new unlock highlighted if applicable.

Visual feedback must be allowed to finish asynchronously; **the simulation and keyboard handling must not depend on animation completion** unless the mechanics explicitly specify an animation lock.

## 11. Content authoring template

Each monster needs:

- `id`, `name`, `mapId`, `isBoss`, `hp`, `damage`, `attackCadenceMs`
- `wordPoolId` (or authored `attackWords[]`), `defenseWords[]`, `defenseWindowMs`
- `drops[]` with probabilities and quantities
- Optional `breakablePart` (`name`, `requiredGauge`, `breakWords`, `rewardItemId`)
- Optional phase thresholds and behavior changes for bosses
- Sprite/animation references (placeholder allowed)

Each armor piece needs: `id`, `setId`, `slot`, `name`, `statModifiers`, and `recipeIngredients[]`.

Each skill needs: `id`, `branch`, `name`, `maxRank`, `effectPerRank`, and `pointCost`.

All IDs must be stable because local saves refer to them. See [data.md](./data.md).

## 12. Playtest questions

- Does typing feel like performing an attack rather than filling a form?
- Is an incoming attack obvious before its deadline?
- Are mistakes recoverable without feeling arbitrary?
- Can players explain why they are farming a specific monster?
- Do armor and skills meaningfully change how the next hunt feels?
- Is the small desktop window pleasant when the player is multitasking?
