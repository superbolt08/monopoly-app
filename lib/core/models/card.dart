import 'package:equatable/equatable.dart';

enum DeckType {
  chance,
  communityChest,
}

enum CardEffectType {
  move,
  pay,
  collect,
  advanceToProperty,
  goToJail,
  getOutOfJailFree,
  repair,
  // More effect types can be added later
}

class Card extends Equatable {
  final String id;
  final DeckType deckType;
  final String description;
  final CardEffectType effectType;
  final Map<String, dynamic> effectData;

  const Card({
    required this.id,
    required this.deckType,
    required this.description,
    required this.effectType,
    this.effectData = const {},
  });

  Card copyWith({
    String? id,
    DeckType? deckType,
    String? description,
    CardEffectType? effectType,
    Map<String, dynamic>? effectData,
  }) {
    return Card(
      id: id ?? this.id,
      deckType: deckType ?? this.deckType,
      description: description ?? this.description,
      effectType: effectType ?? this.effectType,
      effectData: effectData ?? this.effectData,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deckType': deckType.name,
      'description': description,
      'effectType': effectType.name,
      'effectData': effectData,
    };
  }

  factory Card.fromJson(Map<String, dynamic> json) {
    return Card(
      id: json['id'] as String,
      deckType: DeckType.values.firstWhere(
        (e) => e.name == json['deckType'],
        orElse: () => DeckType.chance,
      ),
      description: json['description'] as String,
      effectType: CardEffectType.values.firstWhere(
        (e) => e.name == json['effectType'],
        orElse: () => CardEffectType.move,
      ),
      effectData: Map<String, dynamic>.from(json['effectData'] as Map? ?? {}),
    );
  }

  @override
  List<Object?> get props => [id, deckType, description, effectType, effectData];
}


