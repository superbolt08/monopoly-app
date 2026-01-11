import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../initialState';
import { calculateRent, hasMonopoly, canBuildHouse } from '../utils';
import { applyAction } from '../reducer';

describe('Game Engine Utils', () => {
  it('should calculate rent for property with no houses', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Player 1 buys Mediterranean Avenue
    const buyResult = applyAction(state, {
      type: 'BUY_PROPERTY',
      propertyId: 'mediterranean',
    });
    expect(buyResult.success).toBe(true);

    const newState = buyResult.state!;
    const rent = calculateRent(newState, 'mediterranean');
    expect(rent).toBe(2); // Base rent for Mediterranean Avenue
  });

  it('should calculate rent for railroad based on ownership count', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Player 1 buys all 4 railroads
    const railroads = ['reading-railroad', 'pennsylvania-railroad', 'bno-railroad', 'short-line'];
    let currentState = state;
    
    for (const railroadId of railroads) {
      // Move player to railroad position
      const space = currentState.board.spaces.find(s => s.propertyData?.id === railroadId);
      if (space) {
        currentState.players[0].position = space.position;
        const result = applyAction(currentState, {
          type: 'BUY_PROPERTY',
          propertyId: railroadId,
        });
        if (result.success && result.state) {
          currentState = result.state;
        }
      }
    }

    // With 4 railroads, rent should be 200
    const rent = calculateRent(currentState, 'reading-railroad');
    expect(rent).toBe(200);
  });

  it('should detect monopoly correctly', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Player 1 buys both brown properties
    let currentState = state;
    currentState.players[0].position = 1; // Mediterranean
    let result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    if (result.success && result.state) currentState = result.state;

    currentState.players[0].position = 3; // Baltic
    result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'baltic' });
    if (result.success && result.state) currentState = result.state;

    const hasBrownMonopoly = hasMonopoly(currentState, currentState.players[0].id, 'brown');
    expect(hasBrownMonopoly).toBe(true);
  });

  it('should allow building house only with monopoly', () => {
    const state = createInitialGameState([
      { name: 'Player 1' },
      { name: 'Player 2' },
    ]);

    // Player 1 buys only one brown property
    let currentState = state;
    currentState.players[0].position = 1;
    const result = applyAction(currentState, { type: 'BUY_PROPERTY', propertyId: 'mediterranean' });
    if (result.success && result.state) currentState = result.state;

    const canBuild = canBuildHouse(currentState, 'mediterranean', currentState.players[0].id);
    expect(canBuild).toBe(false); // No monopoly yet
  });
});
