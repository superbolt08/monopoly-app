import type { GameState, GameAction, ActionResult, Transaction, Player, PropertyState } from '../types';
import {
  generateId,
  getCurrentPlayer,
  getPropertyState,
  getPropertyData,
  getPlayerProperties,
  createTransaction,
  cloneState,
} from './utils';

export function applyAction(state: GameState, action: GameAction): ActionResult {
  try {
    const newState = cloneState(state);
    const currentPlayer = getCurrentPlayer(newState);

    // Add to history before mutation
    newState.history.push({
      state: cloneState(state),
      timestamp: Date.now(),
    });

    let transaction: Transaction | null = null;

    switch (action.type) {
      case 'BUY_PROPERTY': {
        const existingState = getPropertyState(newState, action.propertyId);
        
        if (existingState && existingState.ownerId) {
          return { success: false, error: 'Property already owned' };
        }

        if (currentPlayer.balance < action.price) {
          return { success: false, error: 'Insufficient funds' };
        }

        // Update property data with price
        if (newState.propertyData[action.propertyId]) {
          newState.propertyData[action.propertyId].price = action.price;
          newState.propertyData[action.propertyId].mortgageValue = Math.floor(action.price * 0.5);
        }

        currentPlayer.balance -= action.price;
        currentPlayer.ownedPropertyIds.push(action.propertyId);

        if (!newState.propertyStates[action.propertyId]) {
          newState.propertyStates[action.propertyId] = {
            propertyId: action.propertyId,
            ownerId: currentPlayer.id,
            mortgaged: false,
            houses: 0,
            hotel: false,
          };
        } else {
          newState.propertyStates[action.propertyId].ownerId = currentPlayer.id;
        }

        const propData = getPropertyData(newState, action.propertyId);
        transaction = createTransaction('BUY_PROPERTY', `Bought ${propData?.name || action.propertyId} for $${action.price}.`, -action.price, currentPlayer.id, 'BANK', action.propertyId);
        break;
      }

      case 'COLLECT_RENT': {
        const fromPlayer = newState.players.find(p => p.id === action.fromPlayerId);
        const toPlayer = newState.players.find(p => p.id === action.toPlayerId);

        if (!fromPlayer || !toPlayer) {
          return { success: false, error: 'Player not found' };
        }

        if (fromPlayer.isBankrupt || toPlayer.isBankrupt) {
          return { success: false, error: 'Cannot collect rent from bankrupt player' };
        }

        if (toPlayer.balance < action.amount) {
          return { success: false, error: 'Insufficient funds to pay rent' };
        }

        toPlayer.balance -= action.amount;
        fromPlayer.balance += action.amount;

        const propData = action.propertyId ? getPropertyData(newState, action.propertyId) : null;
        const propertyName = propData ? propData.name : 'property';
        transaction = createTransaction('PAY_RENT', `${toPlayer.name} paid $${action.amount} rent to ${fromPlayer.name}${propData ? ` for ${propertyName}` : ''}.`, -action.amount, action.toPlayerId, action.fromPlayerId, action.propertyId || null);
        break;
      }

      case 'MORTGAGE_PROPERTY': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (propState.mortgaged) {
          return { success: false, error: 'Property already mortgaged' };
        }
        if (propState.houses > 0 || propState.hotel) {
          return { success: false, error: 'Must sell all houses/hotel before mortgaging' };
        }

        const propData = getPropertyData(newState, action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        currentPlayer.balance += propData.mortgageValue;
        propState.mortgaged = true;
        transaction = createTransaction('MORTGAGE_PROPERTY', `Mortgaged ${propData.name} for $${propData.mortgageValue}.`, propData.mortgageValue, 'BANK', currentPlayer.id, action.propertyId);
        break;
      }

      case 'UNMORTGAGE_PROPERTY': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (!propState.mortgaged) {
          return { success: false, error: 'Property not mortgaged' };
        }

        const propData = getPropertyData(newState, action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        const unmortgageCost = Math.floor(propData.mortgageValue * (1 + newState.settings.mortgageInterestRate));
        if (currentPlayer.balance < unmortgageCost) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= unmortgageCost;
        propState.mortgaged = false;
        transaction = createTransaction('UNMORTGAGE_PROPERTY', `Unmortgaged ${propData.name} for $${unmortgageCost}.`, -unmortgageCost, currentPlayer.id, 'BANK', action.propertyId);
        break;
      }

      case 'BUY_HOUSE': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (propState.hotel) {
          return { success: false, error: 'Cannot build house on property with hotel' };
        }
        if (propState.houses >= 4) {
          return { success: false, error: 'Maximum 4 houses allowed' };
        }

        if (currentPlayer.balance < action.cost) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= action.cost;
        propState.houses += 1;
        const propData = getPropertyData(newState, action.propertyId);
        transaction = createTransaction('BUY_HOUSE', `Bought house on ${propData?.name || action.propertyId} for $${action.cost}.`, -action.cost, currentPlayer.id, 'BANK', action.propertyId);
        break;
      }

      case 'SELL_HOUSE': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (propState.houses === 0) {
          return { success: false, error: 'No houses to sell' };
        }

        const propData = getPropertyData(newState, action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        // Need to know original house cost - use a default or store it
        const sellPrice = propData.houseCost > 0 ? Math.floor(propData.houseCost / 2) : 25; // Default to $25 if not set
        currentPlayer.balance += sellPrice;
        propState.houses -= 1;
        transaction = createTransaction('SELL_HOUSE', `Sold house on ${propData.name} for $${sellPrice}.`, sellPrice, 'BANK', currentPlayer.id, action.propertyId);
        break;
      }

      case 'BUY_HOTEL': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (propState.houses !== 4) {
          return { success: false, error: 'Must have 4 houses before building hotel' };
        }
        if (propState.hotel) {
          return { success: false, error: 'Hotel already built' };
        }

        if (currentPlayer.balance < action.cost) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= action.cost;
        propState.houses = 0;
        propState.hotel = true;
        const propData = getPropertyData(newState, action.propertyId);
        transaction = createTransaction('BUY_HOTEL', `Bought hotel on ${propData?.name || action.propertyId} for $${action.cost}.`, -action.cost, currentPlayer.id, 'BANK', action.propertyId);
        break;
      }

      case 'SELL_HOTEL': {
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || propState.ownerId !== currentPlayer.id) {
          return { success: false, error: 'Property not owned by current player' };
        }
        if (!propState.hotel) {
          return { success: false, error: 'No hotel to sell' };
        }

        const propData = getPropertyData(newState, action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        const sellPrice = propData.hotelCost > 0 ? Math.floor(propData.hotelCost / 2) : 50; // Default to $50 if not set
        currentPlayer.balance += sellPrice;
        propState.hotel = false;
        propState.houses = 4;
        transaction = createTransaction('SELL_HOTEL', `Sold hotel on ${propData.name} for $${sellPrice}.`, sellPrice, 'BANK', currentPlayer.id, action.propertyId);
        break;
      }

      case 'TRADE_EXECUTE': {
        const fromPlayer = newState.players.find(p => p.id === action.fromPlayerId);
        const toPlayer = newState.players.find(p => p.id === action.toPlayerId);

        if (!fromPlayer || !toPlayer) {
          return { success: false, error: 'Player not found' };
        }

        if (fromPlayer.isBankrupt || toPlayer.isBankrupt) {
          return { success: false, error: 'Cannot trade with bankrupt player' };
        }

        // Validate properties
        for (const propId of action.propertiesFrom) {
          const propState = getPropertyState(newState, propId);
          if (!propState || propState.ownerId !== fromPlayer.id) {
            return { success: false, error: `Property ${propId} not owned by ${fromPlayer.name}` };
          }
        }

        for (const propId of action.propertiesTo) {
          const propState = getPropertyState(newState, propId);
          if (!propState || propState.ownerId !== toPlayer.id) {
            return { success: false, error: `Property ${propId} not owned by ${toPlayer.name}` };
          }
        }

        // Validate cash
        if (fromPlayer.balance < action.cashFrom) {
          return { success: false, error: `${fromPlayer.name} has insufficient funds` };
        }
        if (toPlayer.balance < action.cashTo) {
          return { success: false, error: `${toPlayer.name} has insufficient funds` };
        }

        // Execute trade
        fromPlayer.balance -= action.cashFrom;
        fromPlayer.balance += action.cashTo;
        toPlayer.balance -= action.cashTo;
        toPlayer.balance += action.cashFrom;

        // Transfer properties
        for (const propId of action.propertiesFrom) {
          const propState = getPropertyState(newState, propId);
          if (propState) {
            propState.ownerId = toPlayer.id;
            fromPlayer.ownedPropertyIds = fromPlayer.ownedPropertyIds.filter(id => id !== propId);
            toPlayer.ownedPropertyIds.push(propId);
          }
        }

        for (const propId of action.propertiesTo) {
          const propState = getPropertyState(newState, propId);
          if (propState) {
            propState.ownerId = fromPlayer.id;
            toPlayer.ownedPropertyIds = toPlayer.ownedPropertyIds.filter(id => id !== propId);
            fromPlayer.ownedPropertyIds.push(propId);
          }
        }

        transaction = createTransaction('TRADE_EXECUTE', `Trade between ${fromPlayer.name} and ${toPlayer.name}`, null, action.fromPlayerId, action.toPlayerId);
        break;
      }

      case 'ADJUST_BALANCE': {
        const player = newState.players.find(p => p.id === action.playerId);
        if (!player) {
          return { success: false, error: 'Player not found' };
        }

        player.balance += action.amount;
        transaction = createTransaction('ADJUST_BALANCE', action.reason, action.amount, action.amount < 0 ? action.playerId : 'BANK', action.amount > 0 ? action.playerId : 'BANK');
        break;
      }

      case 'TRANSFER_CASH': {
        const fromPlayer = newState.players.find(p => p.id === action.fromPlayerId);
        const toPlayer = newState.players.find(p => p.id === action.toPlayerId);

        if (!fromPlayer || !toPlayer) {
          return { success: false, error: 'Player not found' };
        }

        if (fromPlayer.balance < action.amount) {
          return { success: false, error: 'Insufficient funds' };
        }

        fromPlayer.balance -= action.amount;
        toPlayer.balance += action.amount;
        transaction = createTransaction('TRANSFER_CASH', action.reason, action.amount, action.fromPlayerId, action.toPlayerId);
        break;
      }

      case 'DECLARE_BANKRUPTCY': {
        const player = newState.players.find(p => p.id === action.playerId);
        if (!player) {
          return { success: false, error: 'Player not found' };
        }

        player.isBankrupt = true;

        if (action.creditorId === 'BANK') {
          // Return properties to bank
          for (const propId of player.ownedPropertyIds) {
            const propState = getPropertyState(newState, propId);
            if (propState) {
              propState.ownerId = null;
              propState.houses = 0;
              propState.hotel = false;
              propState.mortgaged = false;
            }
          }
          player.ownedPropertyIds = [];
        } else {
          // Transfer to creditor
          const creditor = newState.players.find(p => p.id === action.creditorId);
          if (!creditor) {
            return { success: false, error: 'Creditor not found' };
          }

          creditor.balance += player.balance;
          for (const propId of player.ownedPropertyIds) {
            const propState = getPropertyState(newState, propId);
            if (propState) {
              propState.ownerId = creditor.id;
              creditor.ownedPropertyIds.push(propId);
            }
          }
          player.ownedPropertyIds = [];
          player.balance = 0;
        }

        transaction = createTransaction('DECLARE_BANKRUPTCY', `${player.name} declared bankrupt to ${action.creditorId === 'BANK' ? 'Bank' : 'creditor'}.`, null, action.playerId, action.creditorId);
        break;
      }

      case 'END_TURN': {
        // Move to next player
        do {
          newState.currentTurnIndex = (newState.currentTurnIndex + 1) % newState.players.length;
        } while (newState.players[newState.currentTurnIndex].isBankrupt && newState.players.filter(p => !p.isBankrupt).length > 1);

        // Check if we've completed a full round
        if (newState.currentTurnIndex === 0) {
          newState.turnNumber += 1;
        }

        newState.phase = 'NORMAL';
        transaction = createTransaction('END_TURN', `Turn ended. Next player: ${getCurrentPlayer(newState).name}`, null);
        break;
      }

      case 'MANUAL_OWNERSHIP': {
        const propState = getPropertyState(newState, action.propertyId);
        const propData = getPropertyData(newState, action.propertyId);
        
        if (!propState || !propData) {
          return { success: false, error: 'Property not found' };
        }

        // Remove from old owner
        if (propState.ownerId) {
          const oldOwner = newState.players.find(p => p.id === propState.ownerId);
          if (oldOwner) {
            oldOwner.ownedPropertyIds = oldOwner.ownedPropertyIds.filter(id => id !== action.propertyId);
          }
        }

        // Add to new owner
        propState.ownerId = action.ownerId;
        if (action.ownerId) {
          const newOwner = newState.players.find(p => p.id === action.ownerId);
          if (newOwner) {
            newOwner.ownedPropertyIds.push(action.propertyId);
          }
        }

        transaction = createTransaction('MANUAL_OWNERSHIP', `Manually set ownership of ${propData.name}.`, null, null, null, action.propertyId);
        break;
      }

      case 'UNDO_LAST': {
        if (newState.history.length === 0) {
          return { success: false, error: 'No history to undo' };
        }

        const previousState = newState.history[newState.history.length - 1].state;
        previousState.history = newState.history.slice(0, -1); // Remove the undone state from history
        return { success: true, state: previousState };
      }

      default:
        return { success: false, error: `Unknown action: ${(action as any).type}` };
    }

    if (transaction) {
      newState.log.push(transaction);
    }

    // Limit history size
    if (newState.history.length > 100) {
      newState.history = newState.history.slice(-100);
    }

    return { success: true, state: newState };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
