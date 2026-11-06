# Product — Taskbar Hunter

> **Status:** Planning / MVP specification  
> **Working title:** Taskbar Hunter (replace when branding is chosen)  
> **Platform:** Windows desktop first  
> **Genre:** Offline, single-player, 2D retro typing-action hunting RPG  
> **Related:** [MVP](./mvp.md) · [Design](./design.md) · [Architecture](./architecture.md) · [Roadmap](./phases/01-combat-prototype/steps.md)

## 1. Product vision

A small monster-hunting game that lives near the desktop taskbar. Players start short hunts, type to attack and avoid monsters, gather materials, craft armor, and improve skills. The game should be satisfying during a short break without demanding a full-screen session or an extended commitment.

**One-sentence pitch:** Hunt monsters by typing, craft better gear from their drops, and gradually conquer new 8-bit-inspired regions — all from a tiny desktop window.

This game is **inspired by** the hunt → material → craft → stronger hunt progression of monster-hunting games. It must have its own monsters, names, visual designs, interfaces, sounds, and other original creative assets.

## 2. Target experience

- **Session length:** Standard hunts target 1–3 minutes; bosses may take 3–5 minutes.
- **Entry friction:** Open the app and start a hunt within a few clicks.
- **Input:** Typing is the primary combat action; the game must be focused before it receives input.
- **Presentation:** Small, optional always-on-top desktop window, close to (not embedded in) the Windows taskbar.
- **Persistence:** Offline play with local automatic saving; no account required.
- **Reward:** Each successful hunt should give visible materials, experience, or progress toward an upgrade.

## 3. Product pillars

1. **Typing feels like combat.** Correct words trigger readable attacks, impacts, damage feedback, and combos. Monsters attack back; typing is not just a quiz.
2. **One more hunt.** Every monster has a reason to be hunted again: crafting materials, rare drops, or improvement goals.
3. **Compact and respectful.** The game is easy to show/hide and pause. It must never capture keyboard input from another app.
4. **Readable progression.** Players can see what unlocks next, which material they need, and why a piece of armor or skill matters.
5. **Variety without busywork.** Different monsters and maps vary in timing, defenses, break opportunities, and word difficulty rather than just larger health numbers.

## 4. Core player loop

```text
Open / expand game
       ↓
Choose unlocked map and monster
       ↓
Type attack words → react to telegraphed enemy attacks
       ↓
Win hunt → receive materials, XP, and possible part-break drops
       ↓
Craft/equip armor and spend skill points
       ↓
Unlock tougher monsters and maps → repeat
```

The hunter does **not** automatically fight in idle mode. Idle is a visual/desktop presence, not an idle-resource farm.

## 5. Initial player journey

1. On first launch, the player sees the hunter and a clear **Start Hunt** action.
2. A short tutorial teaches attacking a basic slime by completing displayed words.
3. The player wins, sees loot and XP, and is shown an equipment goal.
4. The player repeats hunts to obtain missing materials.
5. The player crafts and equips their first armor piece and spends their first skill point.
6. The player defeats the forest boss and unlocks the next region.
7. The same loop continues with new monster mechanics, materials, and equipment.

## 6. MVP content promise

- 1 hunter; 3 maps; 12 total monsters (9 standard + 3 bosses).
- 3 armor sets, with helmet/chest/boots per set (9 craftable pieces).
- 3 skill branches, with 3 skills per branch (9 upgradable skills).
- Basic attacks, combos, telegraphed defensive words, and monster part-breaking opportunities.
- Hunter experience, unlocks, inventory, equipment, hunt results, and local saves.
- Compact desktop view plus expanded hunt/menu view.

For the precise feature contract and exclusions, see [mvp.md](./mvp.md).

## 7. Success criteria (playtest targets, not guarantees)

- A first-time player completes a tutorial hunt without external instructions.
- Standard hunts average 1–3 minutes once familiar with the mechanics.
- Input remains responsive and visual feedback makes correct, incorrect, and defensive typing obvious.
- A player understands the next obtainable upgrade without consulting a guide.
- Progress survives quitting and restarting the app.
- Switching to another application immediately suspends gameplay input and enemy timers.
- In a five-hunt test, players report that monster encounters are recognizably different, not mere stat reskins.

## 8. Product constraints

- **Offline first.** No server, login, cloud save, online leaderboard, or network dependency for MVP.
- **Windows first.** Other operating systems are deferred; do not promise cross-platform behavior until tested.
- **Original assets.** Placeholder shapes and temporary sprite art are acceptable during implementation.
- **No real-money purchases.** Even future randomized rewards should use earnable local currency unless an entirely new product decision is approved.
- **Accessibility:** Provide clear text contrast, adjustable sound, optional reduced screen shake, and a typing practice path.

## 9. Deliberate exclusions

Not in the MVP: gacha, currency wallet, pets, multiplayer, online seasons, daily login demands, weapon classes, open-world movement, complex loot rarity affixes, procedural maps, accounts, achievements, and live-service features. See [later-features.md](./later-features.md).

## 10. Open decisions (do not block the combat prototype)

- Final game name and visual assets.
- Whether the hunter is visually stationary while monsters enter, or advances through a short side-view scene.
- Whether armor has cosmetic appearance changes from day one or initially only changes stats.
- Exact values for attack damage, experience curves, material chances, and durations; these require playtesting.

**Planning rule:** When a decision is unresolved, use a reversible placeholder rather than delaying the vertical slice.
