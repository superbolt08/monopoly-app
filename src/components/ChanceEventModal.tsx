import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer, getPlayerProperties, getPropertyData } from '../engine/utils';
import { CHANCE_OUTCOMES, CHANCE_AMOUNTS } from '../data/chanceOutcomes';

interface ChanceEventModalProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function ChanceEventModal({ gameState, onClose, onAction }: ChanceEventModalProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [amount, setAmount] = useState<number>(0);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [playerPayments, setPlayerPayments] = useState<Record<string, number>>({});

  if (!gameState.chanceEventOutcome) {
    return null;
  }

  const outcome = CHANCE_OUTCOMES.find(o => o.id === gameState.chanceEventOutcome);
  if (!outcome) return null;

  const defaultAmount = CHANCE_AMOUNTS[outcome.id] || 0;
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id && !p.isBankrupt);
  const currentPlayerProps = getPlayerProperties(gameState, currentPlayer.id);

  const handleApply = () => {
    // Validate required fields
    if (needsPropertySelection && !selectedProperty) {
      alert('Please select a property');
      return;
    }
    if (needsPlayerPayments && Object.keys(playerPayments).length === 0) {
      alert('Please enter amounts for all players');
      return;
    }
    if (outcome.action === 'rent_reimbursement' && amount <= 0) {
      alert('Please enter a valid reimbursement amount');
      return;
    }

    let finalAmount = amount;
    if (outcome.action === 'tax_audit') {
      finalAmount = Math.floor(currentPlayer.balance * 0.1);
    } else if (outcome.action === 'receive' || outcome.action === 'pay' || outcome.action === 'lucky_investment') {
      finalAmount = defaultAmount;
    }

    onAction({
      type: 'CHANCE_EVENT_APPLY',
      outcomeId: outcome.id,
      amount: finalAmount > 0 ? finalAmount : undefined,
      propertyId: selectedProperty || undefined,
      playerPayments: Object.keys(playerPayments).length > 0 ? playerPayments : undefined,
    });
    onClose();
  };

  const needsPropertySelection = outcome.action === 'receive_property_upgrade' || outcome.action === 'pay_property_repair';
  const needsPlayerPayments = outcome.action === 'receive_per_player' || outcome.action === 'pay_per_player' || outcome.action === 'receive_property_upgrade';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Chance Event</h2>
          <div className={`p-4 rounded mb-4 ${outcome.type === 'good' ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <h3 className="font-bold text-lg mb-2">{outcome.name}</h3>
            <p>{outcome.description}</p>
          </div>

          <div className="space-y-4">
            {(outcome.action === 'receive' || outcome.action === 'pay' || outcome.action === 'lucky_investment') && (
              <div>
                <p className="mb-2">Amount: <strong>${defaultAmount}M</strong></p>
              </div>
            )}

            {outcome.action === 'tax_audit' && (
              <div>
                <p className="mb-2">Tax Amount (10% of ${currentPlayer.balance}M): <strong>${Math.floor(currentPlayer.balance * 0.1)}M</strong></p>
                <p className="text-sm text-gray-600">This will be automatically calculated and deducted.</p>
              </div>
            )}

            {outcome.action === 'rent_reimbursement' && (
              <div>
                <label className="block mb-2">Enter reimbursement amount:</label>
                <input
                  type="number"
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            {needsPropertySelection && (
              <div>
                <label className="block mb-2">Select Property:</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select property...</option>
                  {currentPlayerProps.map(prop => {
                    const propData = getPropertyData(gameState, prop.propertyId);
                    return propData ? (
                      <option key={prop.propertyId} value={prop.propertyId}>{propData.name}</option>
                    ) : null;
                  })}
                </select>
              </div>
            )}

            {needsPlayerPayments && (
              <div>
                <label className="block mb-2">Enter amount for each player:</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {otherPlayers.map(player => (
                    <div key={player.id} className="flex items-center gap-2">
                      <span className="w-32">{player.name}:</span>
                      <input
                        type="number"
                        min="0"
                        value={playerPayments[player.id] || ''}
                        onChange={(e) => setPlayerPayments({ ...playerPayments, [player.id]: parseInt(e.target.value) || 0 })}
                        className="flex-1 border rounded px-2 py-1"
                        placeholder={`${defaultAmount}M`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApply}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Apply
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
    </div>
  );
}
