# [TASK008] Rapier CI Smoke & Default Flip

**Status:** Pending  
**Added:** 2025-12-01  
**Updated:** 2025-12-01

## Original Request

Add a dedicated CI smoke job that validates Rapier can initialize (`initRapier()`), gate any PR that flips the default `useRapierPhysics` flag, and provide rollout/rollback guidance for flipping the default to `true`.

## Thought Process

Because WASM initialization can fail on CI or specific platforms, we must gate the default flip behind a small, targeted smoke job that exercises `initRapier()` and a minimal world creation. The smoke job should run quickly and fail fast; if it fails, the default-flip PR must be blocked until resolved. For broader CI stability, allow a temporary `RAPIER=false` env override to continue other tests while the problem is diagnosed.

## Implementation Plan

- Add a CI job (name: `rapier-init-smoke`) that runs a small script or Vitest test which calls `initRapier()` and `createWorld()` and exits non-zero on failure.
- Make the default-flip PR pipeline require the `rapier-init-smoke` job to pass before merging.
- Add documentation to the repo `CONTRIBUTING.md` / PR checklist explaining the gating requirement.
- Provide a rollback path: env override `RAPIER=false` and a short guide for maintainers to revert the default quickly.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID  | Description                                            | Status        | Updated    | Notes |
| --- | ------------------------------------------------------ | ------------- | ---------- | ----- |
| 4.1 | Create `rapier-init-smoke` CI job                       | Not Started   | 2025-12-01 | CI config depending on provider |
| 4.2 | Add minimal Vitest smoke test (`src/test/rapier.smoke.test.ts`) | Not Started   | 2025-12-01 | Should be quick to run |
| 4.3 | Update PR checklist / CONTRIBUTING.md                   | Not Started   | 2025-12-01 | Document gating policy |

## Progress Log

### 2025-12-01

- Task created; CI provider details required to implement job (circleci/github-actions/gitlab). Will coordinate when ready.

---
