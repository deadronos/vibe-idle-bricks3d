import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Ball as BallType, Brick } from '../store/types';
import { BricksLayer } from '../components/GameScene/BricksLayer';
import { BallsLayer } from '../components/GameScene/BallsLayer';

vi.mock('../components/bricks/BricksInstanced', () => ({
  BricksInstanced: ({ bricks }: { bricks: Brick[] }) => (
    <div data-testid="bricks-instanced" data-count={bricks.length} />
  ),
}));

vi.mock('../components/Ball', () => ({
  Ball: ({ ball }: { ball: BallType }) => <div data-testid="ball" data-id={ball.id} />,
}));

vi.mock('../components/BallsInstanced', () => ({
  __esModule: true,
  default: ({ maxInstances }: { maxInstances: number }) => (
    <div data-testid="balls-instanced" data-max={maxInstances} />
  ),
}));

describe('BricksLayer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers regenerate when all bricks are gone after delay', () => {
    vi.useFakeTimers();
    const onRegenerate = vi.fn();

    render(<BricksLayer bricks={[]} onRegenerate={onRegenerate} />);

    expect(onRegenerate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(onRegenerate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });
});

describe('BallsLayer', () => {
  it('uses instanced rendering when Rapier is active', () => {
    render(
      <BallsLayer
        balls={[]}
        rapierActive
        computedQuality="medium"
      />,
    );

    expect(screen.getByTestId('balls-instanced')).toHaveAttribute('data-max', '128');
  });

  it('renders individual balls when Rapier is inactive', () => {
    const balls: BallType[] = [
      { id: 'b1', position: [0, 0, 0], velocity: [0, 0, 0], radius: 0.25, color: '#fff', damage: 1 },
      { id: 'b2', position: [1, 0, 0], velocity: [0, 0, 0], radius: 0.25, color: '#fff', damage: 1 },
    ];

    render(
      <BallsLayer
        balls={balls}
        rapierActive={false}
        computedQuality="high"
      />,
    );

    const rendered = screen.getAllByTestId('ball');
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveAttribute('data-id', 'b1');
    expect(rendered[1]).toHaveAttribute('data-id', 'b2');
  });
});
