import { describe, it, expect } from 'vitest';
import sabRuntime from '../engine/multithread/sabRuntime';

describe('sabRuntime availability', () => {
  it('reports availability and respects ensure()', () => {
    const avail = sabRuntime.available();
    const ensured = sabRuntime.ensure(64);

    // If Available is false (typical in CI), ensure should return false
    if (!avail) {
      expect(ensured).toBe(false);
    } else {
      // If available, ensure should initialize the runtime (best-effort)
      expect(ensured).toBe(true);
      // cleanup
      sabRuntime.destroy();
    }
  });

  it('initializes and destroys (ring mode)', () => {
    if (!sabRuntime.available()) return;

    const ok = sabRuntime.ensure(32, 2);
    expect(ok).toBe(true);
    expect(sabRuntime.isInitialized()).toBe(true);

    sabRuntime.destroy();
    expect(sabRuntime.isInitialized()).toBe(false);
  });
});
