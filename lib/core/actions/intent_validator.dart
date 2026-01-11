import 'package:monopoly_banking/core/actions/intent.dart';
import 'package:monopoly_banking/core/actions/intents.dart';
import 'package:monopoly_banking/core/models/game_state.dart';

/// Validates intents before they are applied to game state.
/// Returns validation errors or null if valid.
class IntentValidator {
  /// Validates an intent against the current game state.
  /// Returns a list of error messages, or empty list if valid.
  static List<String> validate(GameState state, Intent intent) {
    final errors = <String>[];

    if (intent is AddMoneyIntent) {
      errors.addAll(_validateAddMoney(state, intent));
    } else if (intent is TransferMoneyIntent) {
      errors.addAll(_validateTransferMoney(state, intent));
    } else if (intent is PropertyPurchaseIntent) {
      errors.addAll(_validatePropertyPurchase(state, intent));
    } else if (intent is DrawCardIntent) {
      errors.addAll(_validateDrawCard(state, intent));
    } else if (intent is PayRentIntent) {
      errors.addAll(_validatePayRent(state, intent));
    }

    return errors;
  }

  static List<String> _validateAddMoney(GameState state, AddMoneyIntent intent) {
    final errors = <String>[];
    final player = state.players.firstWhere(
      (p) => p.id == intent.playerId,
      orElse: () => throw StateError('Player not found'),
    );

    if (intent.amount <= 0) {
      errors.add('Amount must be positive');
    }

    return errors;
  }

  static List<String> _validateTransferMoney(
      GameState state, TransferMoneyIntent intent) {
    final errors = <String>[];

    final sourcePlayer = state.players.firstWhere(
      (p) => p.id == intent.sourcePlayerId,
      orElse: () => throw StateError('Source player not found'),
    );

    final destPlayer = state.players.firstWhere(
      (p) => p.id == intent.destinationPlayerId,
      orElse: () => throw StateError('Destination player not found'),
    );

    if (intent.amount <= 0) {
      errors.add('Amount must be positive');
    }

    if (sourcePlayer.balance < intent.amount) {
      errors.add('Insufficient balance');
    }

    if (intent.sourcePlayerId == intent.destinationPlayerId) {
      errors.add('Cannot transfer to self');
    }

    return errors;
  }

  static List<String> _validatePropertyPurchase(
      GameState state, PropertyPurchaseIntent intent) {
    final errors = <String>[];

    final player = state.players.firstWhere(
      (p) => p.id == intent.playerId,
      orElse: () => throw StateError('Player not found'),
    );

    final property = state.properties.firstWhere(
      (p) => p.id == intent.propertyId,
      orElse: () => throw StateError('Property not found'),
    );

    if (player.balance < intent.price) {
      errors.add('Insufficient balance to purchase property');
    }

    if (property.ownerId != null) {
      errors.add('Property is already owned');
    }

    return errors;
  }

  static List<String> _validateDrawCard(
      GameState state, DrawCardIntent intent) {
    final errors = <String>[];

    final player = state.players.firstWhere(
      (p) => p.id == intent.playerId,
      orElse: () => throw StateError('Player not found'),
    );

    if (intent.deckType != 'chance' && intent.deckType != 'communityChest') {
      errors.add('Invalid deck type');
    }

    final deck = state.decks[intent.deckType];
    if (deck == null || deck.isEmpty) {
      errors.add('Deck is empty');
    }

    return errors;
  }

  static List<String> _validatePayRent(
      GameState state, PayRentIntent intent) {
    final errors = <String>[];

    final payer = state.players.firstWhere(
      (p) => p.id == intent.payerId,
      orElse: () => throw StateError('Payer not found'),
    );

    final owner = state.players.firstWhere(
      (p) => p.id == intent.propertyOwnerId,
      orElse: () => throw StateError('Property owner not found'),
    );

    final property = state.properties.firstWhere(
      (p) => p.id == intent.propertyId,
      orElse: () => throw StateError('Property not found'),
    );

    if (payer.balance < intent.amount) {
      errors.add('Insufficient balance to pay rent');
    }

    if (property.ownerId != intent.propertyOwnerId) {
      errors.add('Property owner mismatch');
    }

    if (intent.payerId == intent.propertyOwnerId) {
      errors.add('Cannot pay rent to yourself');
    }

    return errors;
  }
}


