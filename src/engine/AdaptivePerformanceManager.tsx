import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

const UPDATE_INTERVAL = 1.0; // Update every 1000ms
const TARGET_FPS = 60;
// Lower bound for degrading quality
const FPS_LOW_THRESHOLD = 55;
// Upper bound for upgrading quality (hysteresis)
const FPS_HIGH_THRESHOLD = 59;
// Wait time after a DPR change before measuring again (to ignore resize lag)
const COOLDOWN_DELAY = 0.5;

interface AdaptivePerformanceManagerProps {
  targetDpr: number;
  minDpr?: number;
}

/**
 * AdaptivePerformanceManager monitors the frame rate and dynamically adjusts
 * the renderer's pixel ratio (DPR) to maintain a target FPS (default 60).
 *
 * It works by accumulating frame times over a set interval (1.0s) and calculating
 * the average FPS. If the FPS drops below the low threshold, it reduces the DPR.
 * If the FPS stays high near the target, it attempts to restore the DPR up to the
 * requested `targetDpr`.
 */
export function AdaptivePerformanceManager({ targetDpr, minDpr = 0.5 }: AdaptivePerformanceManagerProps) {
  // Access the setDpr action from R3F state to update both internal state and renderer
  const setDpr = useThree((state) => state.setDpr);

  // Ref to track the currently applied DPR
  const currentDpr = useRef(targetDpr);

  // Refs for FPS calculation
  const frames = useRef(0);
  const accumulatedTime = useRef(0);

  // Cooldown tracking
  const cooldownRef = useRef(0);

  // Initialize DPR when targetDpr changes
  useEffect(() => {
    currentDpr.current = targetDpr;
    setDpr(targetDpr);
    // Reset measurement buffers on hard reset
    frames.current = 0;
    accumulatedTime.current = 0;
    cooldownRef.current = COOLDOWN_DELAY;
  }, [targetDpr, setDpr]);

  useFrame((_, delta) => {
    // Ignore large deltas (e.g., resuming from background tab) to avoid spurious adjustments
    if (delta > 0.2) return;

    // Handle cooldown after resize
    if (cooldownRef.current > 0) {
      cooldownRef.current -= delta;
      // Do not accumulate stats during cooldown
      return;
    }

    frames.current++;
    accumulatedTime.current += delta;

    if (accumulatedTime.current >= UPDATE_INTERVAL) {
      const fps = frames.current / accumulatedTime.current;
      let nextDpr = currentDpr.current;
      let changed = false;

      if (fps < FPS_LOW_THRESHOLD) {
        // Decrease DPR by 15% if FPS is struggling (aggressive drop)
        const proposed = Math.max(minDpr, nextDpr * 0.85);
        if (proposed < nextDpr) {
          nextDpr = proposed;
          changed = true;
        }
      } else if (fps >= FPS_HIGH_THRESHOLD) {
        // Increase DPR by 10% if FPS is smooth, up to the target
        const proposed = Math.min(targetDpr, nextDpr * 1.1);
        if (proposed > nextDpr) {
          nextDpr = proposed;
          changed = true;
        }
      }

      // Check for significance
      // If we are changing, ensure the change is large enough to matter, OR we are hitting limits
      // Using a small epsilon to avoid float equality issues
      if (changed && Math.abs(nextDpr - currentDpr.current) > 0.01) {
        currentDpr.current = nextDpr;
        setDpr(nextDpr);

        // Activate cooldown to skip the resize frame(s)
        cooldownRef.current = COOLDOWN_DELAY;
      }

      // Reset counters for next interval
      frames.current = 0;
      accumulatedTime.current = 0;
    }
  });

  return null;
}
