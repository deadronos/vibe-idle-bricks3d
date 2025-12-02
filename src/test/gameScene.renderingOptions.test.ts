import { describe, expect, it } from 'vitest';
import { getRenderingOptions } from '../components/GameScene.utils';
import type { GameSettings } from '../store/types';

describe('getRenderingOptions', () => {
  it('returns low defaults for low quality', () => {
    const settings = { 
      graphicsQuality: 'low',
      enableBloom: true,
      enableShadows: true,
      enableParticles: true,
    } as Partial<GameSettings>;
    const opts = getRenderingOptions(settings);
    expect(opts.computedQuality).toBe('low');
    expect(opts.shadowSize).toBe(512);
    expect(opts.particleCount).toBe(0);
    expect(opts.bloomIntensity).toBe(0);
    expect(opts.pixelRatio).toBe(0.75);
  });

  it('returns medium defaults for medium quality', () => {
    const settings = { 
      graphicsQuality: 'medium',
      enableBloom: true,
      enableShadows: true,
      enableParticles: true,
    } as Partial<GameSettings>;
    const opts = getRenderingOptions(settings);
    expect(opts.computedQuality).toBe('medium');
    expect(opts.shadowSize).toBe(1024);
    expect(opts.particleCount).toBe(200);
    expect(opts.bloomIntensity).toBe(0.8);
    expect(opts.pixelRatio).toBe(1);
  });

  it('returns high defaults for high quality', () => {
    const settings = { 
      graphicsQuality: 'high',
      enableBloom: true,
      enableShadows: true,
      enableParticles: true,
    } as Partial<GameSettings>;
    const opts = getRenderingOptions(settings);
    expect(opts.computedQuality).toBe('high');
    expect(opts.shadowSize).toBe(2048);
    expect(opts.particleCount).toBe(1000);
    expect(opts.bloomIntensity).toBe(1.5);
    // In JSDOM environment dpr may be 1
    expect(opts.pixelRatio).toBeGreaterThanOrEqual(1);
  });

  it('auto fallback uses device pixel ratio for high when shadows enabled', () => {
    // Simulate device pixel ratio environment
    const prev = (globalThis as unknown as { devicePixelRatio?: number }).devicePixelRatio;
    try {
      (globalThis as unknown as { devicePixelRatio?: number }).devicePixelRatio = 2;
      const settings = { 
        graphicsQuality: 'auto',
        enableBloom: true,
        enableShadows: true,
        enableParticles: true,
      } as Partial<GameSettings>;
      const opts = getRenderingOptions(settings);
      expect(opts.computedQuality).toBe('high');
      expect(opts.shadowSize).toBe(2048);
      expect(opts.pixelRatio).toBe(2);
    } finally {
      (globalThis as unknown as { devicePixelRatio?: number }).devicePixelRatio = prev;
    }
  });
});
