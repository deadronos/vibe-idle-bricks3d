import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
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
});
