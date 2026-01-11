import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/models/player.dart';
import 'package:monopoly_banking/core/models/property.dart';

class PlayerDetailScreen extends StatelessWidget {
  final Player player;
  final GameState gameState;

  const PlayerDetailScreen({
    super.key,
    required this.player,
    required this.gameState,
  });

  List<Property> _getOwnedProperties() {
    return gameState.properties
        .where((p) => player.ownedPropertyIds.contains(p.id))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final ownedProperties = _getOwnedProperties();

    return Scaffold(
      appBar: AppBar(
        title: Text(player.name),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Balance',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '\$${player.balance}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Status',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        player.jailStatus ? Icons.lock : Icons.lock_open,
                        color: player.jailStatus ? Colors.red : Colors.green,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        player.jailStatus ? 'In Jail' : 'Free',
                      ),
                    ],
                  ),
                  if (player.jailFreeCards > 0) ...[
                    const SizedBox(height: 8),
                    Text('Get Out of Jail Free Cards: ${player.jailFreeCards}'),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Owned Properties (${ownedProperties.length})',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (ownedProperties.isEmpty)
                    const Text('No properties owned')
                  else
                    ...ownedProperties.map((property) => ListTile(
                          title: Text(property.name),
                          subtitle: Text(
                            property.mortgaged
                                ? 'Mortgaged'
                                : '${property.houseCount} houses, ${property.hasHotel ? "1 hotel" : "no hotel"}',
                          ),
                          dense: true,
                        )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


