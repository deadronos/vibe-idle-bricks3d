# DESIGN009 — Refactor `src/systems/brickBehaviors.ts`

**Status:** Draft  
**Added:** 2025-12-04  
**Updated:** 2025-12-04

## Goal
Split monolithic brick behavior logic into modular, composable behavior modules so individual behaviors can be tested, reused, and composed per-brick-type.

## Problem Statement
`src/systems/brickBehaviors.ts` mixes physics interactions, scoring, visual effects, and special-case behaviors in one file. This hampers testability and adding new behaviors.

## Requirements (EARS)
- WHEN adding a new brick behavior (e.g., explosive, shatter), THE SYSTEM SHALL allow adding a new module implementing a common behavior interface.  
  Acceptance: New behavior module can be registered without changing core brick system.
- WHEN evaluating brick hit logic, THE SYSTEM SHALL separate pure event-to-effect mapping from physics side-effects.  
  Acceptance: Pure mapping functions have unit tests; physics mutations are isolated and documented.

## Proposed Design
- New directory: `src/systems/behaviors/` with modules:
  - `hitDamage.ts` — computes and applies damage logic.
  - `score.ts` — converts brick destruction events into scoring events.
  - `spawnEffect.ts` — visual/particle spawning helpers.
  - `powerup.ts` — logic for powerup drops/spawn.
  - `index.ts` — aggregator that registers behaviors and provides a `runBehaviorsForHit` API.
- Define a small behavior interface in `types.ts`:
  ```ts
  export type BrickBehavior = {
    name: string;
    onHit?: (ctx: BehaviorContext, hit: HitEvent) => void | Promise<void>;
    onDestroy?: (ctx: BehaviorContext, brick: Brick) => void | Promise<void>;
  }
  ```
- Keep `brickBehaviors.ts` as an adapter that wires physics events into the new behavior registry during migration.

## Implementation Plan
1. Create `src/systems/behaviors/types.ts` and `behaviors/index.ts` as the registration API.  
2. Implement `hitDamage.ts` and `score.ts` and add unit tests.  
3. Replace parts of `brickBehaviors.ts` to call `behaviors.runBehaviorsForHit` and gradually move remaining logic until `brickBehaviors.ts` is small or removed.

## Tests & Validation
- Unit tests per behavior module (pure functions).  
- Integration test that simulates a hit and ensures expected behaviors run (score increment, effect spawn, persistence events).

## Migration Notes
- Wire the new behavior registry behind the existing event bus initially to avoid ripple changes.  
- Perform the refactor in small PRs—one behavior at a time.

---
