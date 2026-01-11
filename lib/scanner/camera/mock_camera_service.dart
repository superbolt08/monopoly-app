import 'package:monopoly_banking/scanner/camera/camera_service.dart';

/// Mock implementation of CameraService for development.
class MockCameraService implements CameraService {
  bool _initialized = false;
  bool _previewActive = false;

  @override
  Future<void> initialize() async {
    _initialized = true;
  }

  @override
  Future<void> startPreview() async {
    if (!_initialized) {
      throw StateError('Camera not initialized');
    }
    _previewActive = true;
  }

  @override
  Future<void> stopPreview() async {
    _previewActive = false;
  }

  @override
  Future<bool> isAvailable() async {
    return true; // Mock always returns true
  }

  @override
  Future<void> dispose() async {
    _previewActive = false;
    _initialized = false;
  }
}


