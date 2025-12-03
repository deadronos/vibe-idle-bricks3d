// React import not required in this test file (automatic JSX runtime)
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { PrestigeModal } from '../../src/components/ui/PrestigeModal';
import { useGameStore, buildInitialState } from '../../src/store/gameStore';

describe('PrestigeModal', () => {
  beforeEach(() => {
    useGameStore.persist?.clearStorage?.();
    useGameStore.setState(buildInitialState());

    // Set some state so that the modal shows the "can prestige" UI
    useGameStore.setState({
      vibeCrystals: 2,
      prestigeLevel: 1,
      prestigeMultiplier: 1.2,
      maxWaveReached: 10,
    });
  });

  it('renders dialog and primary content', () => {
    render(<PrestigeModal onClose={() => {}} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Prestige System/)).toBeDefined();
    expect(screen.getByText(/Vibe Crystals:/)).toBeDefined();
  });

  it('closes when clicking overlay or cancel, and performs prestige on confirm', () => {
    const onClose = vi.fn();
    const perform = vi.fn();
    // ensure store uses our spy for perform
    useGameStore.setState({ performPrestige: perform });

    const r1 = render(<PrestigeModal onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;

    // clicking overlay should close modal
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();

    // unmount and re-open to test cancel button
    r1.unmount();
    onClose.mockReset();
    perform.mockReset();

    const r2 = render(<PrestigeModal onClose={onClose} />);
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();

    // unmount and re-open again to click confirm
    r2.unmount();
    onClose.mockReset();
    perform.mockReset();

    render(<PrestigeModal onClose={onClose} />);
    const confirmBtn = screen.getByRole('button', { name: /Prestige Now/i });
    fireEvent.click(confirmBtn);
    expect(perform).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
