import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpgradesPanel } from '../components/ui/UpgradesPanel';
import { buildInitialState, useGameStore } from '../store/gameStore';

describe('UpgradesPanel', () => {
  beforeEach(() => {
    useGameStore.persist?.clearStorage?.();
    useGameStore.setState(buildInitialState());
    useGameStore.setState({
      score: 999999,
      bricks: [],
      balls: [],
    });
  });

  it('renders the shared upgrade list in the desktop panel', () => {
    render(<UpgradesPanel />);

    expect(screen.getByRole('heading', { name: 'Upgrades' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Upgrade Ball Damage — costs/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Upgrade Ball Speed — costs/i })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Add Ball — costs/i })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Upgrade Crit Chance — costs/i })
    ).toBeDefined();
  });
});