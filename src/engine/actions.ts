import type { GameState, TransactionType } from '../types';

export type GameAction =
  | { type: 'PASS_GO' }
  | { type: 'ENTER_JAIL' }
  | { type: 'LEAVE_JAIL' }
  | { type: 'BUY_PROPERTY'; propertyId: string; price: number }
  | { type: 'COLLECT_RENT'; fromPlayerId: string; toPlayerId: string; amount: number; propertyId?: string }
  | { type: 'TRADE_EXECUTE'; fromPlayerId: string; toPlayerId: string; cashFrom: number; cashTo: number; propertiesFrom: string[]; propertiesTo: string[] }
  | { type: 'MORTGAGE_PROPERTY'; propertyId: string }
  | { type: 'UNMORTGAGE_PROPERTY'; propertyId: string }
  | { type: 'BUY_HOUSE'; propertyId: string; cost: number }
  | { type: 'SELL_HOUSE'; propertyId: string }
  | { type: 'BUY_HOTEL'; propertyId: string; cost: number }
  | { type: 'SELL_HOTEL'; propertyId: string }
  | { type: 'ADJUST_BALANCE'; playerId: string; amount: number; reason: string }
  | { type: 'TRANSFER_CASH'; fromPlayerId: string; toPlayerId: string; amount: number; reason: string }
  | { type: 'DECLARE_BANKRUPTCY'; playerId: string; creditorId: string | 'BANK' }
  | { type: 'END_TURN' }
  | { type: 'MANUAL_OWNERSHIP'; propertyId: string; ownerId: string | null }
  | { type: 'UNDO_LAST' }
  | { type: 'TRAIN_EVENT_TRIGGER' }
  | { type: 'TRAIN_EVENT_STOP'; propertyId: string }
  | { type: 'TRAIN_EVENT_BUY'; propertyId: string; price: number }
  | { type: 'TRAIN_EVENT_SKIP' }
  | { type: 'TRAIN_EVENT_PAY_RENT'; propertyId: string; amount: number }
  | { type: 'CHANCE_EVENT_TRIGGER' }
  | { type: 'CHANCE_EVENT_APPLY'; outcomeId: string; amount?: number; propertyId?: string; playerPayments?: Record<string, number> }
  | { type: 'FREE_PARKING_EVENT_TRIGGER' }
  | { type: 'FREE_PARKING_EVENT_ACCEPT' };

export interface ActionResult {
  success: boolean;
  error?: string;
  state?: GameState;
}
