import type { GameState, GameAction, ActionResult, Transaction, Player, PropertyState } from '../types';
import { BOARD_DEFINITION } from '../data/board';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '../data/cards';
import {
  generateId,
  rollDice,
  isDoubles,
  getCurrentPlayer,
  getSpaceAtPosition,
  getPropertyData,
  getPropertyState,
  getPlayerProperties,
  calculateRent,
  hasMonopoly,
  canBuildHouse,
  canBuildHotel,
  findNearestRailroad,
  findNearestUtility,
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
      case 'ROLL_DICE': {
        if (newState.phase !== 'NORMAL' && newState.phase !== 'IN_JAIL_DECISION') {
          return { success: false, error: 'Cannot roll dice in current phase' };
        }

        const dice = action.dice || rollDice();
        newState.lastDiceRoll = dice;

        if (currentPlayer.inJail) {
          // Jail roll attempt
          if (isDoubles(dice)) {
            currentPlayer.inJail = false;
            currentPlayer.jailTurns = 0;
            currentPlayer.position = 10; // Just Visiting
            newState.phase = 'NORMAL';
            transaction = createTransaction('JAIL_ROLL_ATTEMPT', `Rolled doubles (${dice[0]}, ${dice[1]}). Released from jail.`);
          } else {
            currentPlayer.jailTurns += 1;
            if (currentPlayer.jailTurns >= 3) {
              // Must pay fine
              if (currentPlayer.balance >= newState.settings.jailFine) {
                currentPlayer.balance -= newState.settings.jailFine;
                currentPlayer.inJail = false;
                currentPlayer.jailTurns = 0;
                currentPlayer.position = 10;
                newState.phase = 'NORMAL';
                transaction = createTransaction('JAIL_ROLL_ATTEMPT', `Failed 3rd attempt. Paid $${newState.settings.jailFine} fine.`, -newState.settings.jailFine, currentPlayer.id, 'BANK');
              } else {
                return { success: false, error: 'Insufficient funds to pay jail fine' };
              }
            } else {
              transaction = createTransaction('JAIL_ROLL_ATTEMPT', `Rolled ${dice[0]}, ${dice[1]}. Still in jail (${currentPlayer.jailTurns}/3).`);
            }
          }
        } else {
          // Normal roll
          const spaces = dice[0] + dice[1];
          const oldPosition = currentPlayer.position;
          currentPlayer.position = (currentPlayer.position + spaces) % 40;

          // Check if passed GO
          if (currentPlayer.position < oldPosition) {
            currentPlayer.balance += newState.settings.passGoAmount;
            newState.log.push(createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id));
          }

          transaction = createTransaction('ROLL_DICE', `Rolled ${dice[0]}, ${dice[1]}. Moved ${spaces} spaces.`, null, currentPlayer.id);
          
          // Handle landing
          const space = getSpaceAtPosition(currentPlayer.position);
          if (space.type === 'GO_TO_JAIL') {
            currentPlayer.position = 10;
            currentPlayer.inJail = true;
            currentPlayer.jailTurns = 0;
            newState.phase = 'IN_JAIL_DECISION';
            newState.log.push(createTransaction('GO_TO_JAIL', 'Landed on Go To Jail.', null, currentPlayer.id));
          } else if (space.type === 'CHANCE' || space.type === 'COMMUNITY_CHEST') {
            newState.phase = 'CARD_DRAW';
          } else if (space.type === 'TAX') {
            const taxAmount = space.name === 'Income Tax' ? 200 : 100;
            newState.phase = 'NORMAL';
            // Will be handled by PAY_TAX action
          } else if (space.type === 'PROPERTY' || space.type === 'RAILROAD' || space.type === 'UTILITY') {
            const propState = getPropertyState(newState, space.propertyData!.id);
            if (propState && propState.ownerId && propState.ownerId !== currentPlayer.id && !propState.mortgaged) {
              // Need to pay rent
              newState.phase = 'NORMAL';
              // Will be handled by PAY_RENT action
            } else if (!propState || !propState.ownerId) {
              // Can buy
              newState.phase = 'NORMAL';
            } else {
              newState.phase = 'NORMAL';
            }
          } else {
            newState.phase = 'NORMAL';
          }
        }

        break;
      }

      case 'MOVE_PLAYER': {
        const oldPosition = currentPlayer.position;
        currentPlayer.position = (currentPlayer.position + action.spaces) % 40;
        
        if (currentPlayer.position < oldPosition) {
          currentPlayer.balance += newState.settings.passGoAmount;
          newState.log.push(createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id));
        }

        transaction = createTransaction('MOVE_PLAYER', `Moved ${action.spaces} spaces.`, null, currentPlayer.id);
        break;
      }

      case 'BUY_PROPERTY': {
        const space = getSpaceAtPosition(currentPlayer.position);
        if (!space.propertyData) {
          return { success: false, error: 'Current space is not a property' };
        }

        const propertyId = space.propertyData.id;
        const existingState = getPropertyState(newState, propertyId);
        
        if (existingState && existingState.ownerId) {
          return { success: false, error: 'Property already owned' };
        }

        if (currentPlayer.balance < space.propertyData.price) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= space.propertyData.price;
        currentPlayer.ownedPropertyIds.push(propertyId);

        if (!newState.propertyStates[propertyId]) {
          newState.propertyStates[propertyId] = {
            propertyId,
            ownerId: currentPlayer.id,
            mortgaged: false,
            houses: 0,
            hotel: false,
          };
        } else {
          newState.propertyStates[propertyId].ownerId = currentPlayer.id;
        }

        transaction = createTransaction('BUY_PROPERTY', `Bought ${space.propertyData.name} for $${space.propertyData.price}.`, -space.propertyData.price, currentPlayer.id, 'BANK', propertyId);
        newState.phase = 'NORMAL';
        break;
      }

      case 'SKIP_PURCHASE': {
        newState.phase = 'NORMAL';
        break;
      }

      case 'PAY_RENT': {
        const space = getSpaceAtPosition(currentPlayer.position);
        if (!space.propertyData) {
          return { success: false, error: 'Current space is not a property' };
        }

        const propertyId = space.propertyData.id;
        const propState = getPropertyState(newState, propertyId);
        
        if (!propState || !propState.ownerId || propState.ownerId === currentPlayer.id || propState.mortgaged) {
          return { success: false, error: 'No rent to pay' };
        }

        const rent = calculateRent(newState, propertyId, newState.lastDiceRoll || undefined);
        if (rent === 0 && (space.type === 'UTILITY' || space.type === 'RAILROAD')) {
          return { success: false, error: 'Need dice roll to calculate rent' };
        }

        if (currentPlayer.balance < rent) {
          return { success: false, error: 'Insufficient funds to pay rent' };
        }

        const owner = newState.players.find(p => p.id === propState.ownerId);
        if (!owner) {
          return { success: false, error: 'Owner not found' };
        }

        currentPlayer.balance -= rent;
        owner.balance += rent;

        transaction = createTransaction('PAY_RENT', `Paid $${rent} rent for ${space.propertyData.name}.`, -rent, currentPlayer.id, owner.id, propertyId);
        newState.phase = 'NORMAL';
        break;
      }

      case 'PAY_TAX': {
        if (currentPlayer.balance < action.amount) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= action.amount;
        if (newState.settings.freeParkingPot) {
          newState.freeParkingPot += action.amount;
        }

        transaction = createTransaction('PAY_TAX', `Paid $${action.amount} tax.`, -action.amount, currentPlayer.id, 'BANK');
        newState.phase = 'NORMAL';
        break;
      }

      case 'DRAW_CARD': {
        const deck = action.deckType === 'CHANCE' ? newState.chanceDeck : newState.chestDeck;
        const discard = action.deckType === 'CHANCE' ? newState.chanceDiscard : newState.chestDiscard;

        if (deck.length === 0) {
          // Reshuffle
          const allCards = action.deckType === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
          if (discard.length === 0) {
            return { success: false, error: 'No cards available' };
          }
          const shuffled = [...discard].sort(() => Math.random() - 0.5);
          if (action.deckType === 'CHANCE') {
            newState.chanceDeck = shuffled;
            newState.chanceDiscard = [];
          } else {
            newState.chestDeck = shuffled;
            newState.chestDiscard = [];
          }
        }

        const currentDeck = action.deckType === 'CHANCE' ? newState.chanceDeck : newState.chestDeck;
        const currentDiscard = action.deckType === 'CHANCE' ? newState.chanceDiscard : newState.chestDiscard;
        
        const card = currentDeck.shift()!;
        currentDiscard.push(card);

        transaction = createTransaction('DRAW_CARD', `Drew card: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        newState.phase = 'CARD_DRAW';
        break;
      }

      case 'APPLY_CARD_EFFECT': {
        const card = [...newState.chanceDeck, ...newState.chanceDiscard, ...newState.chestDeck, ...newState.chestDiscard].find(c => c.id === action.cardId);
        if (!card) {
          return { success: false, error: 'Card not found' };
        }

        if (!action.accept) {
          newState.phase = 'NORMAL';
          (newState as any).drawnCard = null;
          return { success: true, state: newState };
        }

        const effect = card.effect;
        let effectTransaction: Transaction | null = null;

        if (effect.type === 'MONEY') {
          currentPlayer.balance += effect.amount || 0;
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, effect.amount || 0, effect.amount && effect.amount < 0 ? currentPlayer.id : 'BANK', effect.amount && effect.amount > 0 ? currentPlayer.id : 'BANK', null, card.id);
        } else if (effect.type === 'MOVE_TO') {
          const oldPosition = currentPlayer.position;
          currentPlayer.position = effect.targetPosition!;
          if (currentPlayer.position < oldPosition && effect.targetPosition !== 0) {
            currentPlayer.balance += newState.settings.passGoAmount;
            newState.log.push(createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id));
          }
          if (effect.targetPosition === 10) {
            currentPlayer.inJail = true;
            currentPlayer.jailTurns = 0;
            newState.phase = 'IN_JAIL_DECISION';
          }
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        } else if (effect.type === 'GET_OUT_OF_JAIL') {
          if (card.deckType === 'CHANCE') {
            currentPlayer.getOutOfJailFreeChance = true;
          } else {
            currentPlayer.getOutOfJailFreeChest = true;
          }
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        } else if (effect.type === 'ADVANCE_TO_RAILROAD') {
          const targetPos = findNearestRailroad(currentPlayer.position);
          const oldPosition = currentPlayer.position;
          currentPlayer.position = targetPos;
          if (currentPlayer.position < oldPosition) {
            currentPlayer.balance += newState.settings.passGoAmount;
            newState.log.push(createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id));
          }
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        } else if (effect.type === 'ADVANCE_TO_UTILITY') {
          const targetPos = findNearestUtility(currentPlayer.position);
          const oldPosition = currentPlayer.position;
          currentPlayer.position = targetPos;
          if (currentPlayer.position < oldPosition) {
            currentPlayer.balance += newState.settings.passGoAmount;
            newState.log.push(createTransaction('PASS_GO', `Passed GO. Collected $${newState.settings.passGoAmount}.`, newState.settings.passGoAmount, 'BANK', currentPlayer.id));
          }
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        } else if (effect.type === 'GO_BACK_3') {
          currentPlayer.position = (currentPlayer.position - 3 + 40) % 40;
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}`, null, currentPlayer.id, null, null, card.id);
        } else if (effect.type === 'REPAIRS') {
          const playerProps = getPlayerProperties(newState, currentPlayer.id);
          let totalCost = 0;
          for (const prop of playerProps) {
            if (prop.hotel) {
              totalCost += effect.perHotel || 0;
            } else {
              totalCost += (effect.perHouse || 0) * prop.houses;
            }
          }
          if (currentPlayer.balance < totalCost) {
            return { success: false, error: 'Insufficient funds for repairs' };
          }
          currentPlayer.balance -= totalCost;
          effectTransaction = createTransaction('APPLY_CARD_EFFECT', `Card effect: ${card.text}. Paid $${totalCost}.`, -totalCost, currentPlayer.id, 'BANK', null, card.id);
        }

        if (effectTransaction) {
          newState.log.push(effectTransaction);
        }
        newState.phase = 'NORMAL';
        break;
      }

      case 'GO_TO_JAIL': {
        currentPlayer.position = 10;
        currentPlayer.inJail = true;
        currentPlayer.jailTurns = 0;
        newState.phase = 'IN_JAIL_DECISION';
        transaction = createTransaction('GO_TO_JAIL', 'Sent to jail.', null, currentPlayer.id);
        break;
      }

      case 'JAIL_PAY_FINE': {
        if (!currentPlayer.inJail) {
          return { success: false, error: 'Not in jail' };
        }
        if (currentPlayer.balance < newState.settings.jailFine) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= newState.settings.jailFine;
        currentPlayer.inJail = false;
        currentPlayer.jailTurns = 0;
        currentPlayer.position = 10;
        newState.phase = 'NORMAL';
        transaction = createTransaction('JAIL_PAY_FINE', `Paid $${newState.settings.jailFine} to leave jail.`, -newState.settings.jailFine, currentPlayer.id, 'BANK');
        break;
      }

      case 'JAIL_USE_CARD': {
        if (!currentPlayer.inJail) {
          return { success: false, error: 'Not in jail' };
        }

        if (action.cardType === 'CHANCE' && !currentPlayer.getOutOfJailFreeChance) {
          return { success: false, error: 'No Get Out of Jail Free (Chance) card' };
        }
        if (action.cardType === 'COMMUNITY_CHEST' && !currentPlayer.getOutOfJailFreeChest) {
          return { success: false, error: 'No Get Out of Jail Free (Community Chest) card' };
        }

        if (action.cardType === 'CHANCE') {
          currentPlayer.getOutOfJailFreeChance = false;
        } else {
          currentPlayer.getOutOfJailFreeChest = false;
        }

        currentPlayer.inJail = false;
        currentPlayer.jailTurns = 0;
        currentPlayer.position = 10;
        newState.phase = 'NORMAL';
        transaction = createTransaction('JAIL_USE_CARD', `Used Get Out of Jail Free (${action.cardType === 'CHANCE' ? 'Chance' : 'Community Chest'}) card.`, null, currentPlayer.id);
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

        const propData = getPropertyData(action.propertyId);
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

        const propData = getPropertyData(action.propertyId);
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
        if (!canBuildHouse(newState, action.propertyId, currentPlayer.id)) {
          return { success: false, error: 'Cannot build house on this property' };
        }

        const propData = getPropertyData(action.propertyId);
        const propState = getPropertyState(newState, action.propertyId);
        
        if (!propData || !propState) {
          return { success: false, error: 'Property not found' };
        }

        if (currentPlayer.balance < propData.houseCost) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= propData.houseCost;
        propState.houses += 1;
        transaction = createTransaction('BUY_HOUSE', `Bought house on ${propData.name} for $${propData.houseCost}.`, -propData.houseCost, currentPlayer.id, 'BANK', action.propertyId);
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

        const propData = getPropertyData(action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        const sellPrice = Math.floor(propData.houseCost / 2);
        currentPlayer.balance += sellPrice;
        propState.houses -= 1;
        transaction = createTransaction('SELL_HOUSE', `Sold house on ${propData.name} for $${sellPrice}.`, sellPrice, 'BANK', currentPlayer.id, action.propertyId);
        break;
      }

      case 'BUY_HOTEL': {
        if (!canBuildHotel(newState, action.propertyId, currentPlayer.id)) {
          return { success: false, error: 'Cannot build hotel on this property' };
        }

        const propData = getPropertyData(action.propertyId);
        const propState = getPropertyState(newState, action.propertyId);
        
        if (!propData || !propState) {
          return { success: false, error: 'Property not found' };
        }

        if (currentPlayer.balance < propData.hotelCost) {
          return { success: false, error: 'Insufficient funds' };
        }

        currentPlayer.balance -= propData.hotelCost;
        propState.houses = 0;
        propState.hotel = true;
        transaction = createTransaction('BUY_HOTEL', `Bought hotel on ${propData.name} for $${propData.hotelCost}.`, -propData.hotelCost, currentPlayer.id, 'BANK', action.propertyId);
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

        const propData = getPropertyData(action.propertyId);
        if (!propData) {
          return { success: false, error: 'Property data not found' };
        }

        const sellPrice = Math.floor(propData.hotelCost / 2);
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

        // Transfer cards
        for (const card of action.cardsFrom) {
          if (card.type === 'CHANCE') {
            fromPlayer.getOutOfJailFreeChance = false;
            toPlayer.getOutOfJailFreeChance = true;
          } else {
            fromPlayer.getOutOfJailFreeChest = false;
            toPlayer.getOutOfJailFreeChest = true;
          }
        }

        for (const card of action.cardsTo) {
          if (card.type === 'CHANCE') {
            toPlayer.getOutOfJailFreeChance = false;
            fromPlayer.getOutOfJailFreeChance = true;
          } else {
            toPlayer.getOutOfJailFreeChest = false;
            fromPlayer.getOutOfJailFreeChest = true;
          }
        }

        transaction = createTransaction('TRADE_EXECUTE', `Trade between ${fromPlayer.name} and ${toPlayer.name}`, null, action.fromPlayerId, action.toPlayerId);
        newState.phase = 'NORMAL';
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
        newState.lastDiceRoll = null;
        transaction = createTransaction('END_TURN', `Turn ended. Next player: ${getCurrentPlayer(newState).name}`, null);
        break;
      }

      case 'MANUAL_POSITION': {
        const player = newState.players.find(p => p.id === action.playerId);
        if (!player) {
          return { success: false, error: 'Player not found' };
        }

        player.position = action.position;
        transaction = createTransaction('MANUAL_POSITION', `Manually set ${player.name} position to ${action.position}.`, null, action.playerId);
        break;
      }

      case 'MANUAL_OWNERSHIP': {
        const propState = getPropertyState(newState, action.propertyId);
        const propData = getPropertyData(action.propertyId);
        
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
