# Monopoly Banking App - Architecture Documentation

## Overview

This is a local-first, offline Monopoly banking app built with Flutter. The app uses ArUco marker scanning to trigger game actions, following a strict unidirectional data flow architecture.

## Core Principles

1. **Single Source of Truth**: One authoritative `GameState` object
2. **Unidirectional Data Flow**: UI → Intent → Reducer → New State → Persist → UI update
3. **Crash Safety**: Every state mutation is persisted synchronously
4. **Scanner Separation**: Scanner emits marker IDs only; business logic is separate
5. **Extensibility**: Architecture supports adding new rules and intents without rewrites

## Module Structure

```
/lib
  /core
    /models          # Immutable data models
    /state           # State management
    /actions         # Intent system
    /reducers        # Pure state transformation functions
    /persistence     # SQLite persistence layer
    /marker_mapping  # Marker ID to definition mapping
  
  /scanner
    /aruco           # ArUco scanner interface and mock
    /camera          # Camera service interface and mock
    marker_scanner_service.dart  # Coordinates scanner + mapping
  
  /ui
    /screens         # Main app screens
    /components      # Reusable UI components
  
  main.dart          # App entry point
```

## Data Flow

### 1. Marker Scanning Flow

```
Scanner → Marker ID → MarkerMapper → MarkerDefinition → IntentBuilder → Intent
```

- **Scanner**: Emits raw marker IDs (e.g., `2001`, `1005`)
- **MarkerMapper**: Maps IDs to `MarkerDefinition` with type and payload
- **IntentBuilder**: Converts `MarkerDefinition` to `Intent` (requires game context)

### 2. State Mutation Flow

```
Intent → IntentValidator → Confirmation UI → GameReducer → New GameState → Persistence → UI Update
```

- **IntentValidator**: Validates intent against current state
- **Confirmation UI**: User confirms action
- **GameReducer**: Pure function that computes new state
- **Persistence**: Atomically saves full GameState snapshot
- **UI Update**: Reacts to state changes

## Core Components

### Models

All models are immutable and use `copyWith` for updates:

- **GameState**: Root state object containing all game data
- **Player**: Player information (balance, properties, jail status)
- **Property**: Property information (owner, houses, mortgage status)
- **Card**: Card definition (deck type, effect type, effect data)
- **Transaction**: Immutable transaction log entry

### Marker System

Markers are categorized by ID ranges:

- `1000-1099`: Properties
- `2000-2099`: Money (amount = markerId - 2000)
- `3000-3099`: Chance cards
- `4000-4099`: Community Chest cards
- `5000-5099`: Actions
- `6000-6099`: Players

### Intent System

Intents are serializable, validated, and require confirmation:

- `AddMoneyIntent`: Add money to player
- `TransferMoneyIntent`: Transfer between players
- `PropertyPurchaseIntent`: Purchase property
- `DrawCardIntent`: Draw from deck
- `PayRentIntent`: Pay rent

### Reducers

Pure functions in `GameReducer`:

- Take `(GameState, Intent)` as input
- Return new `GameState`
- Do NOT perform I/O
- Do NOT mutate input state

### Persistence

`GamePersistence` uses SQLite:

- Saves full `GameState` snapshot as JSON
- Atomic writes using transactions
- Versioned schema for migrations
- Single game state per database

## Scanner Implementation

Currently uses `MockArucoScanner` for development:

- Simulates marker detection
- Emits test marker IDs periodically
- Can be replaced with real OpenCV-based implementation

## UI Screens

1. **GameSetupScreen**: Create new game, add players
2. **DashboardScreen**: Main screen showing players and balances
3. **ScanScreen**: Camera view for marker scanning
4. **ConfirmationDialog**: Confirms intent before execution
5. **PlayerDetailScreen**: Shows player details and owned properties
6. **TransactionLogScreen**: Shows transaction history

## Extensibility Points

### Adding New Intent Types

1. Create new intent class extending `Intent`
2. Add reducer case in `GameReducer.reduce()`
3. Add validation in `IntentValidator.validate()`
4. Add intent builder logic in `IntentBuilder` if marker-driven
5. Update confirmation dialog if needed

### Adding New Marker Types

1. Add new range to `MarkerType` enum
2. Update `MarkerMapper._getMarkerType()` with range check
3. Add payload building logic in `MarkerMapper.getMarkerDefinition()`
4. Update `IntentBuilder` to handle new marker type

### Adding New Game Rules

1. Add validation logic in `IntentValidator`
2. Add state transformation in `GameReducer`
3. Update models if new data is needed
4. Add UI for rule configuration if needed

## Testing Strategy

- **Unit Tests**: Test reducers, validators, mappers in isolation
- **Integration Tests**: Test intent → reducer → persistence flow
- **Widget Tests**: Test UI components with mock state
- **E2E Tests**: Test full scan → confirm → persist flow

## Future Enhancements

- Real ArUco scanner implementation with OpenCV
- Property price database
- Card effect execution
- Player selection UI for multi-player actions
- Game rules engine
- Export/import game state
- Multiple game support

## Dependencies

- `sqflite`: Local SQLite database
- `uuid`: Generate unique IDs
- `equatable`: Value equality for models
- `path`: File path utilities

## Notes

- All state mutations go through `GameStateManager.applyIntent()`
- Scanner has cooldown to prevent double scans
- State is persisted after every successful intent application
- App resumes from last saved state on launch


