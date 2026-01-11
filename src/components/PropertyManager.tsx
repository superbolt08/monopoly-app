import { useState } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { BOARD_DEFINITION } from '../data/board';
import { getPropertyState, getPropertyData, canBuildHouse, canBuildHotel, calculateRent } from '../engine/utils';
import { getCurrentPlayer } from '../engine/utils';

interface PropertyManagerProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function PropertyManager({ gameState, onClose, onAction }: PropertyManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const currentPlayer = getCurrentPlayer(gameState);

  const properties = BOARD_DEFINITION.spaces
    .filter(s => s.propertyData)
    .map(s => s.propertyData!);

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPropData = selectedProperty ? getPropertyData(selectedProperty) : null;
  const selectedPropState = selectedProperty ? getPropertyState(gameState, selectedProperty) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Property Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Properties</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredProperties.map(prop => {
                  const state = getPropertyState(gameState, prop.id);
                  const owner = state?.ownerId ? gameState.players.find(p => p.id === state.ownerId) : null;
                  return (
                    <div
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop.id)}
                      className={`p-2 rounded border cursor-pointer ${
                        selectedProperty === prop.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="font-semibold text-sm">{prop.name}</div>
                      <div className="text-xs text-gray-600">
                        ${prop.price} | {owner ? owner.name : 'Unowned'}
                        {state?.mortgaged && ' (M)'}
                        {state?.houses > 0 && ` (${state.houses}H)`}
                        {state?.hotel && ' (Hotel)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedPropData && selectedPropState && (
              <div>
                <h3 className="font-semibold mb-2">Details</h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">{selectedPropData.name}</p>
                    <p className="text-sm text-gray-600">Price: ${selectedPropData.price}</p>
                    <p className="text-sm text-gray-600">Owner: {selectedPropState.ownerId ? gameState.players.find(p => p.id === selectedPropState.ownerId)?.name : 'None'}</p>
                    <p className="text-sm text-gray-600">Mortgaged: {selectedPropState.mortgaged ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-gray-600">Houses: {selectedPropState.houses}</p>
                    <p className="text-sm text-gray-600">Hotel: {selectedPropState.hotel ? 'Yes' : 'No'}</p>
                    {selectedPropState.ownerId && (
                      <p className="text-sm text-gray-600">
                        Current Rent: ${calculateRent(gameState, selectedPropData.id, gameState.lastDiceRoll || undefined)}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    {selectedPropState.ownerId === currentPlayer.id && (
                      <>
                        {!selectedPropState.mortgaged && (
                          <>
                            {canBuildHouse(gameState, selectedPropData.id, currentPlayer.id) && (
                              <button
                                onClick={() => {
                                  onAction({ type: 'BUY_HOUSE', propertyId: selectedPropData.id });
                                }}
                                className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Buy House (${selectedPropData.houseCost})
                              </button>
                            )}
                            {selectedPropState.houses > 0 && (
                              <button
                                onClick={() => {
                                  onAction({ type: 'SELL_HOUSE', propertyId: selectedPropData.id });
                                }}
                                className="w-full bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                              >
                                Sell House (${Math.floor(selectedPropData.houseCost / 2)})
                              </button>
                            )}
                            {canBuildHotel(gameState, selectedPropData.id, currentPlayer.id) && (
                              <button
                                onClick={() => {
                                  onAction({ type: 'BUY_HOTEL', propertyId: selectedPropData.id });
                                }}
                                className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Buy Hotel (${selectedPropData.hotelCost})
                              </button>
                            )}
                            {selectedPropState.hotel && (
                              <button
                                onClick={() => {
                                  onAction({ type: 'SELL_HOTEL', propertyId: selectedPropData.id });
                                }}
                                className="w-full bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                              >
                                Sell Hotel (${Math.floor(selectedPropData.hotelCost / 2)})
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onAction({ type: 'MORTGAGE_PROPERTY', propertyId: selectedPropData.id });
                              }}
                              className="w-full bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                            >
                              Mortgage (${selectedPropData.mortgageValue})
                            </button>
                          </>
                        )}
                        {selectedPropState.mortgaged && (
                          <button
                            onClick={() => {
                              onAction({ type: 'UNMORTGAGE_PROPERTY', propertyId: selectedPropData.id });
                            }}
                            className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Unmortgage (${Math.floor(selectedPropData.mortgageValue * (1 + gameState.settings.mortgageInterestRate))})
                          </button>
                        )}
                      </>
                    )}
                    {!selectedPropState.ownerId && currentPlayer.position === BOARD_DEFINITION.spaces.find(s => s.propertyData?.id === selectedPropData.id)?.position && (
                      <button
                        onClick={() => {
                          onAction({ type: 'BUY_PROPERTY', propertyId: selectedPropData.id });
                        }}
                        className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Buy Property (${selectedPropData.price})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
