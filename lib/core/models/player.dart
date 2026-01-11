import 'package:equatable/equatable.dart';

class Player extends Equatable {
  final String id;
  final String name;
  final int balance;
  final List<String> ownedPropertyIds;
  final bool jailStatus;
  final int jailFreeCards;

  const Player({
    required this.id,
    required this.name,
    required this.balance,
    this.ownedPropertyIds = const [],
    this.jailStatus = false,
    this.jailFreeCards = 0,
  });

  Player copyWith({
    String? id,
    String? name,
    int? balance,
    List<String>? ownedPropertyIds,
    bool? jailStatus,
    int? jailFreeCards,
  }) {
    return Player(
      id: id ?? this.id,
      name: name ?? this.name,
      balance: balance ?? this.balance,
      ownedPropertyIds: ownedPropertyIds ?? this.ownedPropertyIds,
      jailStatus: jailStatus ?? this.jailStatus,
      jailFreeCards: jailFreeCards ?? this.jailFreeCards,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'balance': balance,
      'ownedPropertyIds': ownedPropertyIds,
      'jailStatus': jailStatus,
      'jailFreeCards': jailFreeCards,
    };
  }

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'] as String,
      name: json['name'] as String,
      balance: json['balance'] as int,
      ownedPropertyIds: List<String>.from(json['ownedPropertyIds'] as List? ?? []),
      jailStatus: json['jailStatus'] as bool? ?? false,
      jailFreeCards: json['jailFreeCards'] as int? ?? 0,
    );
  }

  @override
  List<Object?> get props => [id, name, balance, ownedPropertyIds, jailStatus, jailFreeCards];
}


