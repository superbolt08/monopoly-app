/// Interface for ArUco marker scanning.
/// Scanner emits marker IDs only - no business logic.
abstract class ArucoScanner {
  /// Starts scanning for ArUco markers.
  /// Returns a stream of marker IDs when detected.
  Stream<int> scanMarkers();

  /// Stops scanning.
  void stopScanning();

  /// Checks if scanner is currently active.
  bool get isScanning;
}


