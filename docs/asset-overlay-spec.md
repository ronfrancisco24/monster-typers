# Hunter Armor Overlay Sprite Spec

Overlays are composited on top of the base `hunter.default` sprite in `HuntScene`. The base body drives all animation; overlays are static images that follow the base sprite's position and tint. This keeps asset count low (9 overlays instead of 9 full sprite sets) while making equipped armor visible.

## Naming

`hunter.overlay.<slot>.<equipment_id>.png`

Examples:
- `hunter.overlay.head.equipment.moss_hood.png`
- `hunter.overlay.chest.equipment.mossweave_vest.png`
- `hunter.overlay.feet.equipment.moss_boots.png`

Slot values: `head`, `chest`, `feet`. Equipment id is the full stable ID (dots preserved).

## Dimensions

| Item | Size (px) | Anchor | Notes |
|---|---|---|---|
| Base hunter | 48 × 48 | 0.5, 1.0 | Already exists (`hunter.default`) |
| Head overlay | 48 × 48 | 0.5, 1.0 | Transparent except head region (top ~16px) |
| Chest overlay | 48 × 48 | 0.5, 1.0 | Transparent except torso region (middle ~24px) |
| Feet overlay | 48 × 48 | 0.5, 1.0 | Transparent except legs/feet (bottom ~16px) |

All overlays must be exactly 48×48 to align with the base sprite. Only the armor region is opaque; everything else is transparent (binary alpha, no partial transparency).

## States (optional, recommended minimal)

- **Static (recommended):** one overlay per slot per item. The base sprite animates (idle bob, attack lunge, hit flash, defeat fade); overlays follow position but do not animate. Simplest; 9 overlays total.
- **Animated (optional):** separate overlays per state (`hunter.overlay.head.equipment.moss_hood.idle.png`, `.attack.png`, etc.). Only needed if the armor shape changes dramatically during attacks. Not recommended for MVP.

## Palette

Use the 32-color master palette from `manifest.json`. Overlays must not introduce new colors. The base hunter body stays `#38bdf8`-ish (player blue); armor uses set-appropriate tones (Mossbound greens, Crystalbound blues, Ashenbound oranges).

## Part-break / tint interaction

- Overlays are tinted together with the base sprite when a full set is equipped (see `HuntScene.detectFullSet`).
- Part-break on the monster does not affect the hunter overlay.

## Integration (when assets are ready)

In `HuntScene`:
1. Preload each overlay as an image keyed by its filename stem (e.g., `hunter.overlay.head.equipment.moss_hood`).
2. Create three overlay sprites (`headOverlay`, `chestOverlay`, `feetOverlay`) at the hunter's position, initially invisible.
3. In `setEquipment(loadout)`, for each slot set the overlay texture (or hide if empty) and sync position each frame (or parent to the hunter sprite).
4. Apply the same tint to overlays as the base when a full set is equipped.

## Asset count

- 9 overlays (one per equipment item), static version.
- If animated: 9 × 4 states = 36 overlays (not recommended for MVP).

## Notes

- The hunt scene currently tints the entire hunter sprite by set color as an interim visual. Overlays replace the tint with per-piece art.
- Mixed sets (e.g., Moss Hood + Crystal Plate) will show both overlays correctly — this is the advantage over per-set full sprites.
- Keep overlay file sizes small (indexed PNG, ≤ 2 KB each expected).
