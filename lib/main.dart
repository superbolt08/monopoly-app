import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/persistence/game_persistence.dart';
import 'package:monopoly_banking/ui/screens/game_setup_screen.dart';
import 'package:monopoly_banking/ui/screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MonopolyBankingApp());
}

class MonopolyBankingApp extends StatelessWidget {
  const MonopolyBankingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Monopoly Banking',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const AppInitializer(),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isLoading = true;
  GameState? _initialState;

  @override
  void initState() {
    super.initState();
    _loadGameState();
  }

  Future<void> _loadGameState() async {
    try {
      final persistence = GamePersistence();
      final savedState = await persistence.loadGameState();
      
      if (mounted) {
        setState(() {
          _initialState = savedState;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_initialState != null) {
      return DashboardScreen(initialState: _initialState!);
    }

    return const GameSetupScreen();
  }
}

