import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { createInitialGameState, createDefaultSettings } from '../engine/initialState';
import type { GameSettings } from '../types';

interface SetupProps {
  onComplete: () => void;
}

export default function Setup({ onComplete }: SetupProps) {
  const setGameState = useGameStore((state) => state.setGameState);
  const [players, setPlayers] = useState<{ name: string }[]>([{ name: '' }, { name: '' }]);
  const [settings, setSettings] = useState<GameSettings>(createDefaultSettings());

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, { name: '' }]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index].name = name;
    setPlayers(newPlayers);
  };

  const handleStart = () => {
    const validPlayers = players.filter(p => p.name.trim() !== '');
    if (validPlayers.length < 2) {
      alert('Need at least 2 players');
      return;
    }

    const gameState = createInitialGameState(
      validPlayers.map(p => ({ name: p.name, balance: 0, ownedPropertyIds: [], isBankrupt: false })),
      settings
    );
    setGameState(gameState);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Game Setup</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Players</h3>
          {players.map((player, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(index, e.target.value)}
                placeholder={`Player ${index + 1} name`}
                className="flex-1 border rounded px-3 py-2"
              />
              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(index)}
                  className="bg-red-500 text-white px-4 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="mt-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Add Player
            </button>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block mb-1">Starting Cash</label>
              <input
                type="number"
                value={settings.startingCash}
                onChange={(e) => setSettings({ ...settings, startingCash: parseInt(e.target.value) || 1500 })}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Pass GO Amount</label>
              <input
                type="number"
                value={settings.passGoAmount}
                onChange={(e) => setSettings({ ...settings, passGoAmount: parseInt(e.target.value) || 200 })}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.freeParkingPot}
                onChange={(e) => setSettings({ ...settings, freeParkingPot: e.target.checked })}
                className="w-4 h-4"
              />
              <label>Free Parking collects fines</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enforceEvenBuilding}
                onChange={(e) => setSettings({ ...settings, enforceEvenBuilding: e.target.checked })}
                className="w-4 h-4"
              />
              <label>Enforce even building (monopoly rules)</label>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
