# Monopoly Banking App

A local-first, offline Monopoly banking app built with Flutter. This app handles banking transactions and game state management for Monopoly games using ArUco marker scanning.

## Features

- **Local-First Architecture**: All data stored locally, no cloud dependencies
- **Crash-Safe**: Every action is persisted immediately
- **ArUco Marker Integration**: Scan physical markers to trigger game actions
- **Unidirectional Data Flow**: Predictable state management
- **Extensible Design**: Easy to add new rules and intents

## Architecture

This app follows strict architectural principles:

- **Single Source of Truth**: One authoritative `GameState`
- **Unidirectional Data Flow**: UI → Intent → Reducer → Persist → UI
- **Pure Reducers**: State transformations are pure functions
- **Intent System**: All actions go through validated intents
- **Marker Mapping**: Scanner emits IDs, mapping layer converts to intents

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
lib/
  core/
    models/          # Data models (GameState, Player, Property, etc.)
    state/           # State management
    actions/         # Intent system
    reducers/        # Pure state transformation functions
    persistence/     # SQLite persistence
    marker_mapping/  # Marker ID to definition mapping
  
  scanner/
    aruco/           # ArUco scanner interfaces
    camera/          # Camera service interfaces
  
  ui/
    screens/         # App screens
    components/      # Reusable UI components
```

## Getting Started

### Prerequisites

- Flutter SDK (3.0.0 or higher)
- Dart SDK

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   flutter pub get
   ```

### Running the App

```bash
flutter run
```

## Usage

### Setting Up a Game

1. Launch the app
2. Add at least 2 players
3. Click "Start Game"

### Scanning Markers

1. From the dashboard, tap "Scan Marker"
2. Start scanning (currently uses mock scanner)
3. When a marker is detected, confirm the action
4. State is automatically saved

### Marker ID Ranges

- `1000-1099`: Properties
- `2000-2099`: Money (amount = markerId - 2000)
- `3000-3099`: Chance cards
- `4000-4099`: Community Chest cards
- `5000-5099`: Actions
- `6000-6099`: Players

## Current Implementation Status

### ✅ Implemented

- Core data models (GameState, Player, Property, Card, Transaction)
- Marker mapping system
- Intent system with validation
- Pure reducer functions
- SQLite persistence
- Mock scanner for development
- UI screens (setup, dashboard, scan, confirmation, player detail, transaction log)
- Unidirectional data flow
- Crash-safe state persistence

### 🚧 TODO

- Real ArUco scanner with OpenCV
- Property price database
- Card effect execution
- Player selection UI for multi-player actions
- Standard Monopoly property initialization
- Standard card deck initialization
- More game rules
- Export/import game state

## Development Notes

### Scanner Implementation

Currently uses `MockArucoScanner` which simulates marker detection. To implement real scanning:

1. Implement `ArucoScanner` interface with OpenCV
2. Use platform channels for camera access
3. Replace `MockArucoScanner` in `MarkerScannerService`

### Adding New Intents

1. Create intent class extending `Intent`
2. Add reducer case in `GameReducer`
3. Add validation in `IntentValidator`
4. Update `IntentBuilder` if marker-driven
5. Update confirmation dialog

### Adding New Marker Types

1. Add range to `MarkerType` enum
2. Update `MarkerMapper` with range logic
3. Add intent building logic in `IntentBuilder`

## Dependencies

- `sqflite`: Local SQLite database
- `uuid`: Unique ID generation
- `equatable`: Value equality for models
- `path`: File path utilities

## License

See LICENSE file for details.

## Contributing

This is an infrastructure-first implementation. Focus on:
- Correctness
- Safety
- Clarity
- Extensibility

Avoid hardcoding game rules - leave hooks for future enhancements.
