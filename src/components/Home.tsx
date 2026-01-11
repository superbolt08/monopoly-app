import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types';
import { getBackups } from '../utils/backup';

interface HomeProps {
  onNewGame: () => void;
}

export default function Home({ onNewGame }: HomeProps) {
  const setGameState = useGameStore((state) => state.setGameState);

  const handleLoadFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const state = JSON.parse(event.target?.result as string) as GameState;
            setGameState(state);
          } catch (error) {
            alert('Failed to load game: ' + (error as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResumeLast = () => {
    // Game state is already persisted, just check if it exists
    const stored = localStorage.getItem('monopoly-game-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.gameState) {
          setGameState(parsed.state.gameState);
        } else {
          alert('No saved game found');
        }
      } catch (error) {
        alert('Failed to resume game: ' + (error as Error).message);
      }
    } else {
      alert('No saved game found');
    }
  };

  const handleRecoverBackup = () => {
    const backups = getBackups();
    if (backups.length === 0) {
      alert('No backup saves found');
      return;
    }

    // Show backup selection dialog
    const backupList = backups
      .map((b, i) => {
        const date = new Date(b.timestamp);
        return `${i + 1}. ${date.toLocaleString()} (Game ID: ${b.gameId.substring(0, 8)}...)`;
      })
      .join('\n');

    const choice = prompt(
      `Found ${backups.length} backup(s). Enter number to restore (1-${backups.length}):\n\n${backupList}`
    );

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < backups.length) {
        const selectedBackup = backups[index];
        if (confirm(`Restore backup from ${new Date(selectedBackup.timestamp).toLocaleString()}?`)) {
          setGameState(selectedBackup.state);
        }
      } else {
        alert('Invalid selection');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Monopoly Bank + Game Manager</h1>
        <div className="space-y-4">
          <button
            onClick={onNewGame}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            New Game
          </button>
          <button
            onClick={handleLoadFromJSON}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Load from JSON
          </button>
          <button
            onClick={handleResumeLast}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition"
          >
            Resume Last Game
          </button>
          <button
            onClick={handleRecoverBackup}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition"
          >
            Recover from Backup
          </button>
        </div>
      </div>
    </div>
  );
}
