# [TASK008] Rapier CI Smoke & Default Flip

**Status:** Completed  
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

**Overall Status:** Completed - 100%

### Subtasks

| ID  | Description                                            | Status        | Updated    | Notes |
| --- | ------------------------------------------------------ | ------------- | ---------- | ----- |
| 4.1 | Create `rapier-init-smoke` CI job                       | Completed     | 2025-12-01 | GitHub Actions workflow added |
| 4.2 | Add minimal Vitest smoke test (`src/test/rapier.smoke.test.ts`) | Completed     | 2025-12-01 | Fast smoke test added |
| 4.3 | Update PR checklist / CONTRIBUTING.md                   | Completed     | 2025-12-01 | CONTRIBUTING note added and README updated |

## Progress Log

### 2025-12-01

- Added `src/test/rapier.smoke.test.ts` — CI-facing smoke test verifying `initRapier()` and `createWorld()` succeed.
- Added GitHub Actions workflow `.github/workflows/rapier-init-smoke.yml` which runs the smoke test and fails fast on init errors.
- Added `test:rapier-smoke` npm script for local smoke testing.
  
Notes: The smoke job is gated by CI — PRs that flip `useRapierPhysics` default to `true` should require this smoke job to pass. A temporary override `RAPIER=false` can be used in CI environment variables to bypass the smoke test when diagnosing platform-specific WASM issues.

---
