import type { Card } from '../types';

export const CHANCE_CARDS: Card[] = [
  {
    id: 'chance-1',
    deckType: 'CHANCE',
    text: 'Advance to GO. Collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 0 },
  },
  {
    id: 'chance-2',
    deckType: 'CHANCE',
    text: 'Advance to Illinois Avenue. If you pass GO, collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 24 },
  },
  {
    id: 'chance-3',
    deckType: 'CHANCE',
    text: 'Advance to St. Charles Place. If you pass GO, collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 11 },
  },
  {
    id: 'chance-4',
    deckType: 'CHANCE',
    text: 'Advance to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
    effect: { type: 'ADVANCE_TO_RAILROAD' },
  },
  {
    id: 'chance-5',
    deckType: 'CHANCE',
    text: 'Advance to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
    effect: { type: 'ADVANCE_TO_RAILROAD' },
  },
  {
    id: 'chance-6',
    deckType: 'CHANCE',
    text: 'Advance token to nearest Utility. If unowned, you may buy it. If owned, throw dice and pay owner a total 10 times the amount thrown.',
    effect: { type: 'ADVANCE_TO_UTILITY' },
  },
  {
    id: 'chance-7',
    deckType: 'CHANCE',
    text: 'Bank pays you dividend of $50.',
    effect: { type: 'MONEY', amount: 50 },
  },
  {
    id: 'chance-8',
    deckType: 'CHANCE',
    text: 'Get Out of Jail Free. This card may be kept until needed or sold.',
    effect: { type: 'GET_OUT_OF_JAIL' },
  },
  {
    id: 'chance-9',
    deckType: 'CHANCE',
    text: 'Go Back 3 Spaces.',
    effect: { type: 'GO_BACK_3' },
  },
  {
    id: 'chance-10',
    deckType: 'CHANCE',
    text: 'Go to Jail. Go directly to Jail. Do not pass GO, do not collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 10 },
  },
  {
    id: 'chance-11',
    deckType: 'CHANCE',
    text: 'Make general repairs on all your property. For each house pay $25. For each hotel pay $100.',
    effect: { type: 'REPAIRS', perHouse: 25, perHotel: 100 },
  },
  {
    id: 'chance-12',
    deckType: 'CHANCE',
    text: 'Pay poor tax of $15.',
    effect: { type: 'MONEY', amount: -15 },
  },
  {
    id: 'chance-13',
    deckType: 'CHANCE',
    text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 5 },
  },
  {
    id: 'chance-14',
    deckType: 'CHANCE',
    text: 'Take a walk on the Boardwalk. Advance token to Boardwalk.',
    effect: { type: 'MOVE_TO', targetPosition: 39 },
  },
  {
    id: 'chance-15',
    deckType: 'CHANCE',
    text: 'You have been elected Chairman of the Board. Pay each player $50.',
    effect: { type: 'MONEY', amount: -50 }, // Special handling needed for "each player"
  },
  {
    id: 'chance-16',
    deckType: 'CHANCE',
    text: 'Your building loan matures. Collect $150.',
    effect: { type: 'MONEY', amount: 150 },
  },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: 'chest-1',
    deckType: 'COMMUNITY_CHEST',
    text: 'Advance to GO. Collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 0 },
  },
  {
    id: 'chest-2',
    deckType: 'COMMUNITY_CHEST',
    text: 'Bank error in your favor. Collect $200.',
    effect: { type: 'MONEY', amount: 200 },
  },
  {
    id: 'chest-3',
    deckType: 'COMMUNITY_CHEST',
    text: 'Doctor\'s fee. Pay $50.',
    effect: { type: 'MONEY', amount: -50 },
  },
  {
    id: 'chest-4',
    deckType: 'COMMUNITY_CHEST',
    text: 'From sale of stock you get $50.',
    effect: { type: 'MONEY', amount: 50 },
  },
  {
    id: 'chest-5',
    deckType: 'COMMUNITY_CHEST',
    text: 'Get Out of Jail Free. This card may be kept until needed or sold.',
    effect: { type: 'GET_OUT_OF_JAIL' },
  },
  {
    id: 'chest-6',
    deckType: 'COMMUNITY_CHEST',
    text: 'Go to Jail. Go directly to Jail. Do not pass GO, do not collect $200.',
    effect: { type: 'MOVE_TO', targetPosition: 10 },
  },
  {
    id: 'chest-7',
    deckType: 'COMMUNITY_CHEST',
    text: 'Holiday fund matures. Receive $100.',
    effect: { type: 'MONEY', amount: 100 },
  },
  {
    id: 'chest-8',
    deckType: 'COMMUNITY_CHEST',
    text: 'Income tax refund. Collect $20.',
    effect: { type: 'MONEY', amount: 20 },
  },
  {
    id: 'chest-9',
    deckType: 'COMMUNITY_CHEST',
    text: 'It is your birthday. Collect $10 from every player.',
    effect: { type: 'MONEY', amount: 10 }, // Special handling needed
  },
  {
    id: 'chest-10',
    deckType: 'COMMUNITY_CHEST',
    text: 'Life insurance matures. Collect $100.',
    effect: { type: 'MONEY', amount: 100 },
  },
  {
    id: 'chest-11',
    deckType: 'COMMUNITY_CHEST',
    text: 'Pay hospital fees of $100.',
    effect: { type: 'MONEY', amount: -100 },
  },
  {
    id: 'chest-12',
    deckType: 'COMMUNITY_CHEST',
    text: 'Pay school fees of $150.',
    effect: { type: 'MONEY', amount: -150 },
  },
  {
    id: 'chest-13',
    deckType: 'COMMUNITY_CHEST',
    text: 'Receive $25 consultancy fee.',
    effect: { type: 'MONEY', amount: 25 },
  },
  {
    id: 'chest-14',
    deckType: 'COMMUNITY_CHEST',
    text: 'You are assessed for street repairs. $40 per house. $115 per hotel.',
    effect: { type: 'REPAIRS', perHouse: 40, perHotel: 115 },
  },
  {
    id: 'chest-15',
    deckType: 'COMMUNITY_CHEST',
    text: 'You have won second prize in a beauty contest. Collect $10.',
    effect: { type: 'MONEY', amount: 10 },
  },
  {
    id: 'chest-16',
    deckType: 'COMMUNITY_CHEST',
    text: 'You inherit $100.',
    effect: { type: 'MONEY', amount: 100 },
  },
];
