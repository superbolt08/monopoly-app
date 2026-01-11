import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import Home from './components/Home';
import Setup from './components/Setup';
import Dashboard from './components/Dashboard';

function App() {
  const gameState = useGameStore((state) => state.gameState);
  const [showSetup, setShowSetup] = useState(false);

  if (!gameState) {
    return <Home onNewGame={() => setShowSetup(true)} />;
  }

  if (showSetup) {
    return <Setup onComplete={() => setShowSetup(false)} />;
  }

  return <Dashboard />;
}

export default App;
