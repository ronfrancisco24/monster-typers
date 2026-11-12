import { getMaterial, materialName } from '../../content/materials';

// Only a subset of material ids shipped 16x16 sprites; the rest fall back to a letter tile.
const ICON_IDS = new Set([
  'material.moss_gel',
  'material.ancient_bark',
  'material.crystal_shard',
  'material.bat_wing',
  'material.golem_core',
  'material.boar_tusk',
  'material.serpent_scale',
  'material.wyvern_scale',
]);

interface Props {
  id: string;
  size?: number;
  title?: string;
}

export default function MaterialIcon({ id, size = 16, title }: Props) {
  if (ICON_IDS.has(id)) {
    return (
      <img
        className="material-icon"
        src={`/sprites/items/${id}.png`}
        alt=""
        title={title}
        width={size}
        height={size}
      />
    );
  }

  const rarity = getMaterial(id)?.rarity ?? 'common';
  return (
    <span
      className={`material-icon material-icon--fallback material-icon--${rarity}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      title={title}
      aria-hidden="true"
    >
      {materialName(id).charAt(0)}
    </span>
  );
}
