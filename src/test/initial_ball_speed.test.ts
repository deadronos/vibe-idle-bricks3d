import { describe, it, expect } from 'vitest';
import { createInitialBall } from '../store/createInitials';
import { updateBallSpeeds } from '../store/slices/balls';

describe('Initial Ball Speed Logic', () => {
  it('should create a ball with the correct speed', () => {
    const targetSpeed = 0.1;
    const ball = createInitialBall(targetSpeed);
    const velocity = ball.velocity;
    const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);

    expect(speed).toBeCloseTo(targetSpeed, 5);
  });

  it('should increase speed after upgrade', () => {
     const initialSpeed = 0.1;
     const ball = createInitialBall(initialSpeed);
     const initialRealSpeed = Math.sqrt(ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2);

     const upgradedSpeed = 0.12;
     const updatedBalls = updateBallSpeeds([ball], upgradedSpeed);
     const updatedRealSpeed = Math.sqrt(updatedBalls[0].velocity[0] ** 2 + updatedBalls[0].velocity[1] ** 2 + updatedBalls[0].velocity[2] ** 2);

     expect(updatedRealSpeed).toBeGreaterThan(initialRealSpeed);
     expect(updatedRealSpeed).toBeCloseTo(upgradedSpeed, 5);
  });
});
