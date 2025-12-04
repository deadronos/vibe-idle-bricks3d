# DESIGN007 — Refactor `src/store/gameStore.ts`

**Status:** Draft  
**Added:** 2025-12-04  
**Updated:** 2025-12-04

## Goal
Refactor the monolithic Zustand store into typed feature slices to improve maintainability, testability, and incremental change velocity.

## Problem Statement
`src/store/gameStore.ts` currently combines many responsibilities (balls, progression, UI, persistence, side-effects). This increases cognitive load, makes unit testing difficult, and couples unrelated consumers to the same module.

## Requirements (EARS)
- WHEN a feature needs isolated state, THE SYSTEM SHALL allow adding a new slice file and composing it into the global store.  
  Acceptance: Add a slice without editing the central store composition logic; TypeScript compile passes.
- WHEN a consumer subscribes to state, THE SYSTEM SHALL expose strongly-typed selectors to avoid broad re-renders.  
  Acceptance: selectors are typed and `npm run typecheck` passes.
- WHEN persisting/rehydrating, THE SYSTEM SHALL keep persistence logic isolated from pure state/actions.  
  Acceptance: persistence code lives in its own module and is covered by unit tests.

## Proposed Design
- Create `src/store/slices/` with one slice per concern. Each slice exports a state type and a `createXSlice` factory:
  - `balls.ts` — ball positions, spawn, counts, and ball-specific actions.
  - `progression.ts` — score, currency, upgrades, prestige.
  - `ui.ts` — graphics quality, modal open/close state, HUD toggles.
  - `persistence.ts` — load/save, rehydrate helpers, persistence adapters.
- Add a typed store composer:
  - `src/store/createStore.ts` — composes slices and returns the `useGameStore` hook.
  - `src/store/index.ts` — public re-export for `useGameStore` and types.
- Keep a minimal compatibility shim (`gameStore.ts`) during migration if needed.

### Types & API
- Export slice state types (e.g., `BallsState`, `ProgressionState`) and a combined `GameState` type.
- Consumers should import `useGameStore` from `src/store` (no change for callers).

## Implementation Plan (small, safe steps)
1. Add `src/store/createStore.ts` and `src/store/slices/balls.ts` (PoC).  
2. Move ball-related logic and corresponding tests to the `balls` slice and point imports at the new selectors/actions.  
3. Repeat for `progression`, `ui`, and `persistence`.  
4. Replace exported `useGameStore` with composed store and run `npm run typecheck` and tests.  
5. Remove `gameStore.ts` or keep as deprecated shim with clear comments.

## Tests & Validation
- Unit tests per slice (e.g., `balls.test.ts`) for actions and selectors.  
- Full test run and TypeScript typecheck succeed.  
- Manual smoke test of gameplay to ensure no regressions.

## Migration Notes
- Migrate consumers gradually; keep `useGameStore` export stable.  
- Avoid placing R3F refs or `useFrame` logic inside store slices—keep frame-related logic inside components or `FrameManager`.

## Risks
- Risk of circular imports — enforce slice boundaries and keep utility types in a shared `types.ts` if needed.

---
