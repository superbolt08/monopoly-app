import 'package:equatable/equatable.dart';
import 'package:monopoly_banking/core/models/player.dart';
import 'package:monopoly_banking/core/models/property.dart';
import 'package:monopoly_banking/core/models/card.dart';
import 'package:monopoly_banking/core/models/transaction.dart';

class GameState extends Equatable {
  final String gameId;
  final List<Player> players;
  final List<Property> properties;
  final Map<String, List<Card>> decks; // "chance" or "communityChest" -> List<Card>
  final List<Transaction> transactionLog;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;

  const GameState({
    required this.gameId,
    this.players = const [],
    this.properties = const [],
    this.decks = const {},
    this.transactionLog = const [],
    this.version = 1,
    required this.createdAt,
    required this.updatedAt,
  });

  GameState copyWith({
    String? gameId,
    List<Player>? players,
    List<Property>? properties,
    Map<String, List<Card>>? decks,
    List<Transaction>? transactionLog,
    int? version,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GameState(
      gameId: gameId ?? this.gameId,
      players: players ?? this.players,
      properties: properties ?? this.properties,
      decks: decks ?? this.decks,
      transactionLog: transactionLog ?? this.transactionLog,
      version: (version ?? this.version) + 1,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gameId': gameId,
      'players': players.map((p) => p.toJson()).toList(),
      'properties': properties.map((p) => p.toJson()).toList(),
      'decks': decks.map((key, value) => MapEntry(key, value.map((c) => c.toJson()).toList())),
      'transactionLog': transactionLog.map((t) => t.toJson()).toList(),
      'version': version,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory GameState.fromJson(Map<String, dynamic> json) {
    return GameState(
      gameId: json['gameId'] as String,
      players: (json['players'] as List?)
              ?.map((p) => Player.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      properties: (json['properties'] as List?)
              ?.map((p) => Property.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      decks: (json['decks'] as Map?)?.map((key, value) => MapEntry(
            key as String,
            (value as List)
                .map((c) => Card.fromJson(c as Map<String, dynamic>))
                .toList(),
          )) ??
          {},
      transactionLog: (json['transactionLog'] as List?)
              ?.map((t) => Transaction.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      version: json['version'] as int? ?? 1,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  @override
  List<Object?> get props => [
        gameId,
        players,
        properties,
        decks,
        transactionLog,
        version,
        createdAt,
        updatedAt,
      ];
}


