# Bolt's Journal

## 2024-05-23 - InstancedMesh Indexing Optimization
**Learning:** `InstancedMesh` updates in a high-frequency loop (`useFrame`) can be severely impacted by unnecessary `Map`/`Set` allocations and O(N) operations. When visual instances are identical, strict ID-to-Index mapping is unnecessary and can be replaced with direct array indexing (O(1) assignment).
**Action:** Always question if stable indexing is required for instanced rendering. If instances are visually identical, use `Math.min(count, max)` and direct array access to avoid overhead and simplify logic.
