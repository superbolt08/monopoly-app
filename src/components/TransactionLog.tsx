import { useState, useMemo } from 'react';
import type { GameState } from '../types';

interface TransactionLogProps {
  gameState: GameState;
  onUndo: () => void;
}

export default function TransactionLog({ gameState, onUndo }: TransactionLogProps) {
  const [filter, setFilter] = useState<string>('all');
  const [filterPlayer, setFilterPlayer] = useState<string>('all');

  // Memoize filtered log to avoid recalculating on every render
  const filteredLog = useMemo(() => {
    return gameState.log.filter(t => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (filterPlayer !== 'all' && t.fromPlayerId !== filterPlayer && t.toPlayerId !== filterPlayer) return false;
      return true;
    });
  }, [gameState.log, filter, filterPlayer]);

  // Only show last 100 transactions in UI to improve rendering performance
  const displayLog = useMemo(() => {
    return filteredLog.slice().reverse().slice(0, 100);
  }, [filteredLog]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transaction Log</h3>
        <button
          onClick={onUndo}
          disabled={gameState.history.length === 0}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          Undo Last
        </button>
      </div>
      <div className="mb-2 space-y-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Types</option>
          <option value="ROLL_DICE">Roll Dice</option>
          <option value="BUY_PROPERTY">Buy Property</option>
          <option value="PAY_RENT">Pay Rent</option>
          <option value="TRADE_EXECUTE">Trade</option>
          <option value="MORTGAGE_PROPERTY">Mortgage</option>
          <option value="BUY_HOUSE">Buy House</option>
        </select>
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Players</option>
          {gameState.players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-1">
        {displayLog.map((transaction) => {
          // Memoize player lookups
          const fromPlayer = transaction.fromPlayerId ? gameState.players.find(p => p.id === transaction.fromPlayerId) : null;
          const toPlayer = transaction.toPlayerId ? gameState.players.find(p => p.id === transaction.toPlayerId) : null;
          
          return (
            <div key={transaction.id} className="text-xs p-2 bg-gray-50 rounded border">
              <div className="font-semibold">{transaction.note}</div>
              <div className="text-gray-600">
                {transaction.amount !== null && `$${transaction.amount > 0 ? '+' : ''}${transaction.amount}`}
                {fromPlayer && ` From: ${fromPlayer.name}`}
                {toPlayer && ` To: ${toPlayer.name}`}
              </div>
              <div className="text-gray-400 text-xs">
                {new Date(transaction.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        {filteredLog.length > 100 && (
          <div className="text-xs text-gray-500 text-center p-2">
            Showing last 100 of {filteredLog.length} transactions
          </div>
        )}
      </div>
    </div>
  );
}
