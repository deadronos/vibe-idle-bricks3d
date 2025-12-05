import { useEffect, useMemo, useState, type CSSProperties } from 'react';

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(10, 12, 20, 0.8)',
  color: '#e0e6ff',
  fontSize: 12,
  lineHeight: 1.4,
  pointerEvents: 'none',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)',
};

/**
 * Performance metrics overlay.
 * Enabled via query parameter `?perf=1` or `?perf=true`.
 * Displays FPS and frame time.
 *
 * @returns {JSX.Element | null} The overlay component.
 */
export function PerfOverlay() {
  const enabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const value = params.get('perf');
    return value === '1' || value === 'true';
  }, []);

  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let last = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      frame += 1;

      // Smooth updates so we are not rerendering every frame
      if (frame % 10 === 0) {
        setFrameMs(delta);
        setFps(1000 / delta);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div style={overlayStyle} aria-live="polite">
      <div>Perf Overlay</div>
      <div>{fps.toFixed(0)} fps</div>
      <div>{frameMs.toFixed(1)} ms/frame</div>
    </div>
  );
}
