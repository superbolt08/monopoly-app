import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer } from '../engine/utils';
import { PROPERTIES } from '../data/properties';
import { getPropertyState } from '../engine/utils';

interface ActionPanelProps {
  gameState: GameState;
  onAction: (action: GameAction) => void;
  onShowPropertyManager: () => void;
  onShowTrade: () => void;
}

export default function ActionPanel({ gameState, onAction, onShowPropertyManager, onShowTrade }: ActionPanelProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [rentFromPlayer, setRentFromPlayer] = useState<string>('');
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [rentProperty, setRentProperty] = useState<string>('');

  const availableProperties = PROPERTIES.filter(prop => {
    const propState = getPropertyState(gameState, prop.id);
    return !propState || !propState.ownerId;
  });

  const handleBuyProperty = () => {
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }
    if (buyPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }
    onAction({ type: 'BUY_PROPERTY', propertyId: selectedProperty, price: buyPrice });
    setSelectedProperty('');
    setBuyPrice(0);
  };

  const handleCollectRent = () => {
    if (!rentFromPlayer) {
      alert('Please select a player');
      return;
    }
    if (rentAmount <= 0) {
      alert('Please enter a valid rent amount');
      return;
    }
    onAction({
      type: 'COLLECT_RENT',
      fromPlayerId: rentFromPlayer,
      toPlayerId: currentPlayer.id,
      amount: rentAmount,
      propertyId: rentProperty || undefined,
    });
    setRentFromPlayer('');
    setRentAmount(0);
    setRentProperty('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Actions</h3>
      <div className="space-y-4">
        {/* Buy Property */}
        <div className="border-b pb-4">
          <h4 className="font-semibold mb-2">Buy Property</h4>
          <div className="space-y-2">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select property...</option>
              {availableProperties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Price"
                value={buyPrice || ''}
                onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleBuyProperty}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Buy
              </button>
            </div>
          </div>
        </div>

        {/* Collect Rent */}
        <div className="border-b pb-4">
          <h4 className="font-semibold mb-2">Collect Rent</h4>
          <div className="space-y-2">
            <select
              value={rentFromPlayer}
              onChange={(e) => setRentFromPlayer(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select player...</option>
              {gameState.players
                .filter(p => p.id !== currentPlayer.id && !p.isBankrupt)
                .map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
            </select>
            <select
              value={rentProperty}
              onChange={(e) => setRentProperty(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">No specific property</option>
              {PROPERTIES.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Rent amount"
                value={rentAmount || ''}
                onChange={(e) => setRentAmount(parseInt(e.target.value) || 0)}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleCollectRent}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Collect
              </button>
            </div>
          </div>
        </div>

        {/* Other Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onAction({ type: 'END_TURN' })}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            End Turn
          </button>
          <button
            onClick={onShowPropertyManager}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Manage Properties
          </button>
          <button
            onClick={onShowTrade}
            className="w-full bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  );
}
