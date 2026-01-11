import 'package:equatable/equatable.dart';

/// Base class for all intents.
/// Intents represent user actions that may mutate game state.
/// They must be validated before execution and require confirmation.
abstract class Intent extends Equatable {
  const Intent();

  /// Serialize intent to JSON for persistence/debugging
  Map<String, dynamic> toJson();

  @override
  List<Object?> get props => [];
}


