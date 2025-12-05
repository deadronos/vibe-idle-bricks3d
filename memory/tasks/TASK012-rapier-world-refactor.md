# TASK012 - Rapier World Refactor (DESIGN010)

 **Status:** Pending
**Added:** 2025-12-05
**Updated:** 2025-12-05

## Original Request

Create a task for DESIGN010 — Refactor `src/engine/rapier/rapierWorld.ts` into focused, testable modules: `runtime-probes`, `body-management`, `contact-parsing`, `overlap-detector`, and a thin adapter in `rapierWorld.ts` that preserves the public API and behavior.

## Thought Process

- `rapierWorld.ts` currently couples module probing, shape translations, handle mapping, and contact parsing heuristics. This increases cognitive load and makes testing harder.
- DESIGN010 proposes a refactor-by-extraction approach: split concerns into smaller modules and provide a thin adapter to preserve the `RapierWorld` surface shape until consumers are validated.
- The main objective is parity: behavior and public signals (notably `drainContactEvents`) must remain compatible while unit- and integration-tests document parity.
- Risks include subtle heuristic regressions and circular dependencies; mitigate via focused unit tests and an adapter that composes modules via factory functions.

## Implementation Plan

1. Create `src/engine/rapier/runtime-probes.ts`. Move probe helpers and normalization logic (safe accessors, `maybeHandle`) here and export typed helpers.
2. Create `src/engine/rapier/body-management.ts`. Implement a `createBodyManager()` factory that encapsulates `ballBodies`/`brickBodies` maps and provides `addBall/removeBall/addBrick/removeBrick/getBallStates` API and any safe read helpers. Export internal maps for unit tests only.
3. Create `src/engine/rapier/contact-parsing.ts`. Move the `tryCollect` logic and parsing heuristics here; expose `parseRuntimeEvents(runtimeAny, handleToEntity)` to convert runtime outputs into `ContactEvent[]`.
4. Create `src/engine/rapier/overlap-detector.ts`. Implement geometric fallback contact detection that iterates `ballStates` and brick shapes, emitting deterministic `ContactEvent[]` output.
5. Replace `src/engine/rapier/rapierWorld.ts` body with a thin adapter that composes the above modules and preserves the public `createWorld` shape and exported helpers. Aim for a runtime parity shim - tests validate behavior.
6. Add unit tests under `test/rapier/` for the extracted modules: `runtime-probes.test.ts`, `body-management.test.ts`, `contact-parsing.test.ts`, and `overlap-detector.test.ts`.
7. Add integration tests for `createWorld` to assert parity of `drainContactEvents()` and `getBallStates()` pre- and post-refactor. Include test vectors for common Rapier runtime shapes.
8. Run `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run build`, iterating until parity and CI pass.

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID  | Description                                                      | Status     | Updated    | Notes |
| --- | ---------------------------------------------------------------- | ---------- | ---------- | ----- |
| 1.1 | Create `runtime-probes.ts` with probe helpers                     | Not Started | 2025-12-05 |       |
| 2.1 | Implement `createBodyManager()` and boundary-safe accessors       | Not Started | 2025-12-05 |       |
| 3.1 | Implement `contact-parsing.ts` and parsing heuristics             | Not Started | 2025-12-05 |       |
| 4.1 | Implement `overlap-detector.ts` geometric fallback                | Not Started | 2025-12-05 |       |
| 5.1 | Replace `rapierWorld.ts` with an adapter that composes modules    | Not Started | 2025-12-05 |       |
| 6.1 | Add unit tests for each module                                    | Not Started | 2025-12-05 |       |
| 7.1 | Add integration tests for parity of `drainContactEvents()`        | Not Started | 2025-12-05 |       |
| 8.1 | Run validation suite and CI updates                               | Not Started | 2025-12-05 |       |

## Progress Log

### 2025-12-05

- Task created to track DESIGN010: Rapier World Refactor. Pending shift from monolithic `rapierWorld.ts` to a small set of focused modules plus a thin adapter to preserve API and runtime parity.

---

**References:**

- Design doc: [DESIGN010 — Rapier World Refactor](../designs/DESIGN010-rapier-world-refactor.md)

