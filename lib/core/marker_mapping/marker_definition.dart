import 'package:equatable/equatable.dart';
import 'package:monopoly_banking/core/marker_mapping/marker_type.dart';

class MarkerDefinition extends Equatable {
  final int markerId;
  final MarkerType type;
  final Map<String, dynamic> payload;

  const MarkerDefinition({
    required this.markerId,
    required this.type,
    this.payload = const {},
  });

  @override
  List<Object?> get props => [markerId, type, payload];
}


