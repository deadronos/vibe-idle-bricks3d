# TASK011 - Refactor `brickBehaviors` (DESIGN009)

**Status:** In Progress  
**Added:** 2025-12-04  
**Updated:** 2025-12-04

## Original Request

Create a task for DESIGN009 — refactor `src/systems/brickBehaviors.ts` into modular, composable behavior modules with a registry/adapter.

## Thought Process

- Current `brickBehaviors.ts` mixes hit handling, scoring, effects, and powerup logic, making it hard to test or add new behaviors.
- DESIGN009 proposes a behavior registry and per-concern modules (`hitDamage`, `score`, `spawnEffect`, `powerup`) under `src/systems/behaviors/`, with a typed interface and adapter to keep existing event wiring working during migration.
- Focus will be on carving out pure functions with unit tests first (damage/score), then wiring them via a registry before moving effect/powerup side-effects.

## Implementation Plan

1. Scaffold `src/systems/behaviors/` with `types.ts` and `index.ts` providing the registry API (`runBehaviorsForHit`, registration helpers) and shared context types.
2. Implement `hitDamage.ts` (pure damage mapping) and `score.ts` (score events) with unit tests covering hit/destroy flows.
3. Add `spawnEffect.ts` and `powerup.ts` helpers to isolate visual/powerup side-effects behind clear interfaces.
4. Refactor `brickBehaviors.ts` to delegate to the behavior registry, keeping the adapter thin while preserving existing wiring; add an integration test that exercises hit → behavior chain.
5. Run validation: `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`.

## Progress Tracking

**Overall Status:** In Progress - 80%

### Subtasks

| ID  | Description                                                       | Status      | Updated    | Notes |
| --- | ----------------------------------------------------------------- | ----------- | ---------- | ----- |
| 1.1 | Scaffold behaviors directory, types, and registry API             | Completed   | 2025-12-04 | Added registry + reset helpers |
| 2.1 | Implement `hitDamage` and `score` modules with unit tests         | Completed   | 2025-12-04 | Added compute/apply helpers + tests |
| 3.1 | Add `spawnEffect` and `powerup` helpers                            | Completed   | 2025-12-04 | Stub behaviors for future wiring |
| 4.1 | Adapt `brickBehaviors.ts` to use registry; add integration test   | Completed   | 2025-12-04 | handleContact now delegates to registry |
| 5.1 | Run validation commands (typecheck, lint, test:run, build)        | Not Started | 2025-12-04 | Pending |

## Progress Log

### 2025-12-04

- Task created from DESIGN009 to track refactoring `brickBehaviors.ts` into modular behaviors with a registry/adapter pathway and dedicated tests.
- Implemented `src/systems/behaviors/` with typed registry (resettable), hitDamage, score, spawnEffect, and powerup modules. Refactored `brickBehaviors.ts` to delegate hits/destroys through the registry with behavior context (applyDamage opt-in). Added tests covering damage computation and behavior registration. Validation suite not yet run; follow-up needed for lint/typecheck/tests/build.

---

**References:**
- Design doc: [DESIGN009 — Refactor `brickBehaviors`](../designs/DESIGN009-refactor-brickBehaviors.md)
