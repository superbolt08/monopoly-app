export type GamePhase = 
  | 'NORMAL' 
  | 'IN_JAIL_DECISION' 
  | 'TRADE' 
  | 'CARD_DRAW' 
  | 'BANKRUPTCY_RESOLUTION';

export type TransactionType =
  | 'ROLL_DICE'
  | 'MOVE_PLAYER'
  | 'PASS_GO'
  | 'BUY_PROPERTY'
  | 'PAY_RENT'
  | 'PAY_TAX'
  | 'DRAW_CARD'
  | 'APPLY_CARD_EFFECT'
  | 'GO_TO_JAIL'
  | 'JAIL_PAY_FINE'
  | 'JAIL_USE_CARD'
  | 'JAIL_ROLL_ATTEMPT'
  | 'TRADE_EXECUTE'
  | 'MORTGAGE_PROPERTY'
  | 'UNMORTGAGE_PROPERTY'
  | 'BUY_HOUSE'
  | 'SELL_HOUSE'
  | 'BUY_HOTEL'
  | 'SELL_HOTEL'
  | 'ADJUST_BALANCE'
  | 'TRANSFER_CASH'
  | 'DECLARE_BANKRUPTCY'
  | 'END_TURN'
  | 'MANUAL_POSITION'
  | 'MANUAL_OWNERSHIP';

export interface GameSettings {
  startingCash: number;
  passGoAmount: number;
  jailFine: number;
  mortgageInterestRate: number; // 0.1 = 10%
  freeParkingPot: boolean;
  enforceEvenBuilding: boolean;
  auctionOnSkip: boolean;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  ownedPropertyIds: string[];
  isBankrupt: boolean;
}

export interface PropertyState {
  propertyId: string;
  ownerId: string | null;
  mortgaged: boolean;
  houses: number; // 0-4
  hotel: boolean;
}

export interface Card {
  id: string;
  deckType: 'CHANCE' | 'COMMUNITY_CHEST';
  text: string;
  effect: CardEffect;
}

export interface CardEffect {
  type: 'MONEY' | 'MOVE' | 'MOVE_TO' | 'GET_OUT_OF_JAIL' | 'REPAIRS' | 'ADVANCE_TO_RAILROAD' | 'ADVANCE_TO_UTILITY' | 'GO_BACK_3';
  amount?: number; // for MONEY, REPAIRS
  targetPosition?: number; // for MOVE_TO
  moveSpaces?: number; // for MOVE
  perHouse?: number; // for REPAIRS
  perHotel?: number; // for REPAIRS
}

export interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  amount: number | null;
  fromPlayerId: string | null;
  toPlayerId: string | null;
  propertyId: string | null;
  cardId: string | null;
  note: string;
  beforeStateHash?: string;
  afterStateHash?: string;
}

export interface GameState {
  id: string;
  settings: GameSettings;
  players: Player[];
  currentTurnIndex: number;
  turnNumber: number;
  phase: GamePhase;
  propertyStates: Record<string, PropertyState>;
  propertyData: Record<string, PropertyData>; // Store property data with prices
  log: Transaction[];
  history: GameStateSnapshot[];
}

export interface GameStateSnapshot {
  state: GameState;
  timestamp: number;
}

export interface BoardDefinition {
  spaces: BoardSpace[];
  propertyGroups: PropertyGroup[];
}

export interface BoardSpace {
  id: string;
  name: string;
  type: 'PROPERTY' | 'RAILROAD' | 'UTILITY' | 'TAX' | 'CHANCE' | 'COMMUNITY_CHEST' | 'GO' | 'JAIL' | 'FREE_PARKING' | 'GO_TO_JAIL';
  position: number;
  propertyData?: PropertyData;
}

export interface PropertyData {
  id: string;
  name: string;
  price: number; // Set when buying
  rent: number; // Not used - rent is manual
  rentWithHouses: number[];
  rentWithHotel: number;
  houseCost: number;
  hotelCost: number;
  group: string;
  mortgageValue: number; // Calculated as 50% of price
}

export interface PropertyGroup {
  id: string;
  name: string;
  color: string;
  propertyIds: string[];
}
