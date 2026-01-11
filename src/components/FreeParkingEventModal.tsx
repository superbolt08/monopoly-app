import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getPropertyData } from '../engine/utils';

interface FreeParkingEventModalProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function FreeParkingEventModal({ gameState, onClose, onAction }: FreeParkingEventModalProps) {
  if (!gameState.freeParkingPrize) {
    return null;
  }

  const prize = gameState.freeParkingPrize;
  const propData = prize.type === 'property' && prize.propertyId ? getPropertyData(gameState, prize.propertyId) : null;

  const handleAccept = () => {
    onAction({ type: 'FREE_PARKING_EVENT_ACCEPT' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Free Parking Event</h2>
          <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded mb-4">
            {prize.type === 'cash' ? (
              <p className="text-lg">You won <strong>${prize.amount}M</strong>!</p>
            ) : (
              <div>
                <p className="text-lg">You won a property prize!</p>
                <p className="mt-2"><strong>{propData?.name || prize.propertyId}</strong></p>
                <p className="text-sm text-gray-600 mt-2">
                  {propData ? 'This property will be assigned to you for free, or converted to $400M if already owned.' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Accept Prize
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
