import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AchievementsPanel } from '../components/ui/AchievementsPanel';

// Mock dependencies
vi.mock('../store/gameStore', () => ({
  ACHIEVEMENTS: [
    { id: 'test1', label: 'Test Achievement', description: 'Description' },
    { id: 'test2', label: 'Locked Achievement', description: 'Locked' },
  ],
  useGameStore: (selector: any) => selector({
    unlockedAchievements: ['test1'],
    settings: { compactHudEnabled: false },
  }),
}));

// Mock the hook to avoid pointer event complexity in this test
// We want to test the switching logic and rendering structure
// But we actually want to test integration with the real hook if possible,
// or at least that the drawer appears.
// For now, let's use the real hook but we won't easily trigger drag events without more setup.
// We can test the click-to-open behavior.

describe('AchievementsPanel', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('renders Desktop view on large screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AchievementsPanel />);

    // Desktop view has h2 with ID "achievements-heading"
    expect(screen.getByRole('region', { name: /achievements/i })).toBeDefined();
    expect(screen.getByText('Test Achievement')).toBeDefined();
    // Should NOT have the mobile summary class
    expect(document.querySelector('.mobile-achievements-summary')).toBeNull();
  });

  it('renders Mobile view on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    render(<AchievementsPanel />);

    // Should render the summary bar initially
    // The summary bar acts as a button to open
    const summaryButton = screen.getByRole('button', { name: /open achievements/i });
    expect(summaryButton).toBeDefined();

    // Content should not be visible yet (drawer is closed)
    // Actually, in my implementation:
    // !open && <div className="mobile-achievements-summary" ...>
    // open && <div className="mobile-achievements-overlay" ...>

    // So "Test Achievement" text should NOT be in the document yet
    expect(screen.queryByText('Test Achievement')).toBeNull();

    // Click to open
    fireEvent.click(summaryButton);

    // Now drawer should be open
    expect(screen.getByText('Test Achievement')).toBeDefined();
    expect(screen.getByText('Achievements')).toBeDefined(); // Header

    // Close by clicking overlay
    // The overlay is the parent of the drawer
    const drawer = screen.getByText('Test Achievement').closest('.mobile-achievements-drawer');
    const overlay = drawer?.parentElement;
    if (overlay) {
        fireEvent.click(overlay);
    }

    // Should be closed again
    expect(screen.queryByText('Test Achievement')).toBeNull();
    expect(screen.getByRole('button', { name: /open achievements/i })).toBeDefined();
  });
});
