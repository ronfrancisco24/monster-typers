import { useEffect } from 'react';
import TitleBar from './components/TitleBar';
import HuntScreen from './screens/HuntScreen';
import { placeWindow } from '../platform/desktopWindow';

export default function App() {
  useEffect(() => {
    void placeWindow();
  }, []);

  return (
    <div className="app-shell">
      <TitleBar />
      <HuntScreen />
    </div>
  );
}
