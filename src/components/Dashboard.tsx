import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getCurrentPlayer } from '../engine/utils';
import type { GameAction } from '../engine/actions';
import ActionPanel from './ActionPanel';
import PlayersList from './PlayersList';
import TransactionLog from './TransactionLog';
import PropertyManager from './PropertyManager';
import TradeModal from './TradeModal';
import TrainEventModal from './TrainEventModal';
import ChanceEventModal from './ChanceEventModal';
import FreeParkingEventModal from './FreeParkingEventModal';

export default function Dashboard() {
  const gameState = useGameStore((state) => state.gameState);
  const dispatch = useGameStore((state) => state.dispatch);
  const error = useGameStore((state) => state.error);
  const quitGame = useGameStore((state) => state.quitGame);
  const [showPropertyManager, setShowPropertyManager] = useState(false);
  const [showTrade, setShowTrade] = useState(false);

  if (!gameState) {
    return <div>No game state</div>;
  }

  const currentPlayer = getCurrentPlayer(gameState);

  const handleAction = async (action: GameAction) => {
    await dispatch(action);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monopoly-game-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Monopoly Bank + Game Manager</h1>
            <p className="text-sm text-gray-600">Turn {gameState.turnNumber} - Player {gameState.currentTurnIndex + 1}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export Game
            </button>
            <button
              onClick={quitGame}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Quit Game
            </button>
          </div>
        </div>

        {/* Current Turn Banner */}
        <div className="bg-blue-600 text-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{currentPlayer.name}'s Turn</h2>
              <p>Balance: ${currentPlayer.balance}</p>
              {currentPlayer.inJail && (
                <p className="text-yellow-300">In Jail</p>
              )}
            </div>
            <div className="text-right">
              <p>Phase: {gameState.phase}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <ActionPanel
              gameState={gameState}
              onAction={handleAction}
              onShowPropertyManager={() => setShowPropertyManager(true)}
              onShowTrade={() => setShowTrade(true)}
            />
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <PlayersList gameState={gameState} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <TransactionLog gameState={gameState} onUndo={() => handleAction({ type: 'UNDO_LAST' })} />
          </div>
        </div>
      </div>

      {showPropertyManager && (
        <PropertyManager
          gameState={gameState}
          onClose={() => setShowPropertyManager(false)}
          onAction={handleAction}
        />
      )}

      {showTrade && (
        <TradeModal
          gameState={gameState}
          onClose={() => setShowTrade(false)}
          onAction={handleAction}
        />
      )}

      {(gameState.trainEventProperty === '' || (gameState.trainEventProperty && gameState.trainEventProperty !== null)) && (
        <TrainEventModal
          gameState={gameState}
          onClose={() => {
            // Event will be cleared when action is applied
          }}
          onAction={handleAction}
        />
      )}

      {gameState.chanceEventOutcome && (
        <ChanceEventModal
          gameState={gameState}
          onClose={() => {
            // Event will be cleared when action is applied
          }}
          onAction={handleAction}
        />
      )}

      {gameState.freeParkingPrize && (
        <FreeParkingEventModal
          gameState={gameState}
          onClose={() => {
            // Event will be cleared when action is applied
          }}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
