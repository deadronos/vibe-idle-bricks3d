# DESIGN011 — Store Persistence Refactor

**Status:** Proposed  
**Date:** 2025-12-05

Summary
- `src/store/persistence.ts` contains storage helpers, a meta-storage implementation and a fairly large `handleRehydrate` function with validation, safety nets, and post-rehydrate heuristics. Splitting responsibilities will make it easier to test the rehydrate logic, validate storage semantics, and reduce file size.

Requirements (EARS)
- WHEN the store is persisted to `localStorage`, THE SYSTEM SHALL also persist a companion "meta" snapshot when the snapshot represents meaningful progress. [Acceptance: unit tests verifying `setItem` writes meta when snapshot isn't default]
- WHEN rehydrating state, THE SYSTEM SHALL validate/clamp input values and apply safe rehydration semantics (create fresh balls, apply achievements) while preserving test determinism in `NODE_ENV=test`. [Acceptance: tests for typical valid & invalid persisted payloads]
- WHEN rehydrate fails due to initialization order, THE SYSTEM SHALL defer and retry once. [Acceptance: tests simulate missing dependencies and ensure retry occurs]

Proposed module split
- `metaStorage.ts` (exports `createMetaStorage`, `hasExistingStorage`)
  - Purpose: isolate the JSON-storage wrapper that prefers `:meta` companion snapshot when appropriate. Keep all `localStorage` read/write policy here.

- `rehydrate.ts` (exports `handleRehydrate` and `RehydrateState`/`RehydrateDeps` types)
  - Purpose: move the main rehydration flow (validation, applyRehydrate, deferred retry logic, post-frame safety net) here. Keep dependency injection explicit via `deps` parameter.

- `validators.ts` (or `safety.ts`) (exports `clampNumber`, `isDefaultPersisted`, input validators)
  - Purpose: extract small pure helpers used by both `metaStorage` and `rehydrate` for easier unit testing.

- `persistence.ts` (adapter)
  - Purpose: re-export the above functions to preserve existing `import { createMetaStorage, handleRehydrate } from './persistence'` usage.

Implementation plan (tasks)
1. Create `src/store/persistence/metaStorage.ts` and move `createMetaStorage` and `hasExistingStorage` logic into it. Add unit tests for `getItem`/`setItem` behavior (meta-preference and meta writes).
2. Create `src/store/persistence/validators.ts` for `clampNumber`, `isDefaultPersisted` and tests for their boundary cases.
3. Create `src/store/persistence/rehydrate.ts` and move `handleRehydrate` into it, keeping types and explicit `deps` signature. Add tests covering synchronous apply, deferred retry, and the post-rehydrate safety net behaviors.
4. Replace top-level `src/store/persistence.ts` with a thin adapter that re-exports the above.
5. Run full test suite and iterate until parity.

Testing plan
- Unit tests for `metaStorage` with a mock `localStorage` object.
- Unit tests for `validators` boundary/edge cases.
- Unit tests for `handleRehydrate` with mocked `useGameStore` and dependency functions to assert `setState` calls and safety-net behavior. Include test-case for `NODE_ENV='test'` to assert safety-net skipped.

Migration strategy
- Add new files and adapter re-export; keep import sites unchanged.
- Verify tests before removing any remaining code in adapter.

Acceptance criteria
- No consumer code changes required (adapter keeps previous exports).
- Unit tests for each new module exist and pass.
- Behaviors (rehydration, meta-snapshot preference) remain identical.

Risks & mitigations
- Risk: rehydration timing differences may appear when moving logic. Mitigate with tests and keep the same `setTimeout` behavior during extraction.
- Risk: accidental coupling with store internals. Mitigate by keeping `deps` explicit and using the `RehydrateDeps` interface.

Notes
- Keep the `meta` key naming policy unchanged to preserve cross-version compatibility.
- Prefer small, focused tests over large integration-only tests for rehydrate flows.