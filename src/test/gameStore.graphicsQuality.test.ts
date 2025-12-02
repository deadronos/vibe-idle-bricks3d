import { buildInitialState } from '../..//src/store/gameStore';

describe('buildInitialState — graphicsQuality defaults', () => {
  const originalHardwareConcurrency = (globalThis.navigator as unknown as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  const originalDeviceMemory = (globalThis.navigator as unknown as Navigator & { deviceMemory?: number }).deviceMemory;
  const originalInnerWidth = (globalThis as unknown as Window & { innerWidth?: number }).innerWidth;

  afterEach(() => {
    // restore properties
    try {
      if (typeof originalHardwareConcurrency !== 'undefined') Object.defineProperty(globalThis.navigator, 'hardwareConcurrency', { value: originalHardwareConcurrency, configurable: true });
      if (typeof originalDeviceMemory !== 'undefined') Object.defineProperty(globalThis.navigator, 'deviceMemory', { value: originalDeviceMemory, configurable: true });
      if (typeof originalInnerWidth !== 'undefined') Object.defineProperty(globalThis, 'innerWidth', { value: originalInnerWidth, configurable: true });
    } catch {
      // ignore modifications in test environment
    }
  });

  test('returns low-quality defaults on low power device', () => {
    Object.defineProperty(globalThis.navigator, 'hardwareConcurrency', { value: 1, configurable: true });
    Object.defineProperty(globalThis.navigator, 'deviceMemory', { value: 2, configurable: true });
    Object.defineProperty(globalThis, 'innerWidth', { value: 375, configurable: true });

    const state = buildInitialState();

    expect(state.settings.graphicsQuality).toBe('auto');
    expect(state.settings.enableBloom).toBe(false);
    expect(state.settings.enableShadows).toBe(false);
    expect(state.settings.enableParticles).toBe(false);
    expect(state.settings.compactHudEnabled).toBe(true);
  });

  test('returns high-quality defaults on high power device', () => {
    Object.defineProperty(globalThis.navigator, 'hardwareConcurrency', { value: 8, configurable: true });
    Object.defineProperty(globalThis.navigator, 'deviceMemory', { value: 8, configurable: true });
    Object.defineProperty(globalThis, 'innerWidth', { value: 1366, configurable: true });

    const state = buildInitialState();

    expect(state.settings.graphicsQuality).toBe('auto');
    expect(state.settings.enableBloom).toBe(true);
    expect(state.settings.enableShadows).toBe(true);
    expect(state.settings.enableParticles).toBe(true);
    expect(state.settings.compactHudEnabled).toBe(false);
  });
});
