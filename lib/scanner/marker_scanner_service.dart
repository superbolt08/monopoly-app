import 'dart:async';
import 'package:monopoly_banking/scanner/aruco/aruco_scanner.dart';
import 'package:monopoly_banking/scanner/aruco/mock_aruco_scanner.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_mapper.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_definition.dart';

/// Service that coordinates scanner and marker mapping.
/// This layer bridges the scanner (which emits IDs) to the marker mapping system.
class MarkerScannerService {
  final ArucoScanner _scanner;
  StreamSubscription<int>? _subscription;
  final StreamController<MarkerDefinition> _markerController =
      StreamController<MarkerDefinition>.broadcast();

  MarkerScannerService({ArucoScanner? scanner})
      : _scanner = scanner ?? MockArucoScanner();

  /// Stream of detected marker definitions.
  Stream<MarkerDefinition> get markerStream => _markerController.stream;

  /// Starts scanning for markers.
  void startScanning() {
    if (_subscription != null) {
      return; // Already scanning
    }

    _subscription = _scanner.scanMarkers().listen((markerId) {
      final definition = MarkerMapper.getMarkerDefinition(markerId);
      if (definition != null) {
        _markerController.add(definition);
      }
    });
  }

  /// Stops scanning for markers.
  void stopScanning() {
    _subscription?.cancel();
    _subscription = null;
    _scanner.stopScanning();
  }

  /// Disposes resources.
  void dispose() {
    stopScanning();
    _markerController.close();
  }
}


