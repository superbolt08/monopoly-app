import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../initialState';
import { applyAction } from '../reducer';

describe('Game Engine Reducer', () => {
  it('should give $200 when passing GO', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    const initialBalance = state.players[0].balance;
    state.players[0].position = 35; // Near the end

    const result = applyAction(state, { type: 'ROLL_DICE', dice: [3, 2] }); // Roll 5
    expect(result.success).toBe(true);

    if (result.success && result.state) {
      // Should have passed GO (position 35 + 5 = 40, wraps to 0)
      const passGoTransaction = result.state.log.find(t => t.type === 'PASS_GO');
      expect(passGoTransaction).toBeDefined();
      expect(result.state.players[0].balance).toBe(initialBalance + 200);
    }
  });

  it('should handle buying property correctly', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    const initialBalance = state.players[0].balance;
    state.players[0].position = 1; // Mediterranean Avenue

    const result = applyAction(state, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    expect(result.success).toBe(true);

    if (result.success && result.state) {
      expect(result.state.players[0].balance).toBe(initialBalance - 60);
      expect(result.state.propertyStates['mediterranean'].ownerId).toBe(result.state.players[0].id);
      expect(result.state.players[0].ownedPropertyIds).toContain('mediterranean');
    }
  });

  it('should calculate and pay rent correctly', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Player 1 buys Mediterranean
    let currentState = state;
    currentState.players[0].position = 1;
    let result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    if (result.success && result.state) currentState = result.state;

    // Player 2 lands on it
    currentState.players[1].position = 1;
    const player2InitialBalance = currentState.players[1].balance;
    result = applyAction(currentState, { type: 'PAY_RENT', propertyId: 'mediterranean' });

    expect(result.success).toBe(true);
    if (result.success && result.state) {
      expect(result.state.players[1].balance).toBe(player2InitialBalance - 2); // Rent is $2
      expect(result.state.players[0].balance).toBeGreaterThan(currentState.players[0].balance);
    }
  });

  it('should handle jail mechanics', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    const result = applyAction(state, { type: 'GO_TO_JAIL' });
    expect(result.success).toBe(true);

    if (result.success && result.state) {
      expect(result.state.players[0].inJail).toBe(true);
      expect(result.state.players[0].position).toBe(10);
      expect(result.state.phase).toBe('IN_JAIL_DECISION');
    }
  });

  it('should handle mortgage and unmortgage', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Buy property
    let currentState = state;
    currentState.players[0].position = 1;
    let result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    if (result.success && result.state) currentState = result.state;

    const balanceBeforeMortgage = currentState.players[0].balance;

    // Mortgage it
    result = applyAction(currentState, { type: 'MORTGAGE_PROPERTY', propertyId: 'mediterranean' });
    expect(result.success).toBe(true);
    if (result.success && result.state) {
      currentState = result.state;
      expect(currentState.propertyStates['mediterranean'].mortgaged).toBe(true);
      expect(currentState.players[0].balance).toBe(balanceBeforeMortgage + 30); // Mortgage value
    }

    // Unmortgage it
    const balanceBeforeUnmortgage = currentState.players[0].balance;
    result = applyAction(currentState, { type: 'UNMORTGAGE_PROPERTY', propertyId: 'mediterranean' });
    expect(result.success).toBe(true);
    if (result.success && result.state) {
      expect(result.state.propertyStates['mediterranean'].mortgaged).toBe(false);
      // Should pay mortgage value + 10% interest
      const expectedCost = 30 + Math.floor(30 * 0.1);
      expect(result.state.players[0].balance).toBe(balanceBeforeUnmortgage - expectedCost);
    }
  });

  it('should support undo', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    const initialBalance = state.players[0].balance;

    // Buy property
    let currentState = state;
    currentState.players[0].position = 1;
    let result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    if (result.success && result.state) currentState = result.state;

    expect(currentState.players[0].balance).not.toBe(initialBalance);

    // Undo
    result = applyAction(currentState, { type: 'UNDO_LAST' });
    expect(result.success).toBe(true);
    if (result.success && result.state) {
      expect(result.state.players[0].balance).toBe(initialBalance);
      expect(result.state.propertyStates['mediterranean'].ownerId).toBeNull();
    }
  });
});
