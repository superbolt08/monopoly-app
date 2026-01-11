import 'package:monopoly_banking/core/state/game_state.dart';
import 'package:monopoly_banking/core/actions/intent.dart';
import 'package:monopoly_banking/core/actions/intents.dart';
import 'package:monopoly_banking/core/models/transaction.dart';
import 'package:uuid/uuid.dart';

const _uuid = Uuid();

/// Pure reducer functions that transform GameState based on Intents.
/// These functions do NOT perform I/O - they only compute new state.
class GameReducer {
  /// Main reducer entry point. Routes intents to specific reducers.
  static GameState reduce(GameState currentState, Intent intent) {
    if (intent is AddMoneyIntent) {
      return _reduceAddMoney(currentState, intent);
    } else if (intent is TransferMoneyIntent) {
      return _reduceTransferMoney(currentState, intent);
    } else if (intent is PropertyPurchaseIntent) {
      return _reducePropertyPurchase(currentState, intent);
    } else if (intent is DrawCardIntent) {
      return _reduceDrawCard(currentState, intent);
    } else if (intent is PayRentIntent) {
      return _reducePayRent(currentState, intent);
    } else {
      // Unknown intent - return state unchanged
      return currentState;
    }
  }

  static GameState _reduceAddMoney(GameState state, AddMoneyIntent intent) {
    final players = state.players.map((player) {
      if (player.id == intent.playerId) {
        return player.copyWith(balance: player.balance + intent.amount);
      }
      return player;
    }).toList();

    final transaction = Transaction(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
      type: TransactionType.addMoney,
      destination: intent.playerId,
      amount: intent.amount,
      metadata: {'reason': intent.reason ?? 'Unknown'},
    );

    return state.copyWith(
      players: players,
      transactionLog: [...state.transactionLog, transaction],
    );
  }

  static GameState _reduceTransferMoney(
      GameState state, TransferMoneyIntent intent) {
    final players = state.players.map((player) {
      if (player.id == intent.sourcePlayerId) {
        return player.copyWith(balance: player.balance - intent.amount);
      } else if (player.id == intent.destinationPlayerId) {
        return player.copyWith(balance: player.balance + intent.amount);
      }
      return player;
    }).toList();

    final transaction = Transaction(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
      type: TransactionType.transfer,
      source: intent.sourcePlayerId,
      destination: intent.destinationPlayerId,
      amount: intent.amount,
      metadata: {'reason': intent.reason ?? 'Transfer'},
    );

    return state.copyWith(
      players: players,
      transactionLog: [...state.transactionLog, transaction],
    );
  }

  static GameState _reducePropertyPurchase(
      GameState state, PropertyPurchaseIntent intent) {
    // Update player balance
    final players = state.players.map((player) {
      if (player.id == intent.playerId) {
        return player.copyWith(
          balance: player.balance - intent.price,
          ownedPropertyIds: [...player.ownedPropertyIds, intent.propertyId],
        );
      }
      return player;
    }).toList();

    // Update property ownership
    final properties = state.properties.map((property) {
      if (property.id == intent.propertyId) {
        return property.copyWith(ownerId: intent.playerId);
      }
      return property;
    }).toList();

    final transaction = Transaction(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
      type: TransactionType.propertyPurchase,
      source: intent.playerId,
      amount: intent.price,
      metadata: {'propertyId': intent.propertyId},
    );

    return state.copyWith(
      players: players,
      properties: properties,
      transactionLog: [...state.transactionLog, transaction],
    );
  }

  static GameState _reduceDrawCard(
      GameState state, DrawCardIntent intent) {
    // TODO: Implement card drawing logic when card effects are defined
    // For now, just log the action
    final transaction = Transaction(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
      type: TransactionType.cardEffect,
      destination: intent.playerId,
      metadata: {'deckType': intent.deckType},
    );

    return state.copyWith(
      transactionLog: [...state.transactionLog, transaction],
    );
  }

  static GameState _reducePayRent(GameState state, PayRentIntent intent) {
    // Update payer balance
    final players = state.players.map((player) {
      if (player.id == intent.payerId) {
        return player.copyWith(balance: player.balance - intent.amount);
      } else if (player.id == intent.propertyOwnerId) {
        return player.copyWith(balance: player.balance + intent.amount);
      }
      return player;
    }).toList();

    final transaction = Transaction(
      id: _uuid.v4(),
      timestamp: DateTime.now(),
      type: TransactionType.rent,
      source: intent.payerId,
      destination: intent.propertyOwnerId,
      amount: intent.amount,
      metadata: {'propertyId': intent.propertyId},
    );

    return state.copyWith(
      players: players,
      transactionLog: [...state.transactionLog, transaction],
    );
  }
}


