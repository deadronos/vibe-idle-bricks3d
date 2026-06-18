# Idle Bricks 3D

A 3D "idle breakout" style game built with React, TypeScript, and React Three Fiber.

![Game Screenshot](https://github.com/user-attachments/assets/222a29b0-f1c8-4134-9c5b-62c82498325c)

## Features

- 🎮 **3D Breakout Gameplay**: Watch balls automatically bounce and break bricks in a 3D arena
- 🏗️ **Multiple Brick Layers**: Bricks are arranged in multiple rows and layers with varying health
- ⚡ **Idle Mechanics**: The game plays itself - no input required!
- 📈 **Upgrade System**: Spend points to upgrade ball damage, speed, or add more balls
- 🎨 **Beautiful Visuals**: Colorful bricks, glowing edges, starfield background
- 🖱️ **Interactive Camera**: Rotate and zoom to view the action from any angle
- ⏸️ **Pause/Resume**: Control the game flow
- 🏅 **Prestige / Meta Progression**: Ascend to gain meta bonuses (prestige mechanics) and long-term progression
- 🏆 **Achievements**: Unlock progression and performance milestones
- 💾 **Persistence / Rehydration**: Game progress is persisted to browser storage and rehydrated on load (storage key: `idle-bricks3d:game:v1`).

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Three Fiber** - React renderer for Three.js
- **Drei** - Useful helpers for R3F
- **Three.js** - 3D graphics library
- **Zustand** - State management
- **Vitest** - Testing framework

- **Rapier (physics)** - via @dimforge/rapier3d-compat (^0.19.3)
- **Postprocessing** - via @react-three/postprocessing (^3.0.4)

Note: common package versions used in this repository (see package.json for the full list):

- @react-three/fiber: ^9.6.1
- @react-three/drei: ^10.7.7
- three: ^0.184.0
- @dimforge/rapier3d-compat: ^0.19.3
- @react-three/postprocessing: ^3.0.4

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm (recommended) or npm / yarn

### Installation

```bash
# Install dependencies (pnpm recommended)
pnpm install
# or: npm install / yarn install

# Start development server
pnpm run dev
# or: npm run dev

# Run tests (see scripts below)
pnpm run test
# or: npm run test

# Build for production
pnpm run build
# or: npm run build
```

### Experimental: SharedArrayBuffer-based physics (POC)

An experimental POC is available that uses SharedArrayBuffer + Atomics to run the per-ball physics simulation in a worker with zero-copy in-place buffers. This is intended to demonstrate potential latency and CPU improvements for high ball counts.

Notes:

- This feature requires cross-origin isolation (COOP/COEP). Use `VITE_ENABLE_COOP=1` when running the dev server.

- Enable the POC via `VITE_ENABLE_SAB=1`.

Example (macOS / Linux):

```bash
VITE_ENABLE_COOP=1 VITE_ENABLE_SAB=1 npm run dev
```

Example (Windows PowerShell):

```powershell
$Env:VITE_ENABLE_COOP = '1'; $Env:VITE_ENABLE_SAB = '1'; npm run dev
```

When enabled, `FrameManager` will attempt to initialize the SAB worker and use it; otherwise the system falls back to the transferable-worker path or single-threaded simulation.

See `docs/SHAREDARRAYBUFFER.md` for more details and caveats about cross-origin isolation and testing.

## Testing

The repository uses Vitest for unit and integration tests. Useful scripts are available in `package.json` (run with `pnpm` / `npm`):

```bash
# Run tests (headless / default)
pnpm run test

# Run tests once (CI-friendly)
pnpm run test:run

# Run tests in watch mode
pnpm run test:watch

# Open the Vitest UI
pnpm run test:ui

# Run tests with coverage
pnpm run test:coverage

# Rapier/physics smoke tests
pnpm run test:rapier-smoke
```

A few notable directories and docs:

- `engine/rapier/` contains the Rapier runtime, helpers and physics integration used by the game.
- `store/persistence/` contains rehydration and storage helpers used to persist game progress.
- `systems/` contains core game systems such as brick behaviors and effect event handling.
- `memory/` (top-level) stores design docs and task tracking used by contributors and agents.

## Contributing & development notes

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines. This project enforces formatting and linting rules via Prettier and ESLint and uses TypeScript in strict mode — please run the following locally before opening PRs:

```bash
pnpm run format      # Prettier
pnpm run lint        # ESLint
pnpm run typecheck   # TypeScript strict build
pnpm run test:run    # Run all tests once
```

Please follow the repository's coding guidelines and the spec-driven workflow in `.github/instructions` when adding larger changes.

There are also end-to-end tests under `tests/e2e` and a number of Rapier-focused smoke/integration tests under `src/test/rapier`.

## How to Play

1. **Watch**: Balls automatically bounce around and break bricks
2. **Earn Points**: Each brick destroyed awards points based on its layer
3. **Upgrade**: Spend points on upgrades:
   - ⚔️ **Ball Damage**: Increase damage per hit
   - 💨 **Ball Speed**: Make balls move faster
   - 🔮 **New Ball**: Add more balls (up to 20)
4. **Progress**: When all bricks are destroyed, a new wave spawns

5. **Prestige / Meta progression**: When you reach later waves you can choose to 'prestige' (ascend) for permanent meta bonuses that accelerate future runs.

6. **Achievements & Save**: Complete challenges to unlock achievements. Progress is saved and rehydrated on load (localStorage key: `idle-bricks3d:game:v1`).

## Controls

- **Mouse Drag**: Rotate camera
- **Scroll**: Zoom in/out
- **Pause Button**: Pause/resume the game

- **Keyboard**: Space toggles pause/resume; `U` upgrades ball damage (keyboard shortcuts are handled by useKeyboardShortcuts).
- **Mobile / Touch**: Mobile-friendly UI and an upgrade drawer are available (see UI/MobileUpgrades for touch controls).

## Project structure

The repository's `src/` layout is richer than earlier summaries — here's the current high-level structure.

```text
src/
├── App.css
├── App.tsx
├── index.css
├── main.tsx
├── assets/                # Static assets and images
├── components/            # UI and 3D scene components
│   ├── Arena.tsx
│   ├── Ball.tsx
│   ├── BallsInstanced.tsx
│   ├── Brick.tsx
│   ├── GameScene.tsx
│   ├── GeometricBackground.tsx
│   ├── PerfOverlay.tsx
│   ├── GameScene/         # Scene-layered components used by GameScene.tsx
│   │   ├── ArenaLayer.tsx
│   │   ├── BallsLayer.tsx
│   │   ├── BricksLayer.tsx
│   │   └── SceneSetup.tsx
│   ├── bricks/            # Instanced bricks helpers
│   │   ├── BricksInstanced.tsx
│   │   └── useInstancedBricks.ts
│   ├── effects/           # Visual effect components (particles, floating text, camera rig)
│   │   ├── CameraRig.tsx
│   │   ├── FloatingText.tsx
│   │   └── ParticleSystem.tsx
│   └── ui/                # HUD & UI controls
│       ├── UI.tsx
│       ├── UI.css
│       ├── UpgradesPanel.tsx
│       ├── ScorePanel.tsx
│       └── SettingsPanel.tsx
├── engine/                # Low-level engine helpers, physics & rapier integration
│   ├── collision.ts
│   ├── FrameManager.tsx
│   ├── picking.ts
│   └── rapier/            # rapier runtime and helpers
│       ├── rapierInit.ts
│       └── RapierPhysicsSystem.ts
├── store/                 # Zustand stores and slices, persistence helpers
│   ├── createStore.ts
│   ├── gameStore.ts
│   ├── persistence.ts
│   ├── achievements.ts
│   ├── constants.ts
│   └── slices/
│       ├── balls.ts
│       └── progression/
├── systems/               # Game systems and behaviors
│   ├── brickBehaviors.ts
│   ├── EffectEventBus.ts
│   └── behaviors/
└── test/                  # Unit & integration tests (vitest)
   ├── gameStore.test.ts
   └── (many other test files)

```

## Documentation

Every source file in this repository is fully documented with JSDoc/TSDoc comments.
These comments provide detailed information about the purpose, parameters, and return values of all public functions, components, and interfaces.

Key areas to explore:

- `src/store/`: Comprehensive state management documentation (Zustand slices).
- `src/engine/`: Physics integration and simulation loop details.
- `src/components/`: Component props and rendering behavior.
- `src/systems/`: Event bus and game behavior systems.

## License

MIT License - see [LICENSE](LICENSE) for details.
