import type { GameState, Player, PropertyState, BoardSpace, PropertyData, CardEffect } from '../types';
import { BOARD_DEFINITION } from '../data/board';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function isDoubles(dice: [number, number]): boolean {
  return dice[0] === dice[1];
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentTurnIndex];
}

export function getSpaceAtPosition(position: number): BoardSpace {
  return BOARD_DEFINITION.spaces[position];
}

export function getPropertyData(propertyId: string): PropertyData | undefined {
  const space = BOARD_DEFINITION.spaces.find(s => s.propertyData?.id === propertyId);
  return space?.propertyData;
}

export function getPropertyState(state: GameState, propertyId: string): PropertyState | null {
  return state.propertyStates[propertyId] || null;
}

export function getPlayerProperties(state: GameState, playerId: string): PropertyState[] {
  return Object.values(state.propertyStates).filter(p => p.ownerId === playerId);
}

export function calculateRent(
  state: GameState,
  propertyId: string,
  diceRoll?: [number, number]
): number {
  const propertyData = getPropertyData(propertyId);
  const propertyState = getPropertyState(state, propertyId);
  
  if (!propertyData || !propertyState || propertyState.mortgaged) {
    return 0;
  }

  const owner = state.players.find(p => p.id === propertyState.ownerId);
  if (!owner) return 0;

  // Utility rent
  if (propertyData.group === 'utility') {
    const utilityCount = getPlayerProperties(state, owner.id).filter(
      p => getPropertyData(p.propertyId)?.group === 'utility'
    ).length;
    if (diceRoll) {
      const diceSum = diceRoll[0] + diceRoll[1];
      return utilityCount === 1 ? diceSum * 4 : diceSum * 10;
    }
    return 0; // Need dice roll
  }

  // Railroad rent
  if (propertyData.group === 'railroad') {
    const railroadCount = getPlayerProperties(state, owner.id).filter(
      p => getPropertyData(p.propertyId)?.group === 'railroad'
    ).length;
    return [25, 50, 100, 200][railroadCount - 1] || 0;
  }

  // Regular property rent
  if (propertyState.hotel) {
    return propertyData.rentWithHotel;
  }
  if (propertyState.houses > 0) {
    return propertyData.rentWithHouses[propertyState.houses - 1] || propertyData.rent;
  }
  return propertyData.rent;
}

export function hasMonopoly(state: GameState, playerId: string, groupId: string): boolean {
  const group = BOARD_DEFINITION.propertyGroups.find(g => g.id === groupId);
  if (!group) return false;

  const playerProps = getPlayerProperties(state, playerId);
  const ownedInGroup = playerProps.filter(p => {
    const propData = getPropertyData(p.propertyId);
    return propData?.group === groupId;
  });

  return ownedInGroup.length === group.propertyIds.length;
}

export function canBuildHouse(state: GameState, propertyId: string, playerId: string): boolean {
  const propertyData = getPropertyData(propertyId);
  const propertyState = getPropertyState(state, propertyId);
  
  if (!propertyData || !propertyState || propertyState.ownerId !== playerId) {
    return false;
  }

  if (propertyData.group === 'railroad' || propertyData.group === 'utility') {
    return false;
  }

  if (propertyState.hotel) return false;
  if (propertyState.houses >= 4) return false;

  // Check monopoly
  if (!hasMonopoly(state, playerId, propertyData.group)) {
    return false;
  }

  return true;
}

export function canBuildHotel(state: GameState, propertyId: string, playerId: string): boolean {
  const propertyData = getPropertyData(propertyId);
  const propertyState = getPropertyState(state, propertyId);
  
  if (!propertyData || !propertyState || propertyState.ownerId !== playerId) {
    return false;
  }

  if (propertyData.group === 'railroad' || propertyData.group === 'utility') {
    return false;
  }

  if (propertyState.houses !== 4 || propertyState.hotel) {
    return false;
  }

  if (!hasMonopoly(state, playerId, propertyData.group)) {
    return false;
  }

  return true;
}

export function findNearestRailroad(currentPosition: number): number {
  const railroads = [5, 15, 25, 35];
  for (const pos of railroads) {
    if (pos > currentPosition) return pos;
  }
  return 5; // Wrap around
}

export function findNearestUtility(currentPosition: number): number {
  const utilities = [12, 28];
  for (const pos of utilities) {
    if (pos > currentPosition) return pos;
  }
  return 12; // Wrap around
}

export function createTransaction(
  type: string,
  note: string,
  amount: number | null = null,
  fromPlayerId: string | null = null,
  toPlayerId: string | null = null,
  propertyId: string | null = null,
  cardId: string | null = null
) {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    amount,
    fromPlayerId,
    toPlayerId,
    propertyId,
    cardId,
    note,
  };
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}
