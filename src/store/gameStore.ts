import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GameAction } from '../types';
import { applyAction } from '../engine/reducer';
import type { ActionResult } from '../engine/actions';

interface GameStore {
  gameState: GameState | null;
  error: string | null;
  setGameState: (state: GameState) => void;
  dispatch: (action: GameAction) => Promise<ActionResult>;
  clearError: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      error: null,
      setGameState: (state: GameState) => {
        set({ gameState: state, error: null });
      },
      dispatch: async (action: GameAction) => {
        const { gameState } = get();
        if (!gameState) {
          const error = 'No game state';
          set({ error });
          return { success: false, error };
        }

        const result = applyAction(gameState, action);
        if (result.success && result.state) {
          set({ gameState: result.state, error: null });
        } else {
          set({ error: result.error || 'Unknown error' });
        }
        return result;
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'monopoly-game-storage',
      partialize: (state) => ({ gameState: state.gameState }),
    }
  )
);
