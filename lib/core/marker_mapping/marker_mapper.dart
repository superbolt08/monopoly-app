import 'package:monopoly_banking/core/marker_mapping/marker_type.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_definition.dart';

/// Pure lookup layer that maps marker IDs to MarkerDefinitions.
/// This layer does NOT mutate state - it only provides mapping information.
class MarkerMapper {
  static MarkerType _getMarkerType(int markerId) {
    if (markerId >= 1000 && markerId <= 1099) {
      return MarkerType.property;
    } else if (markerId >= 2000 && markerId <= 2099) {
      return MarkerType.money;
    } else if (markerId >= 3000 && markerId <= 3099) {
      return MarkerType.chance;
    } else if (markerId >= 4000 && markerId <= 4099) {
      return MarkerType.communityChest;
    } else if (markerId >= 5000 && markerId <= 5099) {
      return MarkerType.action;
    } else if (markerId >= 6000 && markerId <= 6099) {
      return MarkerType.player;
    } else {
      throw ArgumentError('Unknown marker ID range: $markerId');
    }
  }

  /// Maps a marker ID to a MarkerDefinition.
  /// This is a pure function with no side effects.
  static MarkerDefinition? getMarkerDefinition(int markerId) {
    try {
      final type = _getMarkerType(markerId);
      
      // Build payload based on marker type and ID
      final payload = <String, dynamic>{
        'markerId': markerId,
      };

      // Add type-specific payload data
      switch (type) {
        case MarkerType.money:
          // Money markers encode amount in the ID
          // Example: 2001 = $1, 2050 = $50, etc.
          payload['amount'] = markerId - 2000;
          break;
        case MarkerType.property:
          // Property markers encode property ID
          payload['propertyId'] = 'property_${markerId - 1000}';
          break;
        case MarkerType.chance:
          payload['deckType'] = 'chance';
          break;
        case MarkerType.communityChest:
          payload['deckType'] = 'communityChest';
          break;
        case MarkerType.action:
          // Action markers can encode action type
          payload['actionType'] = markerId - 5000;
          break;
        case MarkerType.player:
          payload['playerId'] = 'player_${markerId - 6000}';
          break;
      }

      return MarkerDefinition(
        markerId: markerId,
        type: type,
        payload: payload,
      );
    } catch (e) {
      return null;
    }
  }

  /// Validates that a marker ID is in a known range.
  static bool isValidMarkerId(int markerId) {
    return (markerId >= 1000 && markerId <= 6099) &&
        ((markerId >= 1000 && markerId <= 1099) ||
            (markerId >= 2000 && markerId <= 2099) ||
            (markerId >= 3000 && markerId <= 3099) ||
            (markerId >= 4000 && markerId <= 4099) ||
            (markerId >= 5000 && markerId <= 5099) ||
            (markerId >= 6000 && markerId <= 6099));
  }
}


