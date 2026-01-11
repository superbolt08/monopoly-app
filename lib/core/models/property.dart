import 'package:equatable/equatable.dart';

class Property extends Equatable {
  final String id;
  final String name;
  final String? ownerId;
  final int houseCount;
  final bool hasHotel;
  final bool mortgaged;

  const Property({
    required this.id,
    required this.name,
    this.ownerId,
    this.houseCount = 0,
    this.hasHotel = false,
    this.mortgaged = false,
  });

  Property copyWith({
    String? id,
    String? name,
    String? ownerId,
    int? houseCount,
    bool? hasHotel,
    bool? mortgaged,
  }) {
    return Property(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      houseCount: houseCount ?? this.houseCount,
      hasHotel: hasHotel ?? this.hasHotel,
      mortgaged: mortgaged ?? this.mortgaged,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ownerId': ownerId,
      'houseCount': houseCount,
      'hasHotel': hasHotel,
      'mortgaged': mortgaged,
    };
  }

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerId: json['ownerId'] as String?,
      houseCount: json['houseCount'] as int? ?? 0,
      hasHotel: json['hasHotel'] as bool? ?? false,
      mortgaged: json['mortgaged'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [id, name, ownerId, houseCount, hasHotel, mortgaged];
}


