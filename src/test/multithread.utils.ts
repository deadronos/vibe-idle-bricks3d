import type { Ball, Brick } from '../store/types';

export const mockArena = { width: 12, height: 10, depth: 8 };

export const mockBrick: Brick = {
  id: 'brick-1',
  type: 'normal',
  position: [0, 0, 0],
  health: 10,
  maxHealth: 10,
  color: '#fff',
  value: 10,
};

export const mockBalls: Ball[] = [
  {
    id: 'ball-1',
    position: [-0.1, 0, 0],
    velocity: [0.2, 0, 0],
    radius: 0.5,
    damage: 1,
    color: '#fff',
  },
  {
    id: 'ball-2',
    position: [1, 0.2, -0.3],
    velocity: [-0.1, 0.05, 0.05],
    radius: 0.25,
    damage: 2,
    color: '#0ff',
  },
];
