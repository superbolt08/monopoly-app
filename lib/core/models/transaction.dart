import 'package:equatable/equatable.dart';

enum TransactionType {
  addMoney,
  transfer,
  propertyPurchase,
  propertySale,
  rent,
  cardEffect,
  tax,
  // More types can be added later
}

class Transaction extends Equatable {
  final String id;
  final DateTime timestamp;
  final TransactionType type;
  final String? source;
  final String? destination;
  final int amount;
  final Map<String, dynamic> metadata;

  const Transaction({
    required this.id,
    required this.timestamp,
    required this.type,
    this.source,
    this.destination,
    this.amount = 0,
    this.metadata = const {},
  });

  Transaction copyWith({
    String? id,
    DateTime? timestamp,
    TransactionType? type,
    String? source,
    String? destination,
    int? amount,
    Map<String, dynamic>? metadata,
  }) {
    return Transaction(
      id: id ?? this.id,
      timestamp: timestamp ?? this.timestamp,
      type: type ?? this.type,
      source: source ?? this.source,
      destination: destination ?? this.destination,
      amount: amount ?? this.amount,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'timestamp': timestamp.toIso8601String(),
      'type': type.name,
      'source': source,
      'destination': destination,
      'amount': amount,
      'metadata': metadata,
    };
  }

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      type: TransactionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TransactionType.transfer,
      ),
      source: json['source'] as String?,
      destination: json['destination'] as String?,
      amount: json['amount'] as int? ?? 0,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
    );
  }

  @override
  List<Object?> get props => [id, timestamp, type, source, destination, amount, metadata];
}


