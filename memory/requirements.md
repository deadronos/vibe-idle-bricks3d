# Requirements Log

## 2025-11-30 — TASK002 Performance Polish

1. **WHEN** a pointer hover targets an instanced brick, **THEN** the renderer **SHALL** update only that instance's color highlight without re-running full batch updates [Acceptance: inspect pointer move handlers to ensure only targeted indices trigger `setColorAt`].
2. **WHEN** a hover leaves the instanced mesh or targets a different brick, **THEN** the renderer **SHALL** restore the previously highlighted instance to its damage-based color within the same frame [Acceptance: manual hover confirms no stuck highlights].
3. **WHEN** UI logic needs to resolve an `instanceId` from picking, **THEN** the helper **SHALL** return the matching brick or `null` for invalid ids [Acceptance: `tests/e2e/picking.spec.ts` passes].
