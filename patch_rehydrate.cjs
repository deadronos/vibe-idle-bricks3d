const fs = require('fs');
let code = fs.readFileSync('src/store/persistence/rehydrate.ts', 'utf8');

const oldCheck = `// Revalidate stats after a frame
  setTimeout(() => {
    const currentState = useGameStore.getState();

    // Verify ball stats match store config
    const ballStatMismatch = currentState.balls.some(
      (ball) =>
        ball.damage !== currentState.ballDamage ||
        Math.abs(
          Math.sqrt(ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2) -
            currentState.ballSpeed
        ) > 0.01
    );

    if (ballStatMismatch) {
      console.warn(
        '[GameStore] Ball stats mismatch detected! Rebuilding balls with correct stats.'
      );
      const rebuiltBalls = currentState.balls.map((ball) => ({
        ...ball,
        damage: currentState.ballDamage,
        velocity: Array.from({ length: 3 }, (_, i) => {
          const currentVelMagnitude = Math.sqrt(
            ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
          );
          return currentVelMagnitude > 0
            ? (ball.velocity[i] / currentVelMagnitude) * currentState.ballSpeed
            : ball.velocity[i];
        }) as Ball['velocity'],
      }));
      useGameStore.setState({ balls: rebuiltBalls });
    }
  }, 16); // One frame at 60fps`;

const newCheck = `// Revalidate stats after a frame
  setTimeout(() => {
    const currentState = useGameStore.getState();
    const globalProc = globalThis as unknown as { process?: { env?: Record<string, string> } };
    const isTestEnv = typeof globalProc.process !== 'undefined' && !!globalProc.process?.env && globalProc.process?.env.NODE_ENV === 'test';

    // Verify ball stats match store config
    const ballStatMismatch = currentState.balls.some(
      (ball) =>
        ball.damage !== currentState.ballDamage ||
        Math.abs(
          Math.sqrt(ball.velocity[0] * ball.velocity[0] + ball.velocity[1] * ball.velocity[1] + ball.velocity[2] * ball.velocity[2]) -
            currentState.ballSpeed
        ) > 0.01
    );

    if (ballStatMismatch) {
      if (!isTestEnv) {
        console.warn(
          '[GameStore] Ball stats mismatch detected! Rebuilding balls with correct stats.'
        );
      }
      const rebuiltBalls = currentState.balls.map((ball) => ({
        ...ball,
        damage: currentState.ballDamage,
        velocity: Array.from({ length: 3 }, (_, i) => {
          const currentVelMagnitude = Math.sqrt(
            ball.velocity[0] * ball.velocity[0] + ball.velocity[1] * ball.velocity[1] + ball.velocity[2] * ball.velocity[2]
          );
          return currentVelMagnitude > 0
            ? (ball.velocity[i] / currentVelMagnitude) * currentState.ballSpeed
            : ball.velocity[i];
        }) as Ball['velocity'],
      }));
      useGameStore.setState({ balls: rebuiltBalls });
    }
  }, 16); // One frame at 60fps`;

code = code.replace(oldCheck, newCheck);

fs.writeFileSync('src/store/persistence/rehydrate.ts', code);
