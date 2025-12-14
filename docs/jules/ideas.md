# Feature Ideas for Idle Bricks 3D

Based on analysis of the `idle-bricks-3d` repository, here are three feature ideas that fit the existing architecture (React Three Fiber + Zustand + Rapier).

## Repo Analysis

The project is an idle breakout game where balls automatically bounce and break bricks.

- **State**: Managed by Zustand with modular slices (`progression`, `balls`, `hits`, `persistence`).
- **Physics**: Uses a hybrid approach (custom collision or Rapier physics engine via `FrameManager.tsx`).
- **Rendering**: React Three Fiber with instanced rendering for performance (`BallsInstanced.tsx`).

## Feature 1: Explosive Bricks (Content Expansion)

**Concept**: A new rare brick type (e.g., "Magma Brick") that explodes when destroyed, dealing Area of Effect (AOE) damage to nearby bricks.

**Why**: Adds strategic variance to waves and helps clear dense clusters of bricks, satisfying the "power fantasy" of idle games.

**Implementation Details**:

- **Store Types** (`src/store/types.ts`):
  - Add `'explosive'` to `BrickType` union type.
- **Generation** (`src/store/createInitials.ts`):
  - Update `createInitialBricks` to spawn these with a low probability (e.g., 5%).
  - Assign a distinct color/property.
- **Logic** (`src/store/slices/progression/hits.ts`):
  - Update `damageBrick`.
  - When an explosive brick reaches 0 health, iterate through `state.bricks`.
  - Apply damage to any brick within a radius (e.g., 2.0 units) of the destroyed brick's position.
- **Visuals** (`src/components/Brick.tsx`):
  - Give it a distinct glowing red material or a particle effect on death.

## Feature 2: Critical Hit Upgrade (New Progression Path)

**Concept**: A new upgrade stat that gives balls a chance to deal double (or triple) damage on every hit.

**Why**: Current upgrades (Speed, Damage, Count) are linear. "Crit Chance" adds a probabilistic element that scales well into late-game.

**Implementation Details**:

- **State** (`src/store/types.ts`):
  - Add `critChance` (0-50%) to `UpgradeState` and `GameDataState`.
- **Persistence** (`src/store/slices/persistence.ts`):
  - Add `critChance` to the `partialize` list so it saves to local storage.
- **Upgrade Logic** (`src/store/slices/progression/upgrades.ts`):
  - Add `upgradeCritChance` action with an exponential cost curve.
- **Collision Logic** (`src/engine/FrameManager.tsx`):
  - In the game loop, when a hit is detected (in both Rapier and legacy paths), roll `Math.random() < critChance`.
  - If true, multiply damage by `critMultiplier` (e.g., 2.0) before calling `applyHits`.
  - Optionally emit a distinct "Crit" event for visual feedback.

## Feature 3: Active Ability: "Earthquake" (Active Mechanic)

**Concept**: A button the player can click to trigger an earthquake, dealing immediate damage to **all** active bricks. Balanced by a cooldown (e.g., 60 seconds).

**Why**: Idle games benefit from active mechanics that let players "unstuck" progress or speed up the start of a wave.

**Implementation Details**:

- **State** (`src/store/types.ts`):
  - Add `lastEarthquakeTime` (timestamp) to `GameDataState`.
- **Action** (`src/store/slices/progression/hits.ts`):
  - Add `triggerEarthquake` action.
  - It iterates all bricks and applies a flat damage amount (scaled by current wave or ball damage).
  - Updates `lastEarthquakeTime`.
- **UI** (`src/components/ui/Controls.tsx`):
  - Add a new "Smash" button.
  - Show a cooldown overlay or disable button based on `Date.now() - lastEarthquakeTime`.
- **Persistence** (`src/store/slices/persistence.ts`):
  - Save `lastEarthquakeTime` to prevent cooldown cheating on reload.
