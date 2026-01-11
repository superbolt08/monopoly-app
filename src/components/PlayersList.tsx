import type { GameState } from '../types';
import { getCurrentPlayer } from '../engine/utils';

interface PlayersListProps {
  gameState: GameState;
}

export default function PlayersList({ gameState }: PlayersListProps) {
  const currentPlayer = getCurrentPlayer(gameState);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Players</h3>
      <div className="space-y-2">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded border-2 ${
              player.id === currentPlayer.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            } ${player.isBankrupt ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{player.name}</p>
                <p className="text-sm text-gray-600">Balance: ${player.balance}</p>
                <p className="text-sm text-gray-600">Properties: {player.ownedPropertyIds.length}</p>
                {player.isBankrupt && (
                  <p className="text-sm text-red-600">Bankrupt</p>
                )}
              </div>
              {player.id === currentPlayer.id && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Current</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
