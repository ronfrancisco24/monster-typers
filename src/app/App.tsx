import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import HubScreen from './screens/HubScreen';
import HuntScreen from './screens/HuntScreen';
import CraftingScreen from './screens/CraftingScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import InventoryScreen from './screens/InventoryScreen';
import SkillsScreen from './screens/SkillsScreen';
import { placeWindow } from '../platform/desktopWindow';
import { mossSlime } from '../content/monsters';
import type { MonsterDefinition } from '../game/domain/types';

type Screen = 'hub' | 'hunt' | 'inventory' | 'skills' | 'crafting' | 'equipment';

export default function App() {
  const [screen, setScreen] = useState<Screen>('hub');
  const [selectedMonster, setSelectedMonster] = useState<MonsterDefinition>(mossSlime);

  useEffect(() => {
    void placeWindow();
  }, []);

  return (
    <div className="app-shell">
      <TitleBar />
      {screen === 'hub' ? (
        <HubScreen
          onStartHunt={(monster) => {
            setSelectedMonster(monster);
            setScreen('hunt');
          }}
          onOpenInventory={() => setScreen('inventory')}
          onOpenSkills={() => setScreen('skills')}
          onOpenCrafting={() => setScreen('crafting')}
          onOpenEquipment={() => setScreen('equipment')}
        />
      ) : screen === 'hunt' ? (
        <HuntScreen monster={selectedMonster} onReturnToHub={() => setScreen('hub')} />
      ) : screen === 'inventory' ? (
        <InventoryScreen onReturnToHub={() => setScreen('hub')} />
      ) : screen === 'skills' ? (
        <SkillsScreen onReturnToHub={() => setScreen('hub')} />
      ) : screen === 'crafting' ? (
        <CraftingScreen onReturnToHub={() => setScreen('hub')} />
      ) : screen === 'equipment' ? (
        <EquipmentScreen onReturnToHub={() => setScreen('hub')} />
      ) : (
        <CraftingScreen onReturnToHub={() => setScreen('hub')} />
      )}
    </div>
  );
}