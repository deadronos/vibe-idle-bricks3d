import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UI } from '../../src/components/ui/UI';
import { useGameStore, buildInitialState } from '../../src/store/gameStore';

describe('Mobile Drawer — E2E', () => {
  beforeEach(() => {
    useGameStore.persist?.clearStorage?.();
    useGameStore.setState(buildInitialState());
    useGameStore.setState({ score: 100000 });
  });

  it('opens the drawer and closes on overlay', () => {
    render(<UI />);

    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('can be closed by dragging down', () => {
    render(<UI />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    const drawer = screen.getByTestId('mobile-upgrades-drawer');
    const header = screen.getByTestId('mobile-upgrades-drawer-header');

    drawer.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 420,
        top: 0,
        left: 0,
        bottom: 420,
        right: 320,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect;

    fireEvent.pointerDown(header, { pointerId: 1, clientY: 10, isPrimary: true });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 200 });
    fireEvent.pointerUp(document, { pointerId: 1, clientY: 200 });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when handle activated by keyboard', () => {
    render(<UI />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    const handle = screen.getByTestId('mobile-upgrades-handle');
    fireEvent.focus(handle);
    fireEvent.keyDown(handle, { key: 'Enter' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes via Escape key', () => {
    render(<UI />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
