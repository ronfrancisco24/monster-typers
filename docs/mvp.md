# MVP — Release Scope and Acceptance Criteria

> **Status:** Scope baseline, subject to deliberate revision  
> **Related:** [Product](./product.md) · [Design](./design.md) · [Data](./data.md) · [Phases](./phases/01-combat-prototype/steps.md)

## MVP definition

A complete, **offline single-player Windows desktop game** where the player can select a monster, fight by typing, earn materials, craft and equip armor, upgrade skills, unlock additional maps, and resume their progress after closing the application.

Do not consider the MVP finished merely because one screen works. It must deliver a full repeatable hunting-and-progression loop.

## Content budget

| Category | MVP quantity | Constraints |
| --- | ---: | --- |
| Playable hunters | 1 | No classes or character creator |
| Maps | 3 | Each has 3 standard monsters + 1 boss |
| Monsters | 12 | 9 standard, 3 bosses; mechanics should differ |
| Armor sets | 3 | One themed set per map |
| Armor pieces | 9 | Helmet, chest, boots per set |
| Skill branches | 3 | Offense, Defense, Gathering |
| Upgradeable skills | 9 | 3 per branch; propose 3 ranks each |
| Hunt types | 1 | Select monster, complete encounter, claim result |
| Save slots | 1 | One local profile for MVP |

### Proposed maps and monster roster

Names are placeholders; IDs should stay stable once saved data exists.

| Map | Monster 1 | Monster 2 | Monster 3 | Boss |
| --- | --- | --- | --- | --- |
| Verdant Forest | Moss Slime | Thorn Boar | Fang Wolf | Grove Guardian |
| Crystal Caverns | Cave Bat | Shell Beetle | Crystal Golem | Crystal Serpent |
| Ashen Wastes | Ash Imp | Magma Lizard | Ash Stalker | Ember Wyvern |

**Unlock rule:** Verdant Forest starts unlocked. Defeating each region's three standard monsters at least once unlocks its boss. Defeating the boss unlocks the next map. Ashen Wastes is the final MVP region.

## Required systems

### Hunting

- [ ] Select an unlocked map and monster and begin a hunt.
- [ ] Display player health, monster health, current word, and combo.
- [ ] Complete words to attack; show hit feedback and damage.
- [ ] Incorrect characters are visibly indicated, and combo rules are consistent.
- [ ] Monster telegraphs an attack with a short defensive word and deadline.
- [ ] Successful defense avoids or reduces damage; failure causes a readable hit.
- [ ] Selected monsters offer an optional part-break prompt that yields a distinct reward.
- [ ] A hunt can end in victory, defeat, or player abandonment; no ambiguous state.
- [ ] Switching app focus pauses the fight and requires deliberate resume.
- [ ] Standard fights target 1–3 minutes; bosses target 3–5 minutes after balancing.

### Progression and rewards

- [ ] Victories award XP and defined material drops.
- [ ] Defeats and abandoned hunts do not grant monster-drop loot in MVP.
- [ ] Leveling awards skill points exactly once.
- [ ] Inventory tracks material quantities and shows required crafting ingredients.
- [ ] Nine equipment pieces are craftable with specific monster materials.
- [ ] Equipping a piece updates computed combat stats.
- [ ] Nine skills are upgradeable; purchased ranks persist.
- [ ] Monster / map unlock state persists.
- [ ] The results screen explains newly unlocked content and rewards.

### Desktop shell and saves

- [ ] Run in a small desktop window positioned near the taskbar.
- [ ] Support idle/compact mode and an expanded hunt/menu mode.
- [ ] Provide explicit Show/Hide, Close, and resume controls.
- [ ] Always-on-top is optional and user-controlled, not permanently forced.
- [ ] No keyboard capture when the app is unfocused; no global keystroke listener.
- [ ] Persist profile, unlocks, inventory, equipment, skills, and preferences locally.
- [ ] On restart, restore saved state without awarding a hunt a second time.
- [ ] Handle missing or invalid save data gracefully; do not silently overwrite it.

## Equipment specification

- Slots: `head`, `chest`, `feet`.
- Sets: `forest`, `cavern`, `ashen`.
- One named craftable item per slot per set = **9 total pieces**.
- Every piece has at least one clear stat benefit; at least one set should reward combos, one defense, and one part-breaking/gathering.
- Crafting a piece consumes ingredients, grants ownership, and does not allow duplicate crafting of the same unique piece.
- Unequipped pieces remain owned.
- No item durability, enhancements, rerolls, marketplace, or trading in MVP.

## Skills specification

| Branch | Skill | Proposed effect |
| --- | --- | --- |
| Offense | Sharp Strikes | Increased attack damage |
| Offense | Combo Mastery | Increased combo bonus |
| Offense | Precision | Bonus for flawless word completion |
| Defense | Vitality | Higher maximum health |
| Defense | Guard Training | Lower damage when defense fails |
| Defense | Quick Reflexes | Slightly longer defensive prompt window |
| Gathering | Field Notes | Higher common-material yield |
| Gathering | Lucky Carve | Slightly better rare-material odds |
| Gathering | Break Expert | More part-break gauge from successful break words |

**Proposed leveling rule:** One point at each hunter level gained; level cap and point economy are tuning parameters. Skill ranks, purchase conditions, and point totals must be validated by gameplay tests.

## Monster differentiation checklist

Each monster definition must vary from others in at least two meaningful ways:

- Word length or word complexity
- Attack telegraph frequency / timing
- Health and damage profile
- Part-break prompt behavior
- Attack patterns or boss phase transitions
- Rare material and recipe relevance

Bosses should additionally have a recognizable phase change and a unique material required for their map's armor set.

## Nonfunctional acceptance criteria

- Game state and damage calculations are deterministic when supplied the same inputs and seeded randomness.
- No double rewards on duplicate hunt-result processing.
- Database schema upgrades work on an existing local save; initial data can be loaded in a clean install.
- Unit tests cover word completion, typo handling, combo breaks, pause/resume, leveling, crafting costs, and unlocks.
- Pixel assets do not blur when scaled at supported sizes.
- Audio and animation do not block typing responsiveness.
- Tests include Alt+Tab, minimize, restart, unplugged/offline use, and changing display resolution.

## MVP release gate

A tester on a clean Windows install can:

1. Launch without an account or internet.
2. Finish the tutorial and a standard hunt.
3. Repeat hunts, earn ingredients, craft and equip a piece.
4. Level up and purchase a skill.
5. Unlock the second map by defeating the forest boss.
6. Exit, relaunch, and find all earned progress intact.
7. Alt+Tab during combat without typing into the game by accident or receiving hidden damage.

All steps must pass before calling this version MVP-complete.

## Out of scope

No gacha, premium currency, live economy, online accounts, server database, cloud sync, multiplayer, pets, achievements, global hotkeys, automatic gameplay while idle, or real-money transactions. These belong to [later-features.md](./later-features.md).
