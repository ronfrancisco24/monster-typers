# Phase 05 — Desktop Polish and MVP Release

> **Status:** In progress (code pass done; manual QA/packaging pending)  
> **Goal:** Make the finished game reliable, comfortable, and pleasant as a taskbar-adjacent desktop companion.  
> **Dependencies:** [Phase 04](../04-content-expansion/steps.md) complete  
> **Outcome:** MVP release candidate

## Deliverable

A stable Windows build with compact idle mode, expanded hunt/menu mode, focus-safe typing, appropriately scaled pixel art/placeholders, settings, save/restart confidence, and a validated release checklist.

## Steps

### 1. Taskbar-adjacent window behavior

- [x] Implement compact/idle and expanded modes.
- [x] Open near the Windows taskbar without covering its interactive area by default.
- [x] Clamp position to current monitor work area.
- [ ] Test bottom/top/left/right taskbar layouts where practical.
- [ ] Test Windows display scaling and multi-monitor setups.
- [x] Add manual placement or reset-position control if automatic placement fails.
- [x] Make always-on-top optional, persisted, and easy to disable.
- [x] Support hide/show/close controls with no surprise process behavior.

### 2. Desktop focus and lifecycle

- [x] Pause immediately on Alt+Tab, minimize, hide, or focus loss.
- [x] Stop attack timers and reject input while paused.
- [x] Require a focused, deliberate Resume action.
- [x] Ensure browser/other app keystrokes never affect the hunter.
- [x] Closing during a hunt never settles loot and never corrupts a saved profile.
- [x] Reopen from a saved profile into a safe hub/idle state.

### 3. Retro presentation and accessibility

- [x] Replace or refine placeholders only with original/licensed assets.
- [x] Use consistent pixel scaling and prevent sprite interpolation blur.
- [x] Add useful attack, defense, break, victory, and defeat feedback.
- [x] Balance sounds and provide volume/mute settings.
- [x] Add reduced screen shake / effects preferences.
- [x] Verify typing text, countdown, and HP are legible at the smallest supported size.
- [x] Ensure error/success feedback is distinguishable without relying only on color.

### 4. Save safety and packaging

- [x] Verify DB migrations on old saves and fresh installs.
- [x] Verify atomic hunt rewards, skill purchases, and crafting under failure tests.
- [ ] Ensure installer/uninstaller behavior is documented and does not unexpectedly erase player saves.
- [ ] Build and launch a Windows release package on a clean/test environment.
- [ ] Launch without internet and verify all content is bundled locally.
- [x] Provide an app version and basic troubleshooting/recovery instructions.

### 5. Full MVP regression

- [x] Tutorial can be finished without extra instructions.
- [ ] All 12 monsters and 3 maps are reachable.
- [ ] All nine armor recipes and nine skills work.
- [ ] Standard hunts hit the intended short-session range.
- [ ] Bosses have functional phase changes and distinct drops.
- [ ] Player can craft, equip, level, purchase upgrades, and persist progress.
- [ ] Duplicate settlement never produces duplicate rewards.
- [ ] Focus loss during an attack never causes hidden damage.
- [ ] Settings and preferred window behavior persist across restarts.
- [ ] At least one end-to-end playthrough from new save to final boss succeeds.

### 6. Release decision

- [ ] Compare implementation against `docs/mvp.md` item by item.
- [ ] Record unresolved bugs with severity and reproducible steps.
- [ ] Resolve all blockers affecting save integrity, input safety, progression, or crashes.
- [ ] Conduct a short external playtest and incorporate critical clarity fixes.
- [ ] Freeze MVP content and defer nonessential new features.
- [ ] Tag a release candidate when all exit criteria pass.

## Definition of done

A tester can install the game, hunt for a few minutes in a small desktop window, Alt+Tab safely, complete all progression, close/restart without losing rewards, and manage visibility/always-on-top intentionally. The MVP acceptance checklist passes.

## Explicitly defer

Gacha, virtual currency, daily rewards, multiplayer, cloud saves, accounts, new monster packs, paid content, and any feature requiring a backend.

## End-of-phase notes

- **Release candidate version:** _To fill in_
- **Known nonblocking limitations:** _To fill in_
- **Post-MVP priorities:** _To fill in_
