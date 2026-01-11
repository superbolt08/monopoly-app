import 'dart:async';
import 'package:monopoly_banking/scanner/aruco/aruco_scanner.dart';

/// Mock implementation of ArucoScanner for development/testing.
/// Simulates marker detection by emitting marker IDs on demand.
class MockArucoScanner implements ArucoScanner {
  StreamController<int>? _controller;
  Timer? _timer;
  bool _isScanning = false;

  // Predefined marker IDs for testing
  final List<int> _testMarkers = [
    2001, // $1
    2005, // $5
    2010, // $10
    1001, // Property 1
    1002, // Property 2
    3001, // Chance card
    4001, // Community Chest card
  ];

  @override
  Stream<int> scanMarkers() {
    if (_isScanning) {
      throw StateError('Scanner is already active');
    }

    _isScanning = true;
    _controller = StreamController<int>.broadcast();

    // Simulate marker detection every 2 seconds
    int markerIndex = 0;
    _timer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (_controller != null && !_controller!.isClosed) {
        final markerId = _testMarkers[markerIndex % _testMarkers.length];
        _controller!.add(markerId);
        markerIndex++;
      }
    });

    return _controller!.stream;
  }

  @override
  void stopScanning() {
    _timer?.cancel();
    _timer = null;
    _controller?.close();
    _controller = null;
    _isScanning = false;
  }

  @override
  bool get isScanning => _isScanning;

  /// Manually trigger a marker detection (for testing)
  void simulateMarkerDetection(int markerId) {
    if (_controller != null && !_controller!.isClosed) {
      _controller!.add(markerId);
    }
  }
}


