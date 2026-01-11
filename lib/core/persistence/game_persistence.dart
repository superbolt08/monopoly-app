import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:monopoly_banking/core/models/game_state.dart';

/// Handles persistence of GameState using SQLite.
/// All writes are atomic and transactional.
class GamePersistence {
  static const String _dbName = 'monopoly_banking.db';
  static const int _dbVersion = 1;
  static const String _tableName = 'game_state';
  static const String _columnId = 'id';
  static const String _columnData = 'data';
  static const String _columnVersion = 'version';
  static const String _columnUpdatedAt = 'updated_at';

  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    return await openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_tableName (
        $_columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $_columnData TEXT NOT NULL,
        $_columnVersion INTEGER NOT NULL,
        $_columnUpdatedAt TEXT NOT NULL
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async) {
    // TODO: Implement schema migrations when needed
    if (oldVersion < newVersion) {
      // Migration logic here
    }
  }

  /// Saves the full GameState snapshot atomically.
  /// This replaces any existing game state.
  Future<void> saveGameState(GameState state) async {
    final db = await database;
    final jsonData = jsonEncode(state.toJson());

    await db.transaction((txn) async {
      // Delete existing state (we only keep one game state)
      await txn.delete(_tableName);

      // Insert new state
      await txn.insert(
        _tableName,
        {
          _columnData: jsonData,
          _columnVersion: state.version,
          _columnUpdatedAt: state.updatedAt.toIso8601String(),
        },
      );
    });
  }

  /// Loads the saved GameState, or returns null if no state exists.
  Future<GameState?> loadGameState() async {
    final db = await database;
    final results = await db.query(
      _tableName,
      orderBy: '$_columnUpdatedAt DESC',
      limit: 1,
    );

    if (results.isEmpty) {
      return null;
    }

    final jsonData = results.first[_columnData] as String;
    final json = jsonDecode(jsonData) as Map<String, dynamic>;
    return GameState.fromJson(json);
  }

  /// Deletes all saved game state.
  Future<void> clearGameState() async {
    final db = await database;
    await db.delete(_tableName);
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}


