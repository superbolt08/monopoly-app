import type { GameState, Card } from '../types';
import type { GameAction } from '../engine/actions';

interface CardModalProps {
  card: Card;
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function CardModal({ card, gameState, onClose, onAction }: CardModalProps) {
  const handleApply = () => {
    onAction({ type: 'APPLY_CARD_EFFECT', cardId: card.id, accept: true });
    onClose();
  };

  const handleCancel = () => {
    onAction({ type: 'APPLY_CARD_EFFECT', cardId: card.id, accept: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {card.deckType === 'CHANCE' ? 'Chance' : 'Community Chest'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
            <p className="text-lg">{card.text}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Apply
            </button>
            <button
              onClick={handleCancel}
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
