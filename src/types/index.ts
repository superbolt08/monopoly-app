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
  position: number; // 0-39
  inJail: boolean;
  jailTurns: number; // 0-3
  getOutOfJailFreeChance: boolean;
  getOutOfJailFreeChest: boolean;
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
  board: BoardDefinition;
  propertyStates: Record<string, PropertyState>;
  chanceDeck: Card[];
  chanceDiscard: Card[];
  chestDeck: Card[];
  chestDiscard: Card[];
  bankCash: number;
  freeParkingPot: number;
  log: Transaction[];
  history: GameStateSnapshot[];
  lastDiceRoll: [number, number] | null;
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
  price: number;
  rent: number;
  rentWithHouses: number[]; // [1 house, 2 houses, 3 houses, 4 houses]
  rentWithHotel: number;
  houseCost: number;
  hotelCost: number;
  group: string;
  mortgageValue: number;
}

export interface PropertyGroup {
  id: string;
  name: string;
  color: string;
  propertyIds: string[];
}
