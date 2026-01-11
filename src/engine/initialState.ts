import type { GameState, GameSettings, Player, PropertyData } from '../types';
import { PROPERTIES } from '../data/properties';
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
  
  const gamePlayers: Player[] = players.map((p) => ({
    id: generateId(),
    name: p.name,
    balance: gameSettings.startingCash,
    ownedPropertyIds: [],
    isBankrupt: false,
  }));

  // Initialize property states (all unowned)
  const propertyStates: Record<string, any> = {};
  const propertyData: Record<string, PropertyData> = {};
  
  for (const prop of PROPERTIES) {
    propertyStates[prop.id] = {
      propertyId: prop.id,
      ownerId: null,
      mortgaged: false,
      houses: 0,
      hotel: false,
    };
    propertyData[prop.id] = { ...prop };
  }

  return {
    id: generateId(),
    settings: gameSettings,
    players: gamePlayers,
    currentTurnIndex: 0,
    turnNumber: 1,
    phase: 'NORMAL',
    propertyStates,
    propertyData,
    log: [],
    history: [],
  };
}
