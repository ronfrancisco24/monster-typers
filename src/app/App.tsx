import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import TabBar, { type MainTab } from './components/TabBar';
import TitleScreen from './screens/TitleScreen';
import HubScreen from './screens/HubScreen';
import HuntScreen from './screens/HuntScreen';
import CraftingScreen from './screens/CraftingScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import InventoryScreen from './screens/InventoryScreen';
import SkillsScreen from './screens/SkillsScreen';
import { placeWindow } from '../platform/desktopWindow';
import { mossSlime } from '../content/monsters';
import type { MonsterDefinition } from '../game/domain/types';
import { playMusic } from '../platform/uiAudio';

type Screen = 'title' | 'hunt' | MainTab;

function isMainTab(screen: Screen): screen is MainTab {
  return screen !== 'title' && screen !== 'hunt';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [selectedMonster, setSelectedMonster] = useState<MonsterDefinition>(mossSlime);

  useEffect(() => {
    void placeWindow();
  }, []);

  useEffect(() => {
    if (screen === 'hunt') return;
    playMusic('bgm.menu_hearth');
    const unlock = () => playMusic('bgm.menu_hearth');
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, [screen]);

  function renderScreen() {
    switch (screen) {
      case 'title':
        return <TitleScreen onContinue={() => setScreen('monsters')} />;
      case 'hunt':
        return <HuntScreen monster={selectedMonster} onReturnToHub={() => setScreen('monsters')} />;
      case 'monsters':
        return (
          <HubScreen
            onStartHunt={(monster) => {
              setSelectedMonster(monster);
              setScreen('hunt');
            }}
          />
        );
      case 'inventory':
        return <InventoryScreen onGoToMonsters={() => setScreen('monsters')} />;
      case 'skills':
        return <SkillsScreen />;
      case 'crafting':
        return <CraftingScreen />;
      case 'equipment':
        return <EquipmentScreen onGoToCrafting={() => setScreen('crafting')} />;
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <TitleBar />
      {isMainTab(screen) && <TabBar active={screen} onChange={(tab) => setScreen(tab)} />}
      <main className="app-main">{renderScreen()}</main>
    </div>
  );
}
