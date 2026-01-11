import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer, getPropertyState, getPropertyData } from '../engine/utils';

interface TrainEventModalProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function TrainEventModal({ gameState, onClose, onAction }: TrainEventModalProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [rentAmount, setRentAmount] = useState<number>(0);

  if (!gameState.trainEventProperty) {
    return null;
  }

  const propertyId = gameState.trainEventProperty;
  const propState = getPropertyState(gameState, propertyId);
  const propData = getPropertyData(gameState, propertyId);
  const owner = propState?.ownerId ? gameState.players.find(p => p.id === propState.ownerId) : null;

  const handleBuy = () => {
    if (buyPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }
    onAction({ type: 'TRAIN_EVENT_BUY', propertyId, price: buyPrice });
    onClose();
  };

  const handleSkip = () => {
    onAction({ type: 'TRAIN_EVENT_SKIP' });
    onClose();
  };

  const handlePayRent = () => {
    if (rentAmount <= 0) {
      alert('Please enter a valid rent amount');
      return;
    }
    onAction({ type: 'TRAIN_EVENT_PAY_RENT', propertyId, amount: rentAmount });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Train Event</h2>
          <p className="mb-4">Selected Property: <strong>{propData?.name || propertyId}</strong></p>

          {!propState || !propState.ownerId ? (
            <div>
              <p className="mb-4">This property is unowned. Would you like to buy it?</p>
              <div className="space-y-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter price"
                  value={buyPrice || ''}
                  onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleBuy}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Buy Property
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ) : owner?.id === currentPlayer.id ? (
            <div>
              <p className="mb-4 text-gray-600">You already own this property.</p>
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4">This property is owned by <strong>{owner?.name}</strong>. You must pay rent.</p>
              <div className="space-y-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter rent amount"
                  value={rentAmount || ''}
                  onChange={(e) => setRentAmount(parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  onClick={handlePayRent}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Pay Rent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
