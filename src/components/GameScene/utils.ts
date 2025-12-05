import type { GameSettings } from '../../store/types';

/**
 * Computes rendering parameters based on game settings and device capabilities.
 * Determines shadow resolution, particle count, bloom intensity, and pixel ratio.
 *
 * @param {Partial<GameSettings> | undefined} settings - The current game settings.
 * @returns {Object} Computed rendering options.
 */
export function getRenderingOptions(settings: Partial<GameSettings> | undefined) {
  const quality = settings?.graphicsQuality ?? 'auto';
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
  const computedQuality = ((): 'low' | 'medium' | 'high' => {
    if (quality === 'auto') {
      if (!settings?.enableShadows) return 'low';
      return dpr >= 2 ? 'high' : 'medium';
    }
    return quality as 'low' | 'medium' | 'high';
  })();

  const shadowSize = computedQuality === 'high' ? 2048 : computedQuality === 'medium' ? 1024 : 512;
  const particleCount = settings?.enableParticles
    ? computedQuality === 'high'
      ? 1000
      : computedQuality === 'medium'
        ? 200
        : 0
    : 0;
  const bloomIntensity = settings?.enableBloom
    ? computedQuality === 'high'
      ? 1.5
      : computedQuality === 'medium'
        ? 0.8
        : 0.0
    : 0.0;
  const pixelRatio = computedQuality === 'low' ? 0.75 : computedQuality === 'medium' ? 1.0 : Math.min(dpr, 2);
  return { computedQuality, shadowSize, particleCount, bloomIntensity, pixelRatio };
}

export default getRenderingOptions;
