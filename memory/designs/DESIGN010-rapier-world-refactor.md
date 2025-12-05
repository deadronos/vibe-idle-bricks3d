# DESIGN010 — Rapier World Refactor

**Status:** Proposed  
**Date:** 2025-12-05

Summary
- `src/engine/rapier/rapierWorld.ts` mixes multiple responsibilities: runtime probing (many Rapier build shapes), body lifecycle & handle mapping, complex contact-event parsing heuristics, and a geometric overlap fallback. This makes the file long and harder to test. We will split into focused modules and keep a thin adapter for compatibility.

Requirements (EARS)
- WHEN a Rapier runtime is created, THE SYSTEM SHALL provide a stable `RapierWorld` wrapper that exposes `addBall`, `removeBall`, `addBrick`, `removeBrick`, `step`, `drainContactEvents`, `getBallStates`, and optional impulse/torque helpers. [Acceptance: unit/integration tests exercise wrapper surface and behaviors remain unchanged]
- WHEN runtime event APIs vary across builds, THE SYSTEM SHALL normalize and parse contact events into `ContactEvent[]` (ball-brick contacts) for consumers. [Acceptance: test vectors for common runtime shapes map to identical `ContactEvent` outputs]
- WHEN runtime contact events are not available, THE SYSTEM SHALL fall back to a deterministic geometric overlap detector producing comparable contact info. [Acceptance: overlap fallback tests produce expected contact hits for contrived positions]

Proposed module split
- `runtime-probes.ts`
  - Responsibilities: probe/normalize Rapier module & world shapes, small helper utilities for `maybeHandle`, safe accessors, and export `RapierModule`/`RapierWorldRuntime` typed helpers.
  - Exports: `probeRapierModule()`, lightweight helpers used by other modules.

- `body-management.ts`
  - Responsibilities: manage `ballBodies` and `brickBodies` maps, add/remove/update logic and handle -> entity mapping (encapsulates `maybeHandle` usage). Provide `addBall`, `removeBall`, `addBrick`, `removeBrick`, and `getBallStates` helpers that read translations/linvel safely and normalize shapes.
  - Exports: `createBodyManager()` factory that returns the above functions and internal maps (for testing).

- `contact-parsing.ts`
  - Responsibilities: extract and normalize contact events from runtime-provided event sources (the `tryCollect` logic and heuristics). Convert raw runtime events into the internal `ContactEvent` shape.
  - Exports: `parseRuntimeEvents(runtimeAny, handleToEntity): ContactEvent[]`

- `overlap-detector.ts`
  - Responsibilities: geometric fallback used by `drainContactEvents` when parsing fails — iterates ball states and brick shapes to detect overlaps and compute contact point/normal/impulse heuristics.
  - Exports: `detectOverlaps(ballStates, brickMap): ContactEvent[]`

- `rapierWorld.ts` (adapter)
  - Responsibilities: compose the modules above into a single `createWorld(rapierParam, gravity)` as currently exported. Keep the public `RapierWorld` shape unchanged so higher-level code (e.g., `RapierPhysicsSystem`) does not need immediate edits.
  - Implementation note: minimize logic here; delegate to modules.

API & Types (no public-change policy)
- Keep exported `RapierWorld` interface and `ContactEvent`, `BallState` shapes as-is.
- New internal helper types may be added but adapter preserves public contract.

Implementation plan (tasks)
1. Create `src/engine/rapier/runtime-probes.ts` and move small probe helpers and `maybeHandle` logic.
2. Create `src/engine/rapier/body-management.ts` and move add/remove logic and `getBallStates` implementation, but export them as testable units.
3. Create `src/engine/rapier/contact-parsing.ts` and move the `tryCollect`/conversion logic with targeted unit tests for different runtime shapes.
4. Create `src/engine/rapier/overlap-detector.ts` and port the geometric fallback code.
5. Replace the body of `src/engine/rapier/rapierWorld.ts` with a thin adapter that composes above modules and exports the existing `createWorld` implementation surface.
6. Add unit tests under `test/rapier/` for each module and an integration test for `createWorld` to verify behavior parity.
7. Run full test suite and iterate until behavior matches (no behavior changes allowed).

Testing plan
- Unit-tests: supply fake runtime objects to `contact-parsing` to assert expected `ContactEvent[]` outputs (cover the candidate shapes: function-return-array, object-with-drain/drainEvents/getContactEvents, tuple-like arrays, and handle-containing objects).
- Body-manager tests: addBall/removeBall roundtrips and `getBallStates` normalization for different body shapes.
- Overlap-detector: synthetic ball/brick positions verifying hits and normals.
- Integration: createWorld with a mocked Rapier module and assert `drainContactEvents()` behavior matches pre-refactor outputs for the same inputs.

Migration strategy
- Step 1: add new modules and export them privately; do not change any imports elsewhere.
- Step 2: convert `rapierWorld.ts` to the adapter that composes the new modules. Keep its file path and public exports unchanged.
- Step 3: add / update tests and CI; once green, (optional) split implementation into files as final cleanup.

Acceptance criteria
- All existing tests pass unchanged.
- No change in runtime observable `ContactEvent[]` outputs for the covered test vectors.
- Code is modular: each file is <~300 LOC and has focused unit tests.

Risks & mitigations
- Risk: subtle behavior changes in heuristics. Mitigate by broad unit tests and test vectors copied from current runtime outputs.
- Risk: circular dependencies. Mitigate with small adapter and factory functions (pass dependencies explicitly to avoid global singletons).

Notes
- Keep adapter minimal to avoid regressions; prefer refactor-by-extraction followed by tests rather than rewrite-in-place.