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
import { PROPERTIES } from '../data/properties';
import { CHANCE_OUTCOMES, CHANCE_AMOUNTS } from '../data/chanceOutcomes';

export function applyAction(state: GameState, action: GameAction): ActionResult {
  try {
    // Clone state once - reuse the clone for history to avoid double cloning
    const stateClone = cloneState(state);
    const newState = stateClone;
    const currentPlayer = getCurrentPlayer(newState);

    // Add to history before mutation (reuse the clone we already made)
    newState.history.push({
      state: stateClone,
      timestamp: Date.now(),
    });

    let transaction: Transaction | null = null;

    switch (action.type) {
      case 'PASS_GO': {
        currentPlayer.balance += newState.settings.passGoAmount;
        transaction = createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id);
        break;
      }

      case 'ENTER_JAIL': {
        if (currentPlayer.inJail) {
          return { success: false, error: 'Player is already in jail' };
        }
        currentPlayer.inJail = true;
        transaction = createTransaction('ENTER_JAIL', `${currentPlayer.name} entered jail.`, null, currentPlayer.id);
        break;
      }

      case 'LEAVE_JAIL': {
        if (!currentPlayer.inJail) {
          return { success: false, error: 'Player is not in jail' };
        }
        currentPlayer.inJail = false;
        transaction = createTransaction('LEAVE_JAIL', `${currentPlayer.name} left jail.`, null, currentPlayer.id);
        break;
      }

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

      case 'TRAIN_EVENT_TRIGGER': {
        // Start the spinner - don't select a property yet
        // Use empty string to indicate spinner is active (distinct from null/undefined)
        newState.trainEventProperty = '';
        transaction = createTransaction('TRAIN_EVENT', `Train Event: Spinner started`, null, currentPlayer.id);
        break;
      }

      case 'TRAIN_EVENT_STOP': {
        // Stop the spinner and select the property
        newState.trainEventProperty = action.propertyId;
        const propData = getPropertyData(newState, action.propertyId);
        transaction = createTransaction('TRAIN_EVENT', `Train Event: Stopped on ${propData?.name || action.propertyId}`, null, currentPlayer.id);
        break;
      }

      case 'TRAIN_EVENT_BUY': {
        if (!newState.trainEventProperty || newState.trainEventProperty === '') {
          return { success: false, error: 'No train event property selected' };
        }
        // Use the same logic as BUY_PROPERTY
        const existingState = getPropertyState(newState, action.propertyId);
        if (existingState && existingState.ownerId) {
          return { success: false, error: 'Property already owned' };
        }
        if (currentPlayer.balance < action.price) {
          return { success: false, error: 'Insufficient funds' };
        }
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
        transaction = createTransaction('TRAIN_EVENT', `Train Event: Bought ${propData?.name || action.propertyId} for $${action.price}`, -action.price, currentPlayer.id, 'BANK', action.propertyId);
        newState.trainEventProperty = null;
        break;
      }

      case 'TRAIN_EVENT_SKIP': {
        if (!newState.trainEventProperty || newState.trainEventProperty === '') {
          return { success: false, error: 'No train event property selected' };
        }
        const propData = getPropertyData(newState, newState.trainEventProperty);
        transaction = createTransaction('TRAIN_EVENT', `Train Event: Skipped buying ${propData?.name || newState.trainEventProperty}`, null, currentPlayer.id);
        newState.trainEventProperty = null;
        break;
      }

      case 'TRAIN_EVENT_PAY_RENT': {
        if (!newState.trainEventProperty || newState.trainEventProperty === '') {
          return { success: false, error: 'No train event property selected' };
        }
        const propState = getPropertyState(newState, action.propertyId);
        if (!propState || !propState.ownerId) {
          return { success: false, error: 'Property not owned' };
        }
        const owner = newState.players.find(p => p.id === propState.ownerId);
        if (!owner) {
          return { success: false, error: 'Owner not found' };
        }
        if (currentPlayer.balance < action.amount) {
          return { success: false, error: 'Insufficient funds' };
        }
        currentPlayer.balance -= action.amount;
        owner.balance += action.amount;
        const propData = getPropertyData(newState, action.propertyId);
        transaction = createTransaction('TRAIN_EVENT', `Train Event: Paid $${action.amount} rent for ${propData?.name || action.propertyId}`, -action.amount, currentPlayer.id, owner.id, action.propertyId);
        newState.trainEventProperty = null;
        break;
      }

      case 'CHANCE_EVENT_TRIGGER': {
        // Randomly select one of 16 outcomes
        const randomIndex = Math.floor(Math.random() * CHANCE_OUTCOMES.length);
        const selectedOutcome = CHANCE_OUTCOMES[randomIndex];
        newState.chanceEventOutcome = selectedOutcome.id;
        transaction = createTransaction('CHANCE_EVENT', `Chance Event: ${selectedOutcome.name}`, null, currentPlayer.id);
        break;
      }

      case 'CHANCE_EVENT_APPLY': {
        if (!newState.chanceEventOutcome) {
          return { success: false, error: 'No chance event outcome selected' };
        }
        const outcome = CHANCE_OUTCOMES.find(o => o.id === action.outcomeId);
        if (!outcome) {
          return { success: false, error: 'Outcome not found' };
        }

        let amount = action.amount || CHANCE_AMOUNTS[action.outcomeId] || 0;

        switch (outcome.action) {
          case 'receive':
            currentPlayer.balance += amount;
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Received $${amount}`, amount, 'BANK', currentPlayer.id);
            break;

          case 'pay':
            if (currentPlayer.balance < amount) {
              return { success: false, error: 'Insufficient funds' };
            }
            currentPlayer.balance -= amount;
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Paid $${amount}`, -amount, currentPlayer.id, 'BANK');
            break;

          case 'receive_per_player':
            if (!action.playerPayments) {
              return { success: false, error: 'Player payments required' };
            }
            let totalReceived = 0;
            for (const [playerId, payment] of Object.entries(action.playerPayments)) {
              const otherPlayer = newState.players.find(p => p.id === playerId);
              if (otherPlayer && otherPlayer.balance >= payment) {
                otherPlayer.balance -= payment;
                currentPlayer.balance += payment;
                totalReceived += payment;
              }
            }
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Collected $${totalReceived} from other players`, totalReceived, null, currentPlayer.id);
            break;

          case 'pay_per_player':
            if (!action.playerPayments) {
              return { success: false, error: 'Player payments required' };
            }
            let totalPaid = 0;
            for (const [playerId, payment] of Object.entries(action.playerPayments)) {
              const otherPlayer = newState.players.find(p => p.id === playerId);
              if (otherPlayer) {
                if (currentPlayer.balance < payment) {
                  return { success: false, error: 'Insufficient funds' };
                }
                currentPlayer.balance -= payment;
                otherPlayer.balance += payment;
                totalPaid += payment;
              }
            }
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Paid $${totalPaid} to other players`, -totalPaid, currentPlayer.id, null);
            break;

          case 'receive_property_upgrade':
            if (!action.propertyId) {
              return { success: false, error: 'Property selection required' };
            }
            if (!action.playerPayments) {
              return { success: false, error: 'Player payments required' };
            }
            let upgradeTotal = 0;
            for (const [playerId, payment] of Object.entries(action.playerPayments)) {
              const otherPlayer = newState.players.find(p => p.id === playerId);
              if (otherPlayer && otherPlayer.balance >= payment) {
                otherPlayer.balance -= payment;
                currentPlayer.balance += payment;
                upgradeTotal += payment;
              }
            }
            const upgradeProp = getPropertyData(newState, action.propertyId);
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Collected $${upgradeTotal} from other players for ${upgradeProp?.name || action.propertyId}`, upgradeTotal, null, currentPlayer.id, action.propertyId);
            break;

          case 'pay_property_repair':
            if (!action.propertyId) {
              return { success: false, error: 'Property selection required' };
            }
            if (currentPlayer.balance < amount) {
              return { success: false, error: 'Insufficient funds' };
            }
            currentPlayer.balance -= amount;
            const repairProp = getPropertyData(newState, action.propertyId);
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Paid $${amount} for repairs on ${repairProp?.name || action.propertyId}`, -amount, currentPlayer.id, 'BANK', action.propertyId);
            break;

          case 'tax_audit':
            // Calculate 10% of current cash
            amount = Math.floor(currentPlayer.balance * 0.1);
            if (amount <= 0) {
              return { success: false, error: 'No cash to tax' };
            }
            if (currentPlayer.balance < amount) {
              return { success: false, error: 'Insufficient funds' };
            }
            currentPlayer.balance -= amount;
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Paid $${amount} (10% of cash)`, -amount, currentPlayer.id, 'BANK');
            break;

          case 'rent_reimbursement':
            if (!amount || amount <= 0) {
              return { success: false, error: 'Invalid reimbursement amount' };
            }
            currentPlayer.balance += amount;
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Reimbursed $${amount}`, amount, 'BANK', currentPlayer.id);
            break;

          case 'lucky_investment':
            currentPlayer.balance += amount;
            transaction = createTransaction('CHANCE_EVENT', `${outcome.name}: Received $${amount} now (reminder: +$100 at next turn)`, amount, 'BANK', currentPlayer.id);
            break;
        }

        newState.chanceEventOutcome = null;
        break;
      }

      case 'FREE_PARKING_EVENT_TRIGGER': {
        // Generate random number 1-100
        const roll = Math.floor(Math.random() * 100) + 1;
        let prize: { type: 'cash' | 'property'; amount?: number; propertyId?: string };

        if (roll <= 50) {
          // 50% - 200M
          prize = { type: 'cash', amount: 200 };
        } else if (roll <= 70) {
          // 20% - 400M
          prize = { type: 'cash', amount: 400 };
        } else if (roll <= 75) {
          // 5% - 1000M
          prize = { type: 'cash', amount: 1000 };
        } else {
          // 25% - Property prize
          const randomPropIndex = Math.floor(Math.random() * PROPERTIES.length);
          const selectedProperty = PROPERTIES[randomPropIndex];
          prize = { type: 'property', propertyId: selectedProperty.id };
        }

        newState.freeParkingPrize = prize;
        transaction = createTransaction('FREE_PARKING_EVENT', `Free Parking Event: Prize determined`, null, currentPlayer.id);
        break;
      }

      case 'FREE_PARKING_EVENT_ACCEPT': {
        if (!newState.freeParkingPrize) {
          return { success: false, error: 'No free parking prize determined' };
        }

        const prize = newState.freeParkingPrize;

        if (prize.type === 'cash') {
          currentPlayer.balance += prize.amount || 0;
          transaction = createTransaction('FREE_PARKING_EVENT', `Free Parking: Won $${prize.amount}`, prize.amount || 0, 'BANK', currentPlayer.id);
        } else if (prize.type === 'property' && prize.propertyId) {
          const propState = getPropertyState(newState, prize.propertyId);
          if (propState && propState.ownerId) {
            // Property is owned, convert to 400M cash
            currentPlayer.balance += 400;
            transaction = createTransaction('FREE_PARKING_EVENT', `Free Parking: Property prize converted to $400 cash`, 400, 'BANK', currentPlayer.id);
          } else {
            // Property is unowned, give it to player
            if (!newState.propertyStates[prize.propertyId]) {
              newState.propertyStates[prize.propertyId] = {
                propertyId: prize.propertyId,
                ownerId: currentPlayer.id,
                mortgaged: false,
                houses: 0,
                hotel: false,
              };
            } else {
              newState.propertyStates[prize.propertyId].ownerId = currentPlayer.id;
            }
            currentPlayer.ownedPropertyIds.push(prize.propertyId);
            const propData = getPropertyData(newState, prize.propertyId);
            transaction = createTransaction('FREE_PARKING_EVENT', `Free Parking: Won property ${propData?.name || prize.propertyId}`, null, 'BANK', currentPlayer.id, prize.propertyId);
          }
        }

        newState.freeParkingPrize = null;
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

    // Limit transaction log size to prevent memory issues
    if (newState.log.length > 500) {
      newState.log = newState.log.slice(-500);
    }

    // Limit history size (reduce from 100 to 50 to save memory)
    if (newState.history.length > 50) {
      newState.history = newState.history.slice(-50);
    }

    return { success: true, state: newState };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
