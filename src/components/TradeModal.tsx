import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer, getPlayerProperties, getPropertyData } from '../engine/utils';

interface TradeModalProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function TradeModal({ gameState, onClose, onAction }: TradeModalProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [toPlayerId, setToPlayerId] = useState<string>(gameState.players.find(p => p.id !== currentPlayer.id && !p.isBankrupt)?.id || '');
  const [cashFrom, setCashFrom] = useState(0);
  const [cashTo, setCashTo] = useState(0);
  const [propertiesFrom, setPropertiesFrom] = useState<string[]>([]);
  const [propertiesTo, setPropertiesTo] = useState<string[]>([]);

  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id && !p.isBankrupt);
  const currentPlayerProps = getPlayerProperties(gameState, currentPlayer.id);
  const toPlayer = gameState.players.find(p => p.id === toPlayerId);
  const toPlayerProps = toPlayer ? getPlayerProperties(gameState, toPlayer.id) : [];

  const toggleProperty = (propertyId: string, from: boolean) => {
    if (from) {
      setPropertiesFrom(prev =>
        prev.includes(propertyId)
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    } else {
      setPropertiesTo(prev =>
        prev.includes(propertyId)
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    }
  };

  const handleExecute = () => {
    if (!toPlayerId) {
      alert('Select a player to trade with');
      return;
    }

    onAction({
      type: 'TRADE_EXECUTE',
      fromPlayerId: currentPlayer.id,
      toPlayerId,
      cashFrom,
      cashTo,
      propertiesFrom,
      propertiesTo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Trade</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <label className="block mb-1">Trade with:</label>
            <select
              value={toPlayerId}
              onChange={(e) => setToPlayerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select player...</option>
              {otherPlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">{currentPlayer.name} gives:</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm">Cash:</label>
                  <input
                    type="number"
                    min="0"
                    max={currentPlayer.balance}
                    value={cashFrom}
                    onChange={(e) => setCashFrom(parseInt(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm">Properties:</label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2">
                    {currentPlayerProps.map(prop => {
                      const propData = getPropertyData(gameState, prop.propertyId);
                      return propData ? (
                        <label key={prop.propertyId} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={propertiesFrom.includes(prop.propertyId)}
                            onChange={() => toggleProperty(prop.propertyId, true)}
                          />
                          {propData.name}
                        </label>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{toPlayer?.name || 'Other Player'} gives:</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm">Cash:</label>
                  <input
                    type="number"
                    min="0"
                    max={toPlayer?.balance || 0}
                    value={cashTo}
                    onChange={(e) => setCashTo(parseInt(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm">Properties:</label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2">
                    {toPlayerProps.map(prop => {
                      const propData = getPropertyData(gameState, prop.propertyId);
                      return propData ? (
                        <label key={prop.propertyId} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={propertiesTo.includes(prop.propertyId)}
                            onChange={() => toggleProperty(prop.propertyId, false)}
                          />
                          {propData.name}
                        </label>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleExecute}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Execute Trade
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
