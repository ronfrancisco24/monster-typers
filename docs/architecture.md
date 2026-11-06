# Architecture — Desktop Game

> **Status:** Proposed technical baseline  
> **Related:** [Product](./product.md) · [Design](./design.md) · [MVP](./mvp.md) · [Data](./data.md) · [Agent instructions](./agent.md)

## 1. Architecture decision

Build an **offline-first, Windows-first desktop application** with:

| Layer | Proposed technology | Purpose |
| --- | --- | --- |
| Desktop host | Tauri 2 | Native window, desktop APIs, packaging |
| Frontend | React + TypeScript + Vite | Menus, inventory, HUD, state presentation |
| 2D renderer | Phaser | Sprites, animation, combat presentation |
| Rules engine | Plain TypeScript modules | Typing/combat, stats, XP, loot, progression |
| Local data | SQLite | Durable player state, inventory, gear, saves |
| Persistence bridge | Tauri commands in Rust + SQLite driver | Transactional reads/writes and migrations |
| Content catalog | Versioned local TypeScript/JSON definitions | Maps, monsters, items, word lists, recipes |
| Testing | Vitest + UI smoke tests | Domain correctness, save flows, desktop behavior |

**No backend or cloud database for MVP.** Pin actual package versions when the project is scaffolded; do not assume sample snippets from different major versions are interchangeable.

### Why SQLite instead of a server?

The MVP has one local player, no accounts, and mostly read-heavy game content. SQLite is straightforward for inventory changes, equipment ownership, completed hunts, and incremental schema migrations. A server would add cost and operational complexity without improving the first gameplay loop.

### Why a small Rust persistence bridge?

Game logic remains in TypeScript. Rust commands are limited to local file/database operations that benefit from **SQLite transactions**. This avoids accidental partial writes when, for example, a single victory must update XP, inventory, unlocks, and history together. We intentionally do **not** use both a frontend SQL plugin and separate Rust database connections in the MVP.

## 2. High-level flow

```text
                    Tauri desktop window
                  ┌───────────────────────┐
User keyboard --->│ React hunt input/HUD   │<--- menus / settings
                  │          |            │
                  │     HuntController     │
                  │       /       \       │
                  │ Pure TS      Phaser    │
                  │ domain       renderer  │
                  │       \       /       │
                  │       game state       │
                  └──────────┬────────────┘
                             │ typed commands (invoke)
                        Tauri / Rust
                             │
                      SQLite local file
```

**Single source of truth:** the TypeScript domain/controller calculates hunt state and outcomes. Phaser renders that state but does not independently award damage, loot, XP, or unlocks. React renders UI and captures input, but does not implement a second combat rule engine.

## 3. Responsibility boundaries

### React UI

- Screens: idle hub, hunt board, inventory/crafting, skill tree, results, settings.
- Displays state and sends commands (`startHunt`, `typeCharacter`, `pauseHunt`, `craftItem`, etc.).
- Owns the focusable typing input when hunt mode is active.
- Does not write SQL or calculate damage inline in components.

### TypeScript domain

Pure/testable functions for:

- Typing acceptance and mistakes
- Damage, combos, defense, part breaks, and victory conditions
- Monster drop rolls using an injected random-number source
- XP, level thresholds, derived stats, skill modifiers, recipes, unlock rules

Prefer explicit data structures and functions over elaborate inheritance. Treat all units and deadlines consistently (milliseconds for timers).

### Hunt controller

- Drives the encounter state machine.
- Owns one authoritative timeline for attack cadence and defense deadlines.
- Coordinates focus loss, pause, resume, victory, and defeat.
- Emits **renderable events** (`PLAYER_HIT`, `MONSTER_HIT`, `PART_BROKEN`) but never relies on animations to mutate authoritative game state.
- On terminal result, sends one unique `huntId` for persistence.

### Phaser renderer

- Scene creation, sprite movement, VFX, animations, and optional audio hooks.
- Receives state snapshots and presentation events from the controller.
- Does not read/write SQLite.
- Does not install a second keyboard listener for gameplay input.
- Cleanly destroys its scene / game instance during React unmount or transitions.

### Tauri/Rust and SQLite

- Open the local SQLite DB in the application's designated data directory.
- Apply schema migrations before loading the save.
- Offer narrow Tauri commands for loading data and **atomic mutations**.
- Never allow arbitrary SQL strings or arbitrary file paths from React.
- Validate quantities, integer bounds, slot types, and duplicate `huntId` values before committing writes.

## 4. Proposed source structure

```text
project-root/
├── docs/
│   ├── product.md
│   ├── mvp.md
│   ├── design.md
│   ├── architecture.md
│   ├── data.md
│   ├── later-features.md
│   ├── agent.md
│   └── phases/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── screens/              # Hub, HuntBoard, Inventory, Skills, Results
│   │   └── components/          # HUD, word display, buttons, panels
│   ├── game/
│   │   ├── controller/          # Hunt state machine and lifecycle
│   │   ├── domain/              # Pure combat, stats, loot, leveling logic
│   │   ├── renderer/            # Phaser setup, scenes, animation adapter
│   │   └── input/               # Focused typing adapter
│   ├── content/
│   │   ├── monsters.ts
│   │   ├── maps.ts
│   │   ├── equipment.ts
│   │   ├── skills.ts
│   │   ├── materials.ts
│   │   └── word-pools.ts
│   ├── persistence/
│   │   ├── gameRepository.ts   # Typed frontend API to Tauri commands
│   │   └── types.ts
│   ├── platform/
│   │   ├── desktopWindow.ts    # Position, focus, always-on-top, show/hide
│   │   └── platformAdapter.ts  # Browser-test fallback where useful
│   └── tests/
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── commands/            # load, finalize hunt, craft, equip, skills
│   │   ├── persistence/         # SQLite connection and migration runner
│   │   └── migrations/          # Versioned SQL migrations
│   ├── capabilities/            # Least-privilege window/command permissions
│   └── tauri.conf.json
└── package.json
```

This is a suggested structure, not a requirement to create all empty folders on day one. Add modules when their feature is implemented.

## 5. Key interfaces and messages

Illustrative TypeScript contracts (names may change during implementation):

```ts
type HuntStatus = 'ready' | 'active' | 'paused' | 'victory' | 'defeat' | 'abandoned';
type PromptType = 'attack' | 'defense' | 'break';

type Prompt = {
  id: string;
  type: PromptType;
  word: string;
  cursor: number;
  expiresAtMs?: number;
};

type HuntState = {
  huntId: string;
  monsterId: string;
  mapId: string;
  status: HuntStatus;
  playerHp: number;
  monsterHp: number;
  combo: number;
  prompt: Prompt | null;
};

type HuntResult = {
  huntId: string;
  monsterId: string;
  mapId: string;
  outcome: 'victory' | 'defeat' | 'abandoned';
  durationMs: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  wordsCompleted: number;
  xpAwarded: number;
  loot: Array<{ itemId: string; quantity: number }>;
  brokenPartIds: string[];
};
```

`HuntResult` is **an example contract**, not permission to trust arbitrary payload values. Validate result shape and bounds at the persistence boundary; enforce duplicate protection using `huntId`.

## 6. Hunt state machine

```text
ready --start--> active
active --lost focus / manual pause--> paused
paused --explicit resume with focus--> active
active --monster HP = 0--> victory
active --hunter HP = 0--> defeat
active/paused --confirm abandon--> abandoned
victory/defeat/abandoned --exit results--> hub
```

Rules:

- The terminal state is immutable and results are settled at most once.
- A lost-focus pause freezes both timers and monster actions; the game never secretly runs while inactive.
- Use monotonic elapsed time for deadlines while active; do not trust wall-clock time for attack scheduling.
- On application crash mid-hunt, return to hub on restart; a nonterminal hunt is not rewarded.

## 7. Persistence lifecycle

### On startup

1. Open app data directory and SQLite database.
2. Run pending migrations (fail with a user-readable recovery path if migration fails).
3. Create the single starter profile only when no profile exists.
4. Seed initial unlock for Verdant Forest.
5. Load player progress, inventory, owned/equipped gear, skill ranks, unlocks, and settings.
6. Validate catalog IDs; handle unknown legacy IDs without destroying data.

### On victory

1. Domain calculates one immutable `HuntResult`.
2. Repository invokes `finalize_hunt(result)` once with a unique `huntId`.
3. Rust starts a **single SQLite transaction**.
4. If `huntId` was already settled, return the stored settlement rather than awarding twice.
5. Insert history, update XP/levels/points, add materials, and apply unlocks.
6. Commit; return updated player state and an explicit rewards summary.
7. Show the results UI using the **committed** settlement.

For defeat/abandon, insert the outcome only (no XP/loot unless later deliberately changed).

### For crafting / skill purchases

Each action checks preconditions and updates all affected tables **inside one transaction**. Insufficient materials/points must be a clean domain error, not a partial save.

## 8. Desktop behavior

- Use Tauri's normal window configuration for frameless/window sizing/always-on-top options, and supported position APIs for placement.
- **Never** assume that a built-in corner-position call accounts for all taskbar configurations. Verify monitor work area and clamp the window inside it.
- Support high DPI, multiple monitors, auto-hidden/moved taskbars, and window visibility/minimize events at least through smoke tests.
- Prefer a user-invoked focus action instead of global keyboard hooks.
- When browser-running the React portion for tests, use a platform adapter with no-op/mock desktop APIs.
- Close/minimize behavior should be predictable. Background resident/tray behavior is a later enhancement unless it is needed to meet the MVP's show/hide requirements.

## 9. Security and reliability

- Tauri capability permissions should be minimal; do not expose arbitrary shell execution or unrestricted filesystem access.
- Content is local and trusted only to the extent a single-player game requires. Save tampering is not a security boundary in MVP.
- No analytics, ads, external requests, telemetry, or user accounts by default.
- Use prepared statements and transactional updates for persistence.
- Keep save format/migration changes backward-compatible; test upgrading an older save copy.
- If data is corrupt, show an error and permit backup/recovery rather than silently wiping progress.
- Avoid frequent disk writes per keystroke; save on hunt settlement and meaningful progression actions.

## 10. Test layers

| Layer | Key tests |
| --- | --- |
| Domain unit tests | Typing, combo, defense timeout, damage, loot with seeded RNG, XP, crafting costs |
| Controller tests | Pause/resume, input focus, timers, exactly one terminal transition |
| Persistence tests | Migration, atomic crafting, idempotent hunt results, restart recovery |
| UI tests | Word highlighting, disabled controls, inventory and skill interactions |
| Desktop smoke tests | Window positioning, focus, minimize, always-on-top toggle, offline start |

## 11. Technical spike before investing in content

Build the smallest installed Windows package that demonstrates:

- Borderless window with working focus behavior.
- React HUD with Phaser animating a placeholder hunter and enemy.
- Word completion resulting in one damage event.
- Manual and focus-triggered pause.
- Open/close/reopen SQLite save.

If the taskbar-window experience proves unreliable on the target machine, fix or simplify the shell **before** producing the full monster roster.

## 12. Official references

- [Tauri 2 — Window customization](https://v2.tauri.app/learn/window-customization/)
- [Tauri 2 — Window configuration](https://v2.tauri.app/reference/config/)
- [Tauri 2 — Positioner plugin](https://v2.tauri.app/plugin/positioner/)
- [Tauri 2 — Capabilities and permissions](https://v2.tauri.app/security/capabilities/)
- [Phaser — Game concepts](https://docs.phaser.io/phaser/concepts/game)
- [Phaser — Getting started](https://docs.phaser.io/phaser/getting-started/installation)

These are references; prefer current upstream documentation when implementing version-specific APIs.
