import 'dart:async';
import 'package:flutter/material.dart';
import 'package:monopoly_banking/core/models/game_state.dart';
import 'package:monopoly_banking/core/state/game_state_manager.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_definition.dart';
import 'package:monopoly_banking/core/actions/intent_builder.dart';
import 'package:monopoly_banking/core/actions/intent_validator.dart';
import 'package:monopoly_banking/scanner/marker_scanner_service.dart';
import 'package:monopoly_banking/ui/components/confirmation_dialog.dart';

class ScanScreen extends StatefulWidget {
  final GameStateManager stateManager;
  final GameState currentState;

  const ScanScreen({
    super.key,
    required this.stateManager,
    required this.currentState,
  });

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  late MarkerScannerService _scannerService;
  StreamSubscription<MarkerDefinition>? _subscription;
  bool _isScanning = false;
  DateTime? _lastScanTime;
  static const _scanCooldown = Duration(seconds: 2);

  @override
  void initState() {
    super.initState();
    _scannerService = MarkerScannerService();
  }

  void _startScanning() {
    if (_isScanning) return;

    setState(() {
      _isScanning = true;
    });

    _subscription = _scannerService.markerStream.listen((definition) {
      _handleMarkerDetected(definition);
    });

    _scannerService.startScanning();
  }

  void _stopScanning() {
    _subscription?.cancel();
    _subscription = null;
    _scannerService.stopScanning();
    setState(() {
      _isScanning = false;
    });
  }

  Future<void> _handleMarkerDetected(MarkerDefinition definition) async {
    // Cooldown to prevent double scans
    final now = DateTime.now();
    if (_lastScanTime != null &&
        now.difference(_lastScanTime!) < _scanCooldown) {
      return;
    }
    _lastScanTime = now;

    // Stop scanning temporarily
    _stopScanning();

    // Build intent from marker
    // TODO: Get current player from UI state or selection
    final currentPlayerId = widget.currentState.players.isNotEmpty
        ? widget.currentState.players.first.id
        : null;

    if (currentPlayerId == null) {
      _showError('No players available');
      _startScanning();
      return;
    }

    final intent = IntentBuilder.buildIntent(
      definition,
      widget.currentState,
      currentPlayerId: currentPlayerId,
    );

    if (intent == null) {
      _showError('Could not create intent from marker');
      _startScanning();
      return;
    }

    // Validate intent
    final errors = IntentValidator.validate(widget.currentState, intent);
    if (errors.isNotEmpty) {
      _showError('Validation failed: ${errors.join(", ")}');
      _startScanning();
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => ConfirmationDialog(
        intent: intent,
        gameState: widget.currentState,
      ),
    );

    if (confirmed == true) {
      // Apply intent
      try {
        final newState = await widget.stateManager.applyIntent(intent);
        if (mounted) {
          Navigator.of(context).pop(newState);
        }
      } catch (e) {
        _showError('Failed to apply intent: $e');
        _startScanning();
      }
    } else {
      // User cancelled, resume scanning
      _startScanning();
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  void dispose() {
    _stopScanning();
    _scannerService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Marker'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _isScanning ? Icons.qr_code_scanner : Icons.qr_code,
              size: 100,
              color: _isScanning ? Colors.green : Colors.grey,
            ),
            const SizedBox(height: 24),
            Text(
              _isScanning ? 'Scanning...' : 'Ready to scan',
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isScanning ? _stopScanning : _startScanning,
              child: Text(_isScanning ? 'Stop Scanning' : 'Start Scanning'),
            ),
          ],
        ),
      ),
    );
  }
}


