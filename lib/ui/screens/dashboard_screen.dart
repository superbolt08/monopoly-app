import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/models/player.dart';
import 'package:monopoly_banking/core/state/game_state_manager.dart';
import 'package:monopoly_banking/core/persistence/game_persistence.dart';
import 'package:monopoly_banking/ui/screens/scan_screen.dart';
import 'package:monopoly_banking/ui/screens/player_detail_screen.dart';
import 'package:monopoly_banking/ui/screens/transaction_log_screen.dart';

class DashboardScreen extends StatefulWidget {
  final GameState initialState;

  const DashboardScreen({
    super.key,
    required this.initialState,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late GameStateManager _stateManager;
  late GameState _currentState;

  @override
  void initState() {
    super.initState();
    final persistence = GamePersistence();
    _stateManager = GameStateManager(widget.initialState, persistence);
    _currentState = widget.initialState;
  }

  void _updateState(GameState newState) {
    setState(() {
      _currentState = newState;
    });
  }

  Future<void> _navigateToScan() async {
    final result = await Navigator.of(context).push<GameState>(
      MaterialPageRoute(
        builder: (context) => ScanScreen(
          stateManager: _stateManager,
          currentState: _currentState,
        ),
      ),
    );

    if (result != null) {
      _updateState(result);
    }
  }

  void _navigateToPlayerDetail(Player player) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PlayerDetailScreen(
          player: player,
          gameState: _currentState,
        ),
      ),
    );
  }

  void _navigateToTransactionLog() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TransactionLogScreen(
          transactions: _currentState.transactionLog,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Monopoly Banking'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: _navigateToTransactionLog,
            tooltip: 'Transaction Log',
          ),
        ],
      ),
      body: Column(
        children: [
          // Players list
          Expanded(
            child: _currentState.players.isEmpty
                ? const Center(child: Text('No players'))
                : ListView.builder(
                    itemCount: _currentState.players.length,
                    itemBuilder: (context, index) {
                      final player = _currentState.players[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          title: Text(player.name),
                          subtitle: Text('\$${player.balance}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _navigateToPlayerDetail(player),
                        ),
                      );
                    },
                  ),
          ),
          // Scan button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _navigateToScan,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Marker'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

