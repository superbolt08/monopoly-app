import type { GameState } from '../types';
import { BOARD_DEFINITION } from '../data/board';
import { getPropertyState } from '../engine/utils';

interface BoardViewProps {
  gameState: GameState;
}

export default function BoardView({ gameState }: BoardViewProps) {
  const getPlayersAtPosition = (position: number) => {
    return gameState.players.filter(p => p.position === position && !p.isBankrupt);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Board</h3>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {BOARD_DEFINITION.spaces.map((space, index) => {
          const playersHere = getPlayersAtPosition(space.position);
          const propState = space.propertyData ? getPropertyState(gameState, space.propertyData.id) : null;
          
          return (
            <div
              key={space.id}
              className={`p-2 rounded border ${
                space.type === 'PROPERTY' && propState?.ownerId
                  ? 'bg-green-50 border-green-300'
                  : space.type === 'PROPERTY'
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="font-semibold text-xs">{space.name}</div>
              {space.propertyData && (
                <div className="text-xs text-gray-600">
                  ${space.propertyData.price}
                  {propState?.mortgaged && <span className="text-red-600"> (M)</span>}
                  {propState?.houses > 0 && <span className="text-blue-600"> ({propState.houses}H)</span>}
                  {propState?.hotel && <span className="text-red-600"> (Hotel)</span>}
                </div>
              )}
              {playersHere.length > 0 && (
                <div className="mt-1">
                  {playersHere.map(p => (
                    <span key={p.id} className="inline-block bg-blue-500 text-white text-xs px-1 rounded mr-1">
                      {p.name[0]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
