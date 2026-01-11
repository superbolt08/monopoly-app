import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/actions/intent.dart';
import 'package:monopoly_banking/core/reducers/game_reducer.dart';
import 'package:monopoly_banking/core/persistence/game_persistence.dart';

/// Manages game state with unidirectional data flow:
/// UI → Intent → Reducer → New State → Persist → UI update
class GameStateManager {
  GameState _currentState;
  final GamePersistence _persistence;

  GameStateManager(this._currentState, this._persistence);

  GameState get currentState => _currentState;

  /// Applies an intent to the current state, persists, and returns new state.
  /// This is the main entry point for state mutations.
  Future<GameState> applyIntent(Intent intent) async {
    // Reduce: compute new state
    final newState = GameReducer.reduce(_currentState, intent);

    // Persist: save new state atomically
    await _persistence.saveGameState(newState);

    // Update current state
    _currentState = newState;

    return newState;
  }

  /// Updates state without persisting (use with caution)
  void updateState(GameState newState) {
    _currentState = newState;
  }
}


