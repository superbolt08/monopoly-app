import type { GameState, Player, PropertyState, PropertyData } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentTurnIndex];
}

export function getPropertyData(state: GameState, propertyId: string): PropertyData | undefined {
  return state.propertyData[propertyId];
}

export function getPropertyState(state: GameState, propertyId: string): PropertyState | null {
  return state.propertyStates[propertyId] || null;
}

export function getPlayerProperties(state: GameState, playerId: string): PropertyState[] {
  return Object.values(state.propertyStates).filter(p => p.ownerId === playerId);
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
