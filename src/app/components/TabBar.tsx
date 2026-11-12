import { playUi } from '../../platform/uiAudio';

export type MainTab = 'monsters' | 'inventory' | 'skills' | 'crafting' | 'equipment';

const TABS: ReadonlyArray<{ id: MainTab; label: string; icon: string }> = [
  { id: 'monsters', label: 'Monsters', icon: '/sprites/monsters/monster.moss_slime.idle.00.png' },
  { id: 'inventory', label: 'Inventory', icon: '/sprites/items/material.moss_gel.png' },
  { id: 'skills', label: 'Skills', icon: '/sprites/ui/skill.blade_mastery.png' },
  { id: 'crafting', label: 'Crafting', icon: '/sprites/items/equipment.moss_hood.png' },
  { id: 'equipment', label: 'Equipment', icon: '/sprites/items/equipment.mossweave_vest.png' },
];

interface Props {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tabbar__btn${selected ? ' tabbar__btn--active' : ''}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => {
              if (!selected) playUi('select');
              onChange(tab.id);
            }}
          >
            <img className="tabbar__icon" src={tab.icon} alt="" width={16} height={16} />
            <span className="tabbar__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
