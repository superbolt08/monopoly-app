import type { GameState } from '../types';

const BACKUP_KEY = 'monopoly-game-backups';
const MAX_BACKUPS = 10; // Keep last 10 backups

interface GameBackup {
  state: GameState;
  timestamp: number;
  gameId: string;
}

/**
 * Save a backup of the game state before it gets overwritten
 */
export function saveBackup(gameState: GameState): void {
  try {
    const backups = getBackups();
    
    // Add new backup
    const backup: GameBackup = {
      state: gameState,
      timestamp: Date.now(),
      gameId: gameState.id,
    };
    
    backups.push(backup);
    
    // Keep only the most recent backups
    if (backups.length > MAX_BACKUPS) {
      backups.shift(); // Remove oldest
    }
    
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
  } catch (error) {
    console.error('Failed to save backup:', error);
    // Don't throw - backup failure shouldn't break the game
  }
}

/**
 * Get all backups
 */
export function getBackups(): GameBackup[] {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as GameBackup[];
  } catch (error) {
    console.error('Failed to load backups:', error);
    return [];
  }
}

/**
 * Get the most recent backup
 */
export function getLatestBackup(): GameBackup | null {
  const backups = getBackups();
  if (backups.length === 0) return null;
  return backups[backups.length - 1];
}

/**
 * Get backup by timestamp
 */
export function getBackupByTimestamp(timestamp: number): GameBackup | null {
  const backups = getBackups();
  return backups.find(b => b.timestamp === timestamp) || null;
}

/**
 * Clear all backups
 */
export function clearBackups(): void {
  localStorage.removeItem(BACKUP_KEY);
}
