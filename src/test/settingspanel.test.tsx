import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsPanel } from '../components/ui/SettingsPanel';
import { useGameStore, buildInitialState } from '../store/gameStore';

describe('SettingsPanel', () => {
  beforeEach(() => {
    useGameStore.setState(buildInitialState());
  });

  it('toggles enableSABPhysics via checkbox', () => {
    const { getByLabelText } = render(<SettingsPanel onClose={() => {}} />);

    const checkbox = getByLabelText('SharedArrayBuffer Physics (Experimental)') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    // Toggle
    fireEvent.click(checkbox);

    expect(useGameStore.getState().settings.enableSABPhysics).toBe(true);
  });

  it('Refresh support updates header display and supported state', async () => {
    // Save originals
    const origFetch = (globalThis as any).fetch;
    const origSAB = (globalThis as any).SharedArrayBuffer;
    const origIsolated = (globalThis as any).crossOriginIsolated;

    try {
      // Simulate environment with SharedArrayBuffer and crossOriginIsolated
      (globalThis as any).SharedArrayBuffer = function MockSAB() {};
      (globalThis as any).crossOriginIsolated = true;

      // Mock coop-check endpoint
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        headers: { get: (name: string) => (name === 'Cross-Origin-Opener-Policy' ? 'same-origin' : name === 'Cross-Origin-Embedder-Policy' ? 'require-corp' : null) },
      });

      const { getByRole, findByText } = render(<SettingsPanel onClose={() => {}} />);

      const refresh = getByRole('button', { name: /Refresh support/i });
      fireEvent.click(refresh);

      // Wait for the coop-info to appear and the supported label to update
      await findByText('COOP: same-origin');
      await findByText('COEP: require-corp');
      await findByText('Supported: Yes');
    } finally {
      // Restore
      (globalThis as any).fetch = origFetch;
      (globalThis as any).SharedArrayBuffer = origSAB;
      (globalThis as any).crossOriginIsolated = origIsolated;
    }
  });
});
