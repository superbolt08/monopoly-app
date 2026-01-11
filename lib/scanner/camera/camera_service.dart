/// Interface for camera service.
/// This will be implemented using platform channels for actual camera access.
abstract class CameraService {
  /// Initializes the camera.
  Future<void> initialize();

  /// Starts camera preview.
  Future<void> startPreview();

  /// Stops camera preview.
  Future<void> stopPreview();

  /// Checks if camera is available.
  Future<bool> isAvailable();

  /// Disposes camera resources.
  Future<void> dispose();
}


