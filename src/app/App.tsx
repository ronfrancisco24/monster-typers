import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import HubScreen from './screens/HubScreen';
import HuntScreen from './screens/HuntScreen';
import { placeWindow } from '../platform/desktopWindow';
import { mossSlime } from '../content/monsters';
import type { MonsterDefinition } from '../game/domain/types';

type Screen = 'hub' | 'hunt';

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
        />
      ) : (
        <HuntScreen monster={selectedMonster} onReturnToHub={() => setScreen('hub')} />
      )}
    </div>
  );
}