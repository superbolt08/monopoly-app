import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/models/player.dart';
import 'package:monopoly_banking/core/persistence/game_persistence.dart';
import 'package:monopoly_banking/ui/screens/dashboard_screen.dart';

const _uuid = Uuid();

class GameSetupScreen extends StatefulWidget {
  const GameSetupScreen({super.key});

  @override
  State<GameSetupScreen> createState() => _GameSetupScreenState();
}

class _GameSetupScreenState extends State<GameSetupScreen> {
  final List<TextEditingController> _playerControllers = [];
  final List<Player> _players = [];

  @override
  void initState() {
    super.initState();
    // Start with 2 empty player fields
    _addPlayerField();
    _addPlayerField();
  }

  void _addPlayerField() {
    setState(() {
      _playerControllers.add(TextEditingController());
    });
  }

  void _removePlayerField(int index) {
    setState(() {
      _playerControllers.removeAt(index);
    });
  }

  Future<void> _startGame() async {
    // Collect players
    _players.clear();
    for (int i = 0; i < _playerControllers.length; i++) {
      final name = _playerControllers[i].text.trim();
      if (name.isNotEmpty) {
        _players.add(Player(
          id: _uuid.v4(),
          name: name,
          balance: 1500, // Starting balance
        ));
      }
    }

    if (_players.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('At least 2 players are required')),
      );
      return;
    }

    // Create initial game state
    final gameState = GameState(
      gameId: _uuid.v4(),
      players: _players,
      properties: [], // TODO: Initialize with standard Monopoly properties
      decks: {}, // TODO: Initialize with standard card decks
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    // Save game state
    final persistence = GamePersistence();
    await persistence.saveGameState(gameState);

    // Navigate to dashboard
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => DashboardScreen(initialState: gameState),
        ),
      );
    }
  }

  @override
  void dispose() {
    for (var controller in _playerControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Game Setup'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Add Players',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _playerControllers.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _playerControllers[index],
                            decoration: InputDecoration(
                              labelText: 'Player ${index + 1}',
                              border: const OutlineInputBorder(),
                            ),
                          ),
                        ),
                        if (_playerControllers.length > 2)
                          IconButton(
                            icon: const Icon(Icons.remove_circle),
                            onPressed: () => _removePlayerField(index),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: _addPlayerField,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Player'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _startGame,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Start Game'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


