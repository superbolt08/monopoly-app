import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/actions/intent.dart';
import 'package:monopoly_banking/core/actions/intents.dart';
import 'package:monopoly_banking/core/models/game_state.dart';

class ConfirmationDialog extends StatelessWidget {
  final Intent intent;
  final GameState gameState;

  const ConfirmationDialog({
    super.key,
    required this.intent,
    required this.gameState,
  });

  String _getIntentDescription() {
    if (intent is AddMoneyIntent) {
      final addMoney = intent as AddMoneyIntent;
      final player = gameState.players.firstWhere(
        (p) => p.id == addMoney.playerId,
      );
      return 'Add \$${addMoney.amount} to ${player.name}';
    } else if (intent is TransferMoneyIntent) {
      final transfer = intent as TransferMoneyIntent;
      final source = gameState.players.firstWhere(
        (p) => p.id == transfer.sourcePlayerId,
      );
      final dest = gameState.players.firstWhere(
        (p) => p.id == transfer.destinationPlayerId,
      );
      return 'Transfer \$${transfer.amount} from ${source.name} to ${dest.name}';
    } else if (intent is PropertyPurchaseIntent) {
      final purchase = intent as PropertyPurchaseIntent;
      final player = gameState.players.firstWhere(
        (p) => p.id == purchase.playerId,
      );
      final property = gameState.properties.firstWhere(
        (p) => p.id == purchase.propertyId,
      );
      return '${player.name} purchases ${property.name} for \$${purchase.price}';
    } else if (intent is DrawCardIntent) {
      final draw = intent as DrawCardIntent;
      final player = gameState.players.firstWhere(
        (p) => p.id == draw.playerId,
      );
      return '${player.name} draws a ${draw.deckType} card';
    } else if (intent is PayRentIntent) {
      final rent = intent as PayRentIntent;
      final payer = gameState.players.firstWhere(
        (p) => p.id == rent.payerId,
      );
      final owner = gameState.players.firstWhere(
        (p) => p.id == rent.propertyOwnerId,
      );
      return '${payer.name} pays \$${rent.amount} rent to ${owner.name}';
    }
    return 'Confirm action';
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Confirm Action'),
      content: Text(_getIntentDescription()),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Confirm'),
        ),
      ],
    );
  }
}


