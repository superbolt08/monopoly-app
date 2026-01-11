import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer, getSpaceAtPosition, getPropertyState } from '../engine/utils';

interface ActionPanelProps {
  gameState: GameState;
  onAction: (action: GameAction) => void;
  onShowPropertyManager: () => void;
  onShowTrade: () => void;
}

export default function ActionPanel({ gameState, onAction, onShowPropertyManager, onShowTrade }: ActionPanelProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const currentSpace = getSpaceAtPosition(currentPlayer.position);
  const [diceOverride, setDiceOverride] = useState<[number, number] | null>(null);

  const handleRollDice = () => {
    if (diceOverride) {
      onAction({ type: 'ROLL_DICE', dice: diceOverride });
      setDiceOverride(null);
    } else {
      onAction({ type: 'ROLL_DICE' });
    }
  };

  const canBuyProperty = () => {
    if (currentSpace.type !== 'PROPERTY' && currentSpace.type !== 'RAILROAD' && currentSpace.type !== 'UTILITY') {
      return false;
    }
    if (!currentSpace.propertyData) return false;
    const propState = getPropertyState(gameState, currentSpace.propertyData.id);
    return !propState || !propState.ownerId;
  };

  const needsToPayRent = () => {
    if (currentSpace.type !== 'PROPERTY' && currentSpace.type !== 'RAILROAD' && currentSpace.type !== 'UTILITY') {
      return false;
    }
    if (!currentSpace.propertyData) return false;
    const propState = getPropertyState(gameState, currentSpace.propertyData.id);
    return propState && propState.ownerId && propState.ownerId !== currentPlayer.id && !propState.mortgaged;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Actions</h3>
      <div className="space-y-2">
        {gameState.phase === 'NORMAL' && !currentPlayer.inJail && (
          <>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="6"
                placeholder="Dice 1"
                value={diceOverride?.[0] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 6) {
                    setDiceOverride([val, diceOverride?.[1] || 1]);
                  }
                }}
                className="w-20 border rounded px-2 py-1"
              />
              <input
                type="number"
                min="1"
                max="6"
                placeholder="Dice 2"
                value={diceOverride?.[1] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 6) {
                    setDiceOverride([diceOverride?.[0] || 1, val]);
                  }
                }}
                className="w-20 border rounded px-2 py-1"
              />
              <button
                onClick={handleRollDice}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Roll Dice
              </button>
            </div>
            {canBuyProperty() && currentSpace.propertyData && (
              <button
                onClick={() => onAction({ type: 'BUY_PROPERTY', propertyId: currentSpace.propertyData!.id })}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Buy {currentSpace.propertyData.name} (${currentSpace.propertyData.price})
              </button>
            )}
            {canBuyProperty() && (
              <button
                onClick={() => onAction({ type: 'SKIP_PURCHASE' })}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Skip Purchase
              </button>
            )}
            {needsToPayRent() && currentSpace.propertyData && (
              <button
                onClick={() => onAction({ type: 'PAY_RENT', propertyId: currentSpace.propertyData!.id })}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Pay Rent
              </button>
            )}
            {(currentSpace.type === 'TAX') && (
              <button
                onClick={() => {
                  const amount = currentSpace.name === 'Income Tax' ? 200 : 100;
                  onAction({ type: 'PAY_TAX', amount });
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Pay Tax (${currentSpace.name === 'Income Tax' ? 200 : 100})
              </button>
            )}
            {(currentSpace.type === 'CHANCE' || currentSpace.type === 'COMMUNITY_CHEST') && (
              <button
                onClick={() => onAction({ type: 'DRAW_CARD', deckType: currentSpace.type === 'CHANCE' ? 'CHANCE' : 'COMMUNITY_CHEST' })}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Draw Card
              </button>
            )}
            <button
              onClick={() => onAction({ type: 'END_TURN' })}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              End Turn
            </button>
          </>
        )}

        {currentPlayer.inJail && gameState.phase === 'IN_JAIL_DECISION' && (
          <>
            <button
              onClick={() => onAction({ type: 'JAIL_PAY_FINE' })}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Pay $50 Fine
            </button>
            {currentPlayer.getOutOfJailFreeChance && (
              <button
                onClick={() => onAction({ type: 'JAIL_USE_CARD', cardType: 'CHANCE' })}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Use Get Out of Jail Free (Chance)
              </button>
            )}
            {currentPlayer.getOutOfJailFreeChest && (
              <button
                onClick={() => onAction({ type: 'JAIL_USE_CARD', cardType: 'COMMUNITY_CHEST' })}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Use Get Out of Jail Free (Community Chest)
              </button>
            )}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="6"
                placeholder="Dice 1"
                value={diceOverride?.[0] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 6) {
                    setDiceOverride([val, diceOverride?.[1] || 1]);
                  }
                }}
                className="w-20 border rounded px-2 py-1"
              />
              <input
                type="number"
                min="1"
                max="6"
                placeholder="Dice 2"
                value={diceOverride?.[1] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 6) {
                    setDiceOverride([diceOverride?.[0] || 1, val]);
                  }
                }}
                className="w-20 border rounded px-2 py-1"
              />
              <button
                onClick={handleRollDice}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Roll for Doubles
              </button>
            </div>
          </>
        )}

        <div className="border-t pt-2 mt-2">
          <button
            onClick={onShowPropertyManager}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-2"
          >
            Manage Properties
          </button>
          <button
            onClick={onShowTrade}
            className="w-full bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mb-2"
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  );
}
