/*
 * Lightweight dynamic initializer for @dimforge/rapier3d-compat.
 * The compat package sometimes exposes an initializer (default export)
 * or a namespace directly; handle both shapes and cache the result.
 */

/**
 * Type alias for the loaded Rapier module.
 */
export type RapierModule = unknown;

let cached: RapierModule | null = null;

/**
 * Initializes the Rapier physics engine.
 * Handles dynamic imports and WASM initialization.
 * Supports both browser and Node.js environments.
 *
 * @returns {Promise<RapierModule>} A promise resolving to the initialized Rapier module.
 * @throws {Error} If initialization fails.
 */
export async function initRapier(): Promise<RapierModule> {
  if (cached) return cached;

  try {
    // Dynamic import so bundlers can handle the WASM asset
    const mod = await import('@dimforge/rapier3d-compat');

    // The compat entry sometimes exports an initializer function
    const initializer: unknown =
      typeof mod === 'function'
        ? mod
        : ((mod as { default?: unknown; init?: unknown }).default ??
          (mod as { default?: unknown; init?: unknown }).init);

    // Log which shape was imported so consumers can observe WASM vs fallback behavior
    try {
      if (typeof console !== 'undefined' && typeof console.info === 'function') {
        console.info('[rapier] @dimforge/rapier3d-compat imported', {
          modType: typeof mod,
          hasInitializer: typeof initializer === 'function',
        });
      }
    } catch {
      /* ignore logging failures */
    }

    if (typeof initializer === 'function') {
      const initFn = initializer as (...args: unknown[]) => Promise<unknown> | unknown;
      try {
        if (typeof console !== 'undefined' && typeof console.info === 'function') {
          console.info('[rapier] initializer detected; invoking initializer');
        }
      } catch {
        /* ignore logging failures */
      }

      // Call initializer if available — some builds return the runtime namespace
      // while others populate the module and return undefined.
      // When running under Node (tests/CI), provide a locateFile helper so WASM
      // can be resolved from the package folder. In browsers bundlers generally
      // take care of WASM assets automatically.
      let maybe: unknown;
      try {
        const globalProc = globalThis as unknown as { process?: { versions?: { node?: unknown } } };
        if (
          typeof globalProc.process !== 'undefined' &&
          globalProc.process.versions &&
          globalProc.process.versions.node
        ) {
          // node environment — use createRequire to resolve the package-relative wasm path
          // Import dynamically so bundlers don't try to polyfill it.

          const { createRequire } = await import('module');
          const req = createRequire(import.meta.url);
          maybe = await initFn({
            locateFile: (f: string) => req.resolve(`@dimforge/rapier3d-compat/${f}`),
          });
        } else {
          maybe = await initializer();
        }
      } catch {
        // Retry without options if the above pattern isn't supported by this build
        maybe = await initFn();
      }

      // Log whether the initializer returned a runtime namespace or not
      try {
        if (typeof console !== 'undefined' && typeof console.info === 'function') {
          const returnedRuntime = typeof maybe !== 'undefined' && maybe !== null;
          console.info('[rapier] initializer result', { returnedRuntime });
        }
      } catch {
        /* ignore logging failures */
      }

      cached = (maybe ?? mod) as RapierModule;
    } else {
      try {
        if (typeof console !== 'undefined' && typeof console.info === 'function') {
          console.info('[rapier] no initializer exported; using module directly');
        }
      } catch {
        /* ignore logging failures */
      }

      cached = mod;
    }

    return cached;
  } catch (err) {
    cached = null;
    try {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('[rapier] initRapier failed', err);
      }
    } catch {
      /* ignore logging failures */
    }
    // Rethrow a helpful message so CI/consumers can see the failure
    throw new Error(`initRapier failed: ${(err as Error).message}`);
  }
}

/**
 * Resets the cached Rapier instance.
 * Useful for testing or re-initialization.
 */
export function resetRapier() {
  cached = null;
}
