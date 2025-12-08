import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MobileUpgrades } from '../../src/components/ui/MobileUpgrades';
import { useGameStore, buildInitialState } from '../../src/store/gameStore';

describe('Mobile Upgrades Drawer — Drag & Swipe', () => {
  beforeEach(() => {
    // Reset store state
    useGameStore.persist?.clearStorage?.();
    useGameStore.setState(buildInitialState());

    // Ensure player has points to enable upgrades
    useGameStore.setState({ score: 999999 });
  });

  it('opens and closes by clicking overlay', () => {
    render(<MobileUpgrades />);

    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    expect(screen.getByRole('dialog')).toBeDefined();

    // Click overlay to close
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when swiped down past threshold', async () => {
    render(<MobileUpgrades />);

    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    const drawer = screen.getByTestId('mobile-upgrades-drawer');
    const header = screen.getByTestId('mobile-upgrades-drawer-header');

    // Mock bounding rect for consistent threshold calculation
    drawer.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 320,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect;

    // Start a drag near top of UI (clientY = 10)
    fireEvent.pointerDown(header, { pointerId: 1, clientY: 10, isPrimary: true });
    // Move past the 33% threshold
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 200 });
    fireEvent.pointerUp(document, { pointerId: 1, clientY: 200 });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not close when swiped down a little', async () => {
    render(<MobileUpgrades />);

    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    const drawer = screen.getByTestId('mobile-upgrades-drawer');
    const header = screen.getByTestId('mobile-upgrades-drawer-header');

    drawer.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 320,
        x: 0,
        y: 0,
        toJSON: () => {},
      }) as DOMRect;

    fireEvent.pointerDown(header, { pointerId: 1, clientY: 10, isPrimary: true });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 40 }); // small drag (30px)
    fireEvent.pointerUp(document, { pointerId: 1, clientY: 40 });

    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('closes when activated via keyboard on the handle', () => {
    render(<MobileUpgrades />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    const handle = screen.getByTestId('mobile-upgrades-handle');
    fireEvent.focus(handle);
    fireEvent.keyDown(handle, { key: 'Enter' });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes via Escape key', () => {
    render(<MobileUpgrades />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when window is resized to desktop width', () => {
    render(<MobileUpgrades />);
    const openButton = screen.getByLabelText('Open upgrades drawer');
    fireEvent.click(openButton);

    expect(screen.getByRole('dialog')).toBeDefined();

    // Resize window
    window.innerWidth = 1024;
    fireEvent.resize(window);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
