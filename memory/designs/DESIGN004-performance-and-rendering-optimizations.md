# DESIGN004 — Performance & Rendering Optimizations

Date: 2025-12-01
Author: GitHub Copilot (working on behalf of repo maintainers)

Summary
-------
This design consolidates the hotspot analysis and proposes concrete, incremental changes to improve runtime performance and rendering efficiency. The main targets are:

- Physics loop (O(balls * bricks))
- High draw-count background generation
- Particle pool per-frame overhead
- Ball rendering + per-frame state churn in React
- Collision math inefficiencies and per-brick per-frame hooks

Goals
-----
- Reduce per-frame CPU cost of collision detection so checks scale near-linearly with active balls and constant-ish w.r.t. bricks.
- Reduce draw calls and GC/React churn from high-count background and ball rendering.
- Keep changes incremental, testable, and reversible.

Requirements (EARS-style)
------------------------
1. WHEN many balls are active (>= 10), THE SYSTEM SHALL limit collision candidate checks per ball to a small local subset of bricks (acceptance: average candidate list <= 20 bricks on test harness).

2. WHEN rendering background scenery, THE SYSTEM SHALL reduce the number of draw calls by merging repetitive geometry (acceptance: draw calls for background < 6 on desktop test scene).

3. WHEN particles are emitted, THE SYSTEM SHALL update only active particles each frame and minimize instance attribute writes (acceptance: particle update time reduced >= 60% vs current baseline for 1000-pool).

4. WHEN updating ball positions each frame, THE SYSTEM SHALL avoid causing a full React re-render of the ball list (acceptance: UI React re-renders per frame are near-zero for position-only updates).

5. WHEN evaluating brick collisions, THE SYSTEM SHALL avoid unnecessary math (acceptance: remove Math.sqrt from inner loop and demonstrate reduced CPU per-collision check in unit tests).

Design Overview — Changes
-------------------------
1. Spatial-hash broad-phase for bricks (recommended first change)
2. Instanced/merged background (batch building blocks into InstancedMesh or baked texture)
3. ParticleSystem: active-index pool + `mesh.count` + batched attribute updates (or Points shader)
4. Ball rendering: replace per-ball React components with `BallsInstanced` (InstancedMesh) or an imperative BallRenderer that updates meshes from store without re-rendering React
5. Collision math micro-optimizations (squared distance) and remove per-brick `useFrame` hooks
6. Small improvements: map brickId→index for O(1) hover lookup in `useInstancedBricks`

Design Details
--------------
1) Spatial-hash grid (engine/spatialHash.ts)
- Purpose: reduce candidate bricks checked per-ball by indexing bricks into 3D grid cells.
- Data structure:
  - cellSize: number (configurable; suggested default: average BRICK_SIZE magnitude * 1.5)
  - buckets: Map<string, number[]> where key = `${cx}_${cy}_${cz}`, value = list of brick indices (or ids)
- API (suggested):
  - createSpatialHash(cellSize?: number)
  - indexBricks(bricks: Brick[]): void
  - queryNearby(pos: [x,y,z], radius?: number): Brick[] // returns unique bricks from cell + neighbors
  - updateBrick(index: number, brick: Brick): void // optional incremental path
  - clear(): void

- Indexing algorithm (pseudocode):
```
function keyForPos(x, y, z) {
  return `${Math.floor(x/cellSize)}_${Math.floor(y/cellSize)}_${Math.floor(z/cellSize)}`;
}
for each brick (i):
  const k = keyForPos(brick.position[0], brick.position[1], brick.position[2])
  buckets[k].push(i)
```
- Query: compute cell of ball position and include neighbor offsets [-1,0,1] for each axis (3x3x3 = 27 cells). Deduplicate indices and return brick objects for those indices.

- Integration options:
  A) Change `stepBallFrame` signature to accept an optional `SpatialHash` instance and a `bricks` array; `stepBallFrame` will call spatialHash.queryNearby(nextPosition) and only resolve collisions against that subset.
  B) Keep `stepBallFrame` unchanged but have `FrameManager` call `spatialHash.queryNearby(nextPosition)` and pass subset to `stepBallFrame` as `bricksSubset` (preferred minimal change).

- Complexity: reduce checks from O(balls * bricks) → O(balls * k) where k ≈ expected bricks per local volume.

2) Ball renderer: InstancedMesh (`src/components/BallsInstanced.tsx`)
- Motivation: mapping `balls.map(...)` to separate React components causes per-frame reconciliation when `balls` array is replaced.
- Design:
  - New `BallsInstanced` component owns an `InstancedMesh` with count = max expected balls (or dynamic via mesh.count).
  - `FrameManager` will no longer call `useGameStore.setState({ balls: nextBalls })` every frame. Instead, it will update store's canonical ball state less frequently (or keep ball metadata separate) and update instance matrices imperatively.
  - Option: keep the canonical `balls` in state but only mutate their fields in-place (not reassign array) and avoid selectors that cause re-render; or subscribe imperatively in `BallsInstanced` using `useGameStore.subscribe` and update matrices in `useFrame`.

- Minimal migration: create `BallsInstanced` that does:
  - `useEffect` subscribe to store additions/removals to set `mesh.count` and map ballId -> instanceIndex
  - `useFrame` reads the current `useGameStore.getState().balls` shallow and updates instance matrices by `setMatrixAt` and then `instanceMatrix.needsUpdate = true`.

3) Background: instance/merge tiles
- `GeometricBackground` currently creates many React nodes and calls `new THREE.BoxGeometry` in `useMemo` for some items but uses many `BuildingBlockMesh` entries. Replace with 1–2 `InstancedMesh` calls: one for dark boxes, one for neon edges (or convert neon edges to shader effect or lineSegments instancing). Hoist common `BoxGeometry` and `EdgesGeometry` to module scope.

4) Particle system improvements
- Maintain `activeIndices: number[]` or a circular pool index.
- On emission: pop N indices from inactive pool and push to activeIndices.
- In `useFrame`: iterate only `activeIndices`, update matrices/colors for those indices and if particle expires, push its index back to inactive pool.
- Set `mesh.count = activeCount`; only call `instanceMatrix.needsUpdate` when activeCount > 0. Avoid calling `instanceColor.needsUpdate` if colors unchanged; batch color updates into a single TypedArray and update the BufferAttribute.
- Consider swapping to `Points` with a small shader if visuals allow.

5) Collision math micro-optimizations
- Replace sqrt with squared-distance compare:
```
const distSq = distX*distX + distY*distY + distZ*distZ;
if (distSq >= target.radius * target.radius) return { hit: false };
```
- This avoids costly `Math.sqrt` per candidate.

6) `useInstancedBricks` micro-optimizations
- Build `idToIndex` Map in `useLayoutEffect` so hover/clear operations use O(1) lookup instead of `findIndex`.
- When bricks array changes, recompute map and reuse Matrix/Color updates as currently done.

Migration Plan & Tasks (phased)
-------------------------------
Phase A — Low-risk, high-value (1–2 days)
- TASK A1: Add `src/engine/spatialHash.ts` with basic API + unit tests.
- TASK A2: Modify `FrameManager` to construct spatialHash (index bricks on wave/regenerate) and query per-ball nearby bricks; pass subset to `stepBallFrame`.
- TASK A3: Replace `resolveBrickCollision` inner sqrt with squared-distance approach and add unit test.

Phase B — Rendering & state churn (2–3 days)
- TASK B1: Implement `src/components/BallsInstanced.tsx` and a small adapter to subscribe to store and update instance matrices imperatively.
- TASK B2: Replace `balls.map(<Ball />)` in `GameContent` with `<BallsInstanced />` and remove per-frame setState for balls positions; keep store as authoritative but update minimal metadata only.
- TASK B3: Add tests + performance harness to measure FPS/CPU before/after.

Phase C — Effects & background (2–4 days)
- TASK C1: Refactor `GeometricBackground` to use instanced meshes for building walls and floating boxes (or bake to GLB/texture if acceptable).
- TASK C2: Refactor `ParticleSystem` to active-index pool and `mesh.count` logic; optionally add Points-based fall-back.
- TASK C3: Optimize `useInstancedBricks` with `idToIndex` map and review pointer hit logic.

Phase D — Clean-up (1 day)
- TASK D1: Remove or archive unused per-brick `Brick.tsx` or re-purpose it for editor/debug modes.
- TASK D2: Update documentation and add acceptance/perf tests.

Estimates are coarse and assume one developer familiar with R3F and Three.js.

Acceptance Criteria & Benchmarks
-------------------------------
- Physics: collision candidate checks per ball <= 20 on standard test scenes (compare via instrumentation).
- Rendering: background draw calls <= 6 (desktop test scene) and frame time reduced at least 30% in visible scenes.
- Particle system: per-frame particle update CPU reduced >= 60% for MAX_PARTICLES=1000.
- Ball rendering: no React re-renders caused by every-frame ball position changes (verify with React profiler).
- Regression tests (existing perf harness) still pass; new perf assertions added to `src/test/perf/*`.

Testing Plan
------------
- Unit tests for `spatialHash` correctness and for `resolveBrickCollision` squared-distance behavior.
- Add a performance harness (existing `src/test/perf/performance.harness.test.ts`) measurement variations:
  - baseline scenario (current master)
  - changed configuration (e.g., many balls, many bricks)
  - assert that mean frame time improves by X% (configurable threshold)
- Manual validation in a dev build verifying visual parity.

Risks & Mitigation
------------------
- Risk: Slight change in collision candidates could change gameplay feel. Mitigation: Keep `spatialHash` cellSize configurable and test with small cell sizes; fall back to brute-force for debug build.
- Risk: Visual differences from switching particle rendering to Points or merging geometry. Mitigation: preserve material properties and provide fallbacks (toggle in settings).
- Risk: Large refactor touches many files. Mitigation: do small, test-backed commits; run perf tests after each phase.

Files to Add / Modify
---------------------
- Add: `src/engine/spatialHash.ts` (spatial partitioning implementation)
- Modify: `src/engine/collision.ts` / `src/engine/collision/math.ts` (squared-distance)
- Modify: `src/engine/FrameManager.tsx` (use spatial hash + avoid setState churn)
- Add: `src/components/BallsInstanced.tsx` (instanced ball renderer)
- Modify: `src/components/GameScene.tsx` to use `BallsInstanced`
- Modify: `src/components/GeometricBackground.tsx` (instancing)
- Modify: `src/components/effects/ParticleSystem.tsx` (active pool)
- Modify: `src/components/bricks/useInstancedBricks.ts` to add id→index Map
- Add tests in `src/test/perf/*` and unit tests for `spatialHash`

Next Steps (recommended order)
-----------------------------
1. Implement `spatialHash` and integrate into `FrameManager` (largest perf win).  
2. Replace ball rendering with `BallsInstanced` (remove React churn).  
3. Optimize `ParticleSystem` and `GeometricBackground` (visual + draw call wins).  
4. Polish, add tests, tune cellSize and instance parameters.

Appendix — Example: squared-distance change for `resolveBrickCollision`
```
-  const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);
-  if (distance >= target.radius) { return { hit: false }; }
+  const distSq = distX*distX + distY*distY + distZ*distZ;
+  if (distSq >= target.radius*target.radius) { return { hit: false }; }
```

Decision log and traceability
-----------------------------
- This design references the hotspot analysis produced on 2025-12-01 and focuses on producing measurable perf improvements with minimal visual regression. Each code change will include a small decision note in the PR describing trade-offs and test results.

If you'd like, I can now:
- implement a working `spatialHash` prototype and a unit test, or
- implement `BallsInstanced` and swap the current ball rendering as a second step.

Pick which implementation to start and I'll open a small PR-style patch with focused changes.