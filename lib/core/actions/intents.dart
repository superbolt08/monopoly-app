import 'package:monopoly_banking/core/actions/intent.dart';

/// Intent to add money to a player's balance
class AddMoneyIntent extends Intent {
  final String playerId;
  final int amount;
  final String? reason;

  const AddMoneyIntent({
    required this.playerId,
    required this.amount,
    this.reason,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'type': 'AddMoneyIntent',
      'playerId': playerId,
      'amount': amount,
      'reason': reason,
    };
  }

  @override
  List<Object?> get props => [playerId, amount, reason];
}

/// Intent to transfer money between players
class TransferMoneyIntent extends Intent {
  final String sourcePlayerId;
  final String destinationPlayerId;
  final int amount;
  final String? reason;

  const TransferMoneyIntent({
    required this.sourcePlayerId,
    required this.destinationPlayerId,
    required this.amount,
    this.reason,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'type': 'TransferMoneyIntent',
      'sourcePlayerId': sourcePlayerId,
      'destinationPlayerId': destinationPlayerId,
      'amount': amount,
      'reason': reason,
    };
  }

  @override
  List<Object?> get props => [sourcePlayerId, destinationPlayerId, amount, reason];
}

/// Intent to purchase a property
class PropertyPurchaseIntent extends Intent {
  final String playerId;
  final String propertyId;
  final int price;

  const PropertyPurchaseIntent({
    required this.playerId,
    required this.propertyId,
    required this.price,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'type': 'PropertyPurchaseIntent',
      'playerId': playerId,
      'propertyId': propertyId,
      'price': price,
    };
  }

  @override
  List<Object?> get props => [playerId, propertyId, price];
}

/// Intent to draw a card from a deck
class DrawCardIntent extends Intent {
  final String playerId;
  final String deckType; // "chance" or "communityChest"

  const DrawCardIntent({
    required this.playerId,
    required this.deckType,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'type': 'DrawCardIntent',
      'playerId': playerId,
      'deckType': deckType,
    };
  }

  @override
  List<Object?> get props => [playerId, deckType];
}

/// Intent to pay rent
class PayRentIntent extends Intent {
  final String payerId;
  final String propertyOwnerId;
  final String propertyId;
  final int amount;

  const PayRentIntent({
    required this.payerId,
    required this.propertyOwnerId,
    required this.propertyId,
    required this.amount,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'type': 'PayRentIntent',
      'payerId': payerId,
      'propertyOwnerId': propertyOwnerId,
      'propertyId': propertyId,
      'amount': amount,
    };
  }

  @override
  List<Object?> get props => [payerId, propertyOwnerId, propertyId, amount];
}


