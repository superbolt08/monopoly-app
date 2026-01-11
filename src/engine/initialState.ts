import type { GameState, GameSettings, Player } from '../types';
import { BOARD_DEFINITION } from '../data/board';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '../data/cards';
import { generateId } from './utils';

export function createDefaultSettings(): GameSettings {
  return {
    startingCash: 1500,
    passGoAmount: 200,
    jailFine: 50,
    mortgageInterestRate: 0.1,
    freeParkingPot: false,
    enforceEvenBuilding: false,
    auctionOnSkip: false,
  };
}

export function createInitialGameState(players: Omit<Player, 'id'>[], settings?: GameSettings): GameState {
  const gameSettings = settings || createDefaultSettings();
  
  const gamePlayers: Player[] = players.map((p, index) => ({
    id: generateId(),
    name: p.name,
    balance: gameSettings.startingCash,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailFreeChance: false,
    getOutOfJailFreeChest: false,
    ownedPropertyIds: [],
    isBankrupt: false,
  }));

  // Initialize property states
  const propertyStates: Record<string, any> = {};
  for (const space of BOARD_DEFINITION.spaces) {
    if (space.propertyData) {
      propertyStates[space.propertyData.id] = {
        propertyId: space.propertyData.id,
        ownerId: null,
        mortgaged: false,
        houses: 0,
        hotel: false,
      };
    }
  }

  // Shuffle decks
  const shuffledChance = [...CHANCE_CARDS].sort(() => Math.random() - 0.5);
  const shuffledChest = [...COMMUNITY_CHEST_CARDS].sort(() => Math.random() - 0.5);

  return {
    id: generateId(),
    settings: gameSettings,
    players: gamePlayers,
    currentTurnIndex: 0,
    turnNumber: 1,
    phase: 'NORMAL',
    board: BOARD_DEFINITION,
    propertyStates,
    chanceDeck: shuffledChance,
    chanceDiscard: [],
    chestDeck: shuffledChest,
    chestDiscard: [],
    bankCash: 0, // Infinite bank
    freeParkingPot: 0,
    log: [],
    history: [],
    lastDiceRoll: null,
  };
}
