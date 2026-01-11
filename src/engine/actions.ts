import type { GameState, TransactionType } from '../types';

export type GameAction =
  | { type: 'ROLL_DICE'; dice?: [number, number] }
  | { type: 'MOVE_PLAYER'; spaces: number }
  | { type: 'BUY_PROPERTY'; propertyId: string }
  | { type: 'SKIP_PURCHASE' }
  | { type: 'PAY_RENT'; propertyId: string }
  | { type: 'PAY_TAX'; amount: number }
  | { type: 'DRAW_CARD'; deckType: 'CHANCE' | 'COMMUNITY_CHEST' }
  | { type: 'APPLY_CARD_EFFECT'; cardId: string; accept: boolean }
  | { type: 'GO_TO_JAIL' }
  | { type: 'JAIL_PAY_FINE' }
  | { type: 'JAIL_USE_CARD'; cardType: 'CHANCE' | 'COMMUNITY_CHEST' }
  | { type: 'JAIL_ROLL_ATTEMPT'; dice?: [number, number] }
  | { type: 'TRADE_EXECUTE'; fromPlayerId: string; toPlayerId: string; cashFrom: number; cashTo: number; propertiesFrom: string[]; propertiesTo: string[]; cardsFrom: { type: 'CHANCE' | 'COMMUNITY_CHEST' }[]; cardsTo: { type: 'CHANCE' | 'COMMUNITY_CHEST' }[] }
  | { type: 'MORTGAGE_PROPERTY'; propertyId: string }
  | { type: 'UNMORTGAGE_PROPERTY'; propertyId: string }
  | { type: 'BUY_HOUSE'; propertyId: string }
  | { type: 'SELL_HOUSE'; propertyId: string }
  | { type: 'BUY_HOTEL'; propertyId: string }
  | { type: 'SELL_HOTEL'; propertyId: string }
  | { type: 'ADJUST_BALANCE'; playerId: string; amount: number; reason: string }
  | { type: 'TRANSFER_CASH'; fromPlayerId: string; toPlayerId: string; amount: number; reason: string }
  | { type: 'DECLARE_BANKRUPTCY'; playerId: string; creditorId: string | 'BANK' }
  | { type: 'END_TURN' }
  | { type: 'MANUAL_POSITION'; playerId: string; position: number }
  | { type: 'MANUAL_OWNERSHIP'; propertyId: string; ownerId: string | null }
  | { type: 'UNDO_LAST' };

export interface ActionResult {
  success: boolean;
  error?: string;
  state?: GameState;
}
