import 'package:monopoly_banking/core/actions/intent.dart';
import 'package:monopoly_banking/core/actions/intents.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_definition.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_type.dart';
import 'package:monopoly_banking/core/models/game_state.dart';

/// Builds intents from marker definitions.
/// This layer converts scanner output (marker definitions) into actionable intents.
/// Some intents may require additional context (e.g., which player is acting).
class IntentBuilder {
  /// Builds an intent from a marker definition.
  /// Returns null if the marker cannot be converted to an intent.
  /// 
  /// [currentPlayerId] is required for player-specific actions.
  static Intent? buildIntent(
    MarkerDefinition definition,
    GameState state, {
    String? currentPlayerId,
  }) {
    switch (definition.type) {
      case MarkerType.money:
        return _buildMoneyIntent(definition, state, currentPlayerId);
      case MarkerType.property:
        return _buildPropertyIntent(definition, state, currentPlayerId);
      case MarkerType.chance:
      case MarkerType.communityChest:
        return _buildCardIntent(definition, state, currentPlayerId);
      case MarkerType.action:
        return _buildActionIntent(definition, state, currentPlayerId);
      case MarkerType.player:
        // Player markers might be used for selection, not intent creation
        return null;
    }
  }

  static Intent? _buildMoneyIntent(
    MarkerDefinition definition,
    GameState state,
    String? currentPlayerId,
  ) {
    if (currentPlayerId == null) {
      return null;
    }

    final amount = definition.payload['amount'] as int? ?? 0;
    if (amount <= 0) {
      return null;
    }

    return AddMoneyIntent(
      playerId: currentPlayerId,
      amount: amount,
      reason: 'Marker scan: ${definition.markerId}',
    );
  }

  static Intent? _buildPropertyIntent(
    MarkerDefinition definition,
    GameState state,
    String? currentPlayerId,
  ) {
    if (currentPlayerId == null) {
      return null;
    }

    final propertyId = definition.payload['propertyId'] as String?;
    if (propertyId == null) {
      return null;
    }

    // Find the property to get its price
    try {
      final property = state.properties.firstWhere(
        (p) => p.id == propertyId,
      );
      
      // TODO: Get actual property price from property data
      // Property model should include price field
      // For now, use a default price
      const defaultPrice = 100;

      return PropertyPurchaseIntent(
        playerId: currentPlayerId,
        propertyId: propertyId,
        price: defaultPrice,
      );
    } catch (e) {
      // Property not found in state - cannot create intent
      return null;
    }

  }

  static Intent? _buildCardIntent(
    MarkerDefinition definition,
    GameState state,
    String? currentPlayerId,
  ) {
    if (currentPlayerId == null) {
      return null;
    }

    final deckType = definition.payload['deckType'] as String?;
    if (deckType == null) {
      return null;
    }

    return DrawCardIntent(
      playerId: currentPlayerId,
      deckType: deckType,
    );
  }

  static Intent? _buildActionIntent(
    MarkerDefinition definition,
    GameState state,
    String? currentPlayerId,
  ) {
    // TODO: Implement action intents when action types are defined
    return null;
  }
}

