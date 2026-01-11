import { useState, useEffect, useRef } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/actions';
import { getCurrentPlayer, getPropertyState, getPropertyData } from '../engine/utils';
import { PROPERTIES } from '../data/properties';

interface TrainEventModalProps {
  gameState: GameState;
  onClose: () => void;
  onAction: (action: GameAction) => void;
}

export default function TrainEventModal({ gameState, onClose, onAction }: TrainEventModalProps) {
  const currentPlayer = getCurrentPlayer(gameState);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef<number>(30);

  // Start spinner immediately when trainEventProperty is empty string (spinner active marker)
  useEffect(() => {
    if (gameState.trainEventProperty === '' && !hasStarted && !selectedPropertyId) {
      setHasStarted(true);
      setIsSpinning(true);
      setCurrentIndex(Math.floor(Math.random() * PROPERTIES.length));
      // Start spinner after a tiny delay to ensure state is set
      const timer = setTimeout(() => {
        startSpinner();
      }, 10);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.trainEventProperty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  const startSpinner = () => {
    speedRef.current = 80; // Start at 80ms per property (slower)
    
    const spin = () => {
      setCurrentIndex((prev) => {
        return (prev + 1) % PROPERTIES.length;
      });
      
      // Gradually slow down the spinner (increase interval)
      if (speedRef.current < 300) {
        speedRef.current += 2; // Increase by 2ms each time for smoother slowdown
      }
      
      // Schedule next spin with new speed
      intervalRef.current = setTimeout(spin, speedRef.current);
    };
    
    // Start the spinner
    intervalRef.current = setTimeout(spin, speedRef.current);
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSpinning(false);
    const propertyId = PROPERTIES[currentIndex].id;
    setSelectedPropertyId(propertyId);
    onAction({ type: 'TRAIN_EVENT_STOP', propertyId });
  };

  // If property is already selected (from reducer), show the action UI
  // Empty string means spinner is active, any other string is a property ID
  const propertyId = gameState.trainEventProperty && gameState.trainEventProperty !== '' ? gameState.trainEventProperty : selectedPropertyId;
  
  // Show spinner if trainEventProperty is empty string (spinner active marker) or if we're actively spinning
  const shouldShowSpinner = gameState.trainEventProperty === '' || (isSpinning && !propertyId);
  
  // Don't render if no property selected and spinner not active
  if (!propertyId && !shouldShowSpinner) {
    return null;
  }
  
  // Show spinner - render immediately if trainEventProperty is empty string
  if (shouldShowSpinner) {
    // Ensure we have a valid index
    const displayIndex = currentIndex >= 0 && currentIndex < PROPERTIES.length ? currentIndex : 0;
    const currentProperty = PROPERTIES[displayIndex];
    const prevIndex = (displayIndex - 1 + PROPERTIES.length) % PROPERTIES.length;
    const nextIndex = (displayIndex + 1) % PROPERTIES.length;
    const prevProperty = PROPERTIES[prevIndex];
    const nextProperty = PROPERTIES[nextIndex];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Train Event</h2>
            <p className="text-center mb-6 text-gray-600">Click Stop when you want to select a property!</p>
            
            {/* Spinner Display */}
            <div className="relative h-48 mb-6 overflow-hidden border-4 border-purple-500 rounded-lg bg-gradient-to-b from-purple-50 to-white">
              {/* Previous property (fading out) */}
              <div className="absolute top-2 left-0 right-0 text-center opacity-30 transform scale-90 transition-all duration-75">
                <div className="text-sm font-semibold text-gray-500">{prevProperty.name}</div>
              </div>
              
              {/* Current property (highlighted) */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 text-center transition-all duration-75">
                <div className="text-2xl font-bold text-purple-700 bg-purple-100 py-4 px-6 rounded-lg border-4 border-purple-500 shadow-lg animate-pulse">
                  {currentProperty.name}
                </div>
              </div>
              
              {/* Next property (fading in) */}
              <div className="absolute bottom-2 left-0 right-0 text-center opacity-30 transform scale-90 transition-all duration-75">
                <div className="text-sm font-semibold text-gray-500">{nextProperty.name}</div>
              </div>
            </div>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              className="w-full bg-red-600 text-white text-xl font-bold py-4 px-6 rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
            >
              STOP!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show action UI after property is selected
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
