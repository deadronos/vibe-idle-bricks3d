# Test Suite Analysis & Improvement Opportunities

**Date:** 2025-11-30

## Executive Summary

The test suite is **comprehensive and well-structured** (116 tests, all passing). However, there are **significant gaps in rehydration/persistence testing** and several **edge cases that should be covered**. This document identifies improvements and proposes additions.

---

## Current Test Coverage

### ✅ Well-Covered Areas

1. **Initial State & Validation** (8 tests)
   - Default values, initial bricks, initial balls

2. **Ball Management** (16 tests)
   - Spawn, remove, position/velocity updates

3. **Brick Management** (13 tests)
   - Damage, removal, regeneration

4. **Upgrade System** (22 tests)
   - Cost calculations, damage/speed/count upgrades
   - Score deduction, state immutability

5. **Progression** (7 tests)
   - Wave advancement, achievement unlocks

6. **Integration Tests** (3 tests)
   - Game session simulation, state consistency, brick cycle

7. **Edge Cases** (5 tests)
   - Zero bricks/balls, high scores, rapid updates, consistency

## ❌ Critical Gaps Identified

### 1. **Rehydration Logic NOT Fully Tested** ⚠️

**Current:** Only 2 rehydration tests

- `should persist meta progression and rebuild runtime entities on hydrate`
- `should restore correct number of balls after reloading with 8+ purchased balls (regression test)`

**Missing:**

#### Ball Spawn Queue Tests

- [ ] Queue initialization on rehydration
- [ ] `forceProcessAllQueuedBalls()` spawns correct number
- [ ] `tryProcessBallSpawnQueue()` respects 500ms interval
- [ ] Queue processes correctly over time (multiple frames)
- [ ] Ball stats (damage/speed) correct in queued balls

#### Stat Validation Tests (Post-Rehydration)

- [ ] Ball damage matches `ballDamage` setting
- [ ] Ball velocity magnitude matches `ballSpeed` setting
- [ ] Mismatched stats are automatically corrected
- [ ] Validation happens after rehydration completes

#### Storage Tests

- [ ] Entities (bricks/balls) NOT persisted to storage
- [ ] Only meta (score, wave, upgrades) persisted
- [ ] Meta snapshot fallback (`meta` key) works correctly
- [ ] Storage recovery handles corruption gracefully

### 2. **Edge Cases in Rehydration** ❌

- [ ] Rehydrate with `ballCount > 20` (max) - should clamp
- [ ] Rehydrate with `ballDamage = 0` or negative - should clamp to 1
- [ ] Rehydrate with `ballSpeed = 0` or negative - should clamp to 0.02
- [ ] Rehydrate with `wave = 0` - should default to 1
- [ ] Rehydrate with corrupt/missing meta values - should use defaults
- [ ] Rehydrate with invalid achievement IDs - should filter
- [ ] Rehydrate after browser storage wipe - should initialize

### 3. **Ball Spawn Timing** ❌

- [ ] Queue spawns exactly one ball per 500ms interval
- [ ] Multiple queued balls spawn at correct times
- [ ] Queue processing stops when empty
- [ ] Ball spawn doesn't interfere with physics loop

### 4. **Stat Propagation** ❌

- [ ] Spawned balls inherit current `ballDamage`
- [ ] Spawned balls inherit current `ballSpeed`
- [ ] Upgrades update all existing balls immediately
- [ ] Speed upgrade scales velocity correctly across all balls

### 5. **Pause State During Rehydration** ❌

- [ ] Game state preserved if paused during reload
- [ ] Pause flag survives rehydration

### 6. **Concurrent Operations** ❌

- [ ] Queue processing during upgrades
- [ ] Queue processing during damage/destruction
- [ ] Queue processing during wave regeneration

---

## Proposed Test Additions

### Category A: High Priority (Rehydration Core)

```typescript
describe('Rehydration - Ball Spawn Queue', () => {
  it('should initialize ballSpawnQueue to 0 on initial state', () => {
    // NEW
  });

  it('should queue correct number of balls on rehydration', () => {
    // e.g., ballCount=8 → queue 7 (1 initial + 7 queued)
  });

  it('should spawn queued balls one at a time every 500ms', () => {
    // Mock timer or use fake timers
  });

  it('should forceProcessAllQueuedBalls spawn all remaining balls', () => {
    // Already used in tests, but add explicit test
  });

  it('should process partial queue if time allows', () => {
    // Simulate 1 second elapsed = 1 ball spawned
  });
});

describe('Rehydration - Stat Validation', () => {
  it('should validate ballDamage matches all spawned balls', () => {
    // Ensure newly spawned balls have correct damage
  });

  it('should validate ballSpeed matches all spawned balls', () => {
    // Check velocity magnitude equals ballSpeed setting
  });

  it('should auto-correct balls with mismatched stats', () => {
    // If ball has wrong damage/speed, rebuild it
  });

  it('should log validation results post-rehydration', () => {
    // Check console output validates stats
  });
});

describe('Rehydration - Storage & Persistence', () => {
  it('should not persist ball entities to storage', () => {
    // Verify localStorage only contains meta
  });

  it('should not persist brick entities to storage', () => {
    // Verify localStorage only contains meta
  });

  it('should fallback to meta snapshot if primary corrupted', () => {
    // Simulate missing primary, meta exists
  });

  it('should rebuild bricks on rehydrate to match wave', () => {
    // After rehydrate wave=3, should have wave 3 bricks
  });
});
```

### Category B: Medium Priority (Edge Cases)

```typescript
describe('Rehydration - Value Clamping', () => {
  it('should clamp ballDamage >= 1', () => {
    // Rehydrate with ballDamage=0, should clamp to 1
  });

  it('should clamp ballSpeed >= 0.02', () => {
    // Rehydrate with ballSpeed=0, should clamp to 0.02
  });

  it('should clamp ballCount to [1, 20]', () => {
    // Test both bounds
  });

  it('should clamp wave >= 1', () => {
    // Rehydrate with wave=0, should become 1
  });

  it('should handle negative values gracefully', () => {
    // Negative score, damage, speed, etc.
  });
});

describe('Rehydration - Achievement Validation', () => {
  it('should filter invalid achievement IDs', () => {
    // Rehydrate with fake achievement ID, should remove
  });

  it('should re-evaluate achievements after rehydrate', () => {
    // If score already qualifies, should unlock on rehydrate
  });

  it('should not double-unlock achievements', () => {
    // Already unlocked, should stay unlocked once
  });
});

describe('Rehydration - Pause State', () => {
  it('should restore isPaused flag', () => {
    // Rehydrate with isPaused=true, should persist
  });

  it('should prevent physics while paused post-rehydrate', () => {
    // Paused state should be respected
  });
});
```

### Category C: Low Priority (Advanced Scenarios)

```typescript
describe('Rehydration - Concurrent Operations', () => {
  it('should queue balls while handling upgrades', () => {
    // Upgrade while queue processing
  });

  it('should handle wave regeneration during queue processing', () => {
    // Regenerate bricks while balls queued
  });

  it('should not lose queued balls on rapid upgrades', () => {
    // Multiple ball count upgrades in quick succession
  });
});

describe('Rehydration - Browser Storage Edge Cases', () => {
  it('should handle localStorage quota exceeded', () => {
    // Graceful degradation if storage full
  });

  it('should recover from corrupted JSON', () => {
    // Invalid JSON in localStorage
  });

  it('should initialize if storage completely wiped', () => {
    // No localStorage keys at all
  });
});

describe('Ball Spawn Queue - Timing', () => {
  it('should respect frame rate independence', () => {
    // Queue should use time-based interval, not frame count
  });

  it('should handle variable delta time', () => {
    // 60fps then 30fps then 60fps
  });

  it('should update lastBallSpawnTime on spawn', () => {
    // Verify timing state updated
  });
});
```

## Specific Issues Requiring Tests

### Issue 1: Stat Mismatch on Rehydrate

**Current:** Post-rehydration validation rebuilds mismatched balls, but no test verifies this.
**Test Needed:**

```typescript
it('should rebuild balls with mismatched stats', async () => {
  // Manually set balls with wrong damage/speed
  // Trigger rehydration
  // Verify rebuilt with correct stats
});
```

### Issue 2: Queue Timing Precision

**Current:** `tryProcessBallSpawnQueue()` uses `Date.now()`, but no test verifies the 500ms interval.
**Test Needed:**

```typescript
it('should spawn exactly one ball at 500ms intervals', () => {
  // Use vitest fake timers to advance time
  // Call tryProcessBallSpawnQueue() multiple times
  // Verify spawn timing
});
```

### Issue 3: Partial Queue Processing

**Current:** If 4 balls queued and 1 second passes, only 2 spawn. No test verifies this behavior.
**Test Needed:**

```typescript
it('should spawn one ball per 500ms, respecting queue size', () => {
  // Queue 4 balls
  // Advance 1.5 seconds → should spawn 3 balls
});
```

---

## Recommended Test Structure

Create new test files:

1. **`src/test/rehydration.test.ts`** (NEW)
   - All rehydration-specific tests
   - Ball spawn queue tests
   - Storage/persistence tests

2. **`src/test/edgeCases.test.ts`** (EXPAND)
   - Value clamping tests
   - Corrupt data recovery
   - Concurrent operations

3. **`src/test/timing.test.ts`** (NEW)
   - Ball spawn interval verification
   - Timer-based queue processing
   - Frame-rate independence

---

## Risk Assessment

**High Risk if Not Tested:**

- ⚠️ Ball spawn queue timing (could spawn 0 or 100 balls unexpectedly)
- ⚠️ Stat mismatch correction (could silently fail)
- ⚠️ Storage persistence (could lose progress)
- ⚠️ Achievement re-evaluation (could double-unlock or fail to unlock)

**Current Test Count:** 116 tests  
**Recommended Additions:** 40-60 tests  
**Estimated Coverage Improvement:** 60% → 85%+


