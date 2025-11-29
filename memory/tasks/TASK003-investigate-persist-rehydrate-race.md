# TASK003 - Investigate Persist/Rehydrate Race Causing Test Failure

**Status:** Pending  
**Added:** 2025-11-29  
**Updated:** 2025-11-29

## Original Request

Investigate a failing test related to persistence & rehydration: `should persist meta progression and rebuild runtime entities on hydrate`.

## Thought Process

The test expects rehydrate to restore a previously saved state after resetting the store to defaults. There's a potential race where resetting the store triggers a persistence write that overwrites localStorage before rehydrate reads it. Identify whether the test is flaky or if the store implementation behaves persistently in a deterministic way.

## Implementation Plan

1. Reproduce the failing test in isolation and determine the exact sequence of localStorage writes.  
2. Consider adding a `skipPersist` flag to `setState` calls used during testing to avoid writing default state to storage, or use a `rehydrate` helper that reads from a snapshot of localStorage before any default write occurs.  
3. Add a test for explicit rehydrate behavior and/or handle `rehydrate()` gracefully.
4. Validate the fix by running the tests and ensuring no regressions.

## Progress Tracking

**Overall Status:** Pending - 0%

### Subtasks

| ID  | Description                                              | Status      | Updated    | Notes |
| --- | -------------------------------------------------------- | ----------- | ---------- | ----- |
| 1.1 | Reproduce failing test in isolation                      | Pending     | 2025-11-29 |  |
| 2.1 | Evaluate fix options (skip writes in test; rehydrate helper) | Pending     | 2025-11-29 |  |
| 3.1 | Implement minimal fix with tests                         | Pending     | 2025-11-29 |  |

## Progress Log

### 2025-11-29

- Task created to track investigation of the persist/rehydrate test failure.
