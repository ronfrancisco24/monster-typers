# Data — Local Database and Game Catalog

> **Status:** Initial data model proposal  
> **Database:** SQLite, stored on the player's device  
> **Scope:** Single player, one save profile, offline MVP  
> **Related:** [Architecture](./architecture.md) · [MVP](./mvp.md) · [Design](./design.md) · [Later features](./later-features.md)

## 1. Storage strategy

There are **two kinds of data**:

| Type | Examples | Location |
| --- | --- | --- |
| Static game definitions | Monsters, maps, materials, equipment stats, recipes, skills, word pools | Versioned files bundled with the application (`src/content/`) |
| Mutable player data | XP, owned materials, crafted armor, equipped gear, skill ranks, unlocked maps, hunt history, settings | Local SQLite database |

**Why not put every monster in SQLite?** Monster definitions are shipped with the game and do not need per-user edits. Keeping definitions in code/JSON allows content changes without repeatedly seeding static DB tables. Saved rows store **stable IDs** that refer to those definitions.

**No PostgreSQL or network database is needed in MVP.** The SQLite file should live in Tauri's per-user application-data directory, not the project's source folder or current working directory.

## 2. Entity relationships

```text
player_progress (exactly one row)
    │
    ├── inventory_materials (material ID → quantity)
    ├── owned_equipment (equipment ID owned once)
    │        └── equipment_loadout (head / chest / feet)
    ├── skill_ranks (skill ID → purchased rank)
    ├── map_unlocks (map IDs already unlocked)
    ├── hunt_history (immutable settled hunt results)
    └── app_settings (saved user preferences)

bundled content catalog:
    maps ↔ monsters → possible material drops
                  ↘ breakable parts → bonus drops
    equipment → recipes → material IDs
    skill definitions → rank effects
```

All MVP tables belong to the single profile (`id = 1`) and therefore do **not** need redundant `user_id` foreign keys. Introduce profile keys only if multiple saves become an approved requirement.

## 3. Identifier conventions

Use stable, readable catalog IDs. Examples:

- Map: `map.verdant_forest`
- Monster: `monster.thorn_boar`
- Material: `material.boar_fang`
- Armor: `equipment.forest_helmet`
- Skill: `skill.offense.sharp_strikes`

Do not use display names as IDs. Do not rename an ID after release without a deliberate save migration / compatibility alias. Validate that every item referenced by recipes and drops exists in the catalog.

## 4. SQLite schema (MVP proposal)

Treat this as the **v1 logical schema**. Implement it as versioned migration file(s) inside `src-tauri/src/migrations/`; do not execute this whole example on every startup as unversioned application code.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE player_progress (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hunter_level INTEGER NOT NULL DEFAULT 1 CHECK (hunter_level >= 1),
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  unspent_skill_points INTEGER NOT NULL DEFAULT 0
    CHECK (unspent_skill_points >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE inventory_materials (
  material_id TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

CREATE TABLE owned_equipment (
  equipment_id TEXT PRIMARY KEY,
  crafted_at TEXT NOT NULL
);

CREATE TABLE equipment_loadout (
  slot TEXT PRIMARY KEY CHECK (slot IN ('head', 'chest', 'feet')),
  equipment_id TEXT NOT NULL UNIQUE,
  FOREIGN KEY (equipment_id) REFERENCES owned_equipment(equipment_id)
    ON DELETE RESTRICT
);

CREATE TABLE skill_ranks (
  skill_id TEXT PRIMARY KEY,
  rank INTEGER NOT NULL CHECK (rank >= 1)
);

CREATE TABLE map_unlocks (
  map_id TEXT PRIMARY KEY,
  unlocked_at TEXT NOT NULL
);

CREATE TABLE hunt_history (
  hunt_id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,
  monster_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (
    outcome IN ('victory', 'defeat', 'abandoned')
  ),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  correct_keystrokes INTEGER NOT NULL DEFAULT 0
    CHECK (correct_keystrokes >= 0),
  incorrect_keystrokes INTEGER NOT NULL DEFAULT 0
    CHECK (incorrect_keystrokes >= 0),
  words_completed INTEGER NOT NULL DEFAULT 0 CHECK (words_completed >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  loot_json TEXT NOT NULL DEFAULT '[]',
  broken_part_ids_json TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT NOT NULL
);

CREATE INDEX idx_hunt_history_monster_outcome
  ON hunt_history (monster_id, outcome);

CREATE INDEX idx_hunt_history_completed_at
  ON hunt_history (completed_at);

CREATE TABLE app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);
```

### What each table does

| Table | Purpose |
| --- | --- |
| `player_progress` | Level, lifetime XP and available skill points |
| `inventory_materials` | Quantity of each crafting material |
| `owned_equipment` | Each unique armor piece the player has crafted |
| `equipment_loadout` | Which owned armor piece is equipped in each slot |
| `skill_ranks` | Skills purchased (missing row = rank 0) |
| `map_unlocks` | Which regions are unlocked |
| `hunt_history` | Settled results; unique `hunt_id` prevents double rewards |
| `app_settings` | Volume, display behavior, reduced effects, etc. |

### Schema design notes

- Times are **UTC ISO 8601 strings**. Pick one consistent encoding and enforce it in the persistence layer.
- SQLite IDs for game catalog content are strings; **they are not foreign keys** to SQLite tables because the catalog is bundled.
- `loot_json` and `broken_part_ids_json` are **history snapshots**, not the inventory source of truth. Validate their JSON shape before writing.
- No `current_hp` field: health resets at the beginning of a new hunt.
- No persistent `active_hunts` table: an interrupted/crashed hunt is abandoned with no rewards.
- The `equipment_loadout.equipment_id` uniqueness rule means a piece cannot occupy two slots at the same time.
- Enforce each armor piece's correct slot against the **content catalog** before changing the loadout.
- Database `CHECK` constraints protect basic sanity; max skill rank, level curves, and catalog-specific rules are validated in the application/domain logic.

## 5. Seed state

Create only when the save does not exist:

```text
player_progress:
  id = 1
  hunter_level = 1
  total_xp = 0
  unspent_skill_points = 0

map_unlocks:
  map.verdant_forest

inventory_materials: empty
owned_equipment: empty
equipment_loadout: empty
skill_ranks: empty
hunt_history: empty
app_settings: defaults from UI settings
```

The map is initially unlocked even before any kills. A boss becomes selectable when the region's three standard monsters each have at least one victory in `hunt_history`. The next region is unlocked after its previous region boss is defeated.

## 6. Static catalog shape

Keep these definitions out of the player database:

```ts
type MaterialDefinition = {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'boss';
};

type DropEntry = {
  materialId: string;
  chance: number; // 0..1
  minQuantity: number;
  maxQuantity: number;
};

type MonsterDefinition = {
  id: string;
  mapId: string;
  name: string;
  isBoss: boolean;
  hp: number;
  attackDamage: number;
  attackCadenceMs: number;
  attackWords: string[];
  defenseWords: string[];
  drops: DropEntry[];
  // Optional part breaks and boss phases are separate typed definitions.
};

type EquipmentDefinition = {
  id: string;
  name: string;
  slot: 'head' | 'chest' | 'feet';
  setId: string;
  statModifiers: Record<string, number>;
  recipe: Array<{ materialId: string; quantity: number }>;
};

type SkillDefinition = {
  id: string;
  branch: 'offense' | 'defense' | 'gathering';
  maxRank: number;
  pointCostPerRank: number[];
  // Effects are modeled explicitly in actual implementation.
};
```

**Validation at app startup:** unique IDs; valid foreign catalog references; valid probabilities and nonnegative costs; correct map/monster counts; no monster without attack words; no gear without a valid slot or recipe; exactly the expected MVP monster/armor/skill quantity for content-release checks.

## 7. Reward and save transactions

### `finalize_hunt(huntResult)`

Must be **atomic** and **idempotent**:

1. Validate `huntResult` and confirm no settlement exists with the same `hunt_id`.
2. Start SQLite transaction.
3. Insert `hunt_history` row with immutable result summary.
4. On victory only, add XP, award resulting skill points, and upsert material quantities.
5. On qualifying boss victory, insert next `map_unlocks` row if missing.
6. Commit once; return committed reward summary.
7. If `hunt_id` already exists, return the previous result without mutating XP/inventory again.

**Critical:** Do not write an XP update, inventory update, and history row in separate unprotected application calls. If an operation fails, none of its changes should remain.

### `craft_equipment(equipmentId)`

Within one transaction:

1. Confirm the ID is a craftable catalog item and is not already owned.
2. Confirm every ingredient quantity is sufficient.
3. Deduct each ingredient, insert owned equipment, and commit.
4. Return updated inventory and ownership.

### `purchase_skill_rank(skillId)`

Within one transaction:

1. Read current rank and unspent skill points.
2. Check known skill ID, rank cap, and next-rank point cost.
3. Deduct points, update rank, commit.
4. Return new rank, points, and derived stat changes.

### `equip_item(slot, equipmentId)`

Within one transaction, verify ownership and slot compatibility, then upsert the loadout row. Unequip removes the slot row. Do not consume the equipment item on equip.

## 8. Derived values: avoid duplicate mutable state

Compute these from saved rows + static definitions when needed:

- Maximum health from base stats + skill ranks + equipped gear.
- Attack damage, defense, combo bonuses, break bonuses.
- Whether a boss is unlocked (victories against the three standard region monsters).
- Whether a recipe is craftable (inventory quantities + ownership).
- Next level XP requirement (the defined XP curve).

Persist `hunter_level` for convenience only if it is always updated **together** with `total_xp` and awarded skill points. Never calculate and award level-up points independently on every startup.

## 9. Data migration and recovery policy

- Use numbered migrations: `001_initial.sql`, `002_...sql`, etc.
- Record migration version via SQLite `PRAGMA user_version` or a dedicated migration tracker. Choose one; do not maintain two competing sources.
- Migrate inside a transaction when possible; test against copies of old save files.
- Before a migration that changes saved data substantially, keep a restorable backup.
- On load failure, report the problem and offer backup/export/reset actions; do not silently create a new profile on top of a broken existing file.
- Keep unknown/deprecated catalog references visible for diagnosis rather than deleting them automatically.
- Unit tests should use ephemeral SQLite DBs; do not test destructive migrations on the developer's real save.

## 10. Future gacha data (NOT for MVP)

A later local gacha economy may require:

| Proposed table | Purpose |
| --- | --- |
| `currency_wallets` | Current earned currency balances |
| `currency_ledger` | Append-only earn/spend transactions |
| `gacha_pull_history` | Each completed pull: pool/version, spent amount, rewards |
| `cosmetic_unlocks` | Items collected from pools |
| `gacha_pity_state` | Counters, only if a guarantee mechanic is implemented |

A pull must be an atomic write and duplicate-safe, just like `finalize_hunt`. Never add these tables until a gacha feature is approved and designed. See [later-features.md](./later-features.md).

## 11. Database acceptance tests

- [ ] Clean launch creates one profile and unlocks the forest.
- [ ] Second launch does not duplicate starter data.
- [ ] Completing a hunt once grants one XP/loot settlement.
- [ ] Repeating `finalize_hunt` with the same ID grants nothing additional.
- [ ] Insufficient materials reject crafting with no inventory changes.
- [ ] Crafting deducts all ingredients and grants ownership in one commit.
- [ ] Owned armor equips only to its specified slot.
- [ ] Skill purchase never exceeds cost, available points, or rank limit.
- [ ] Defeated/abandoned hunts do not pay monster loot.
- [ ] Boss victory unlocks only the correct next map.
- [ ] Schema migrations preserve a previously saved inventory and equipment state.
- [ ] A crash during a multi-table write cannot leave partially applied rewards.

## 12. Initial implementation order

1. Implement SQLite open + versioned migration runner.
2. Implement seed and `load_game_save`.
3. Implement hunt-history insert / idempotent `finalize_hunt`.
4. Add inventory material mutation to victory settlement.
5. Implement crafting, equipment loadout, skills, map unlocks.
6. Add settings persistence and migration regression tests.
