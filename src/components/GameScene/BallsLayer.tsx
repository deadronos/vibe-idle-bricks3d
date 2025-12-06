import type { Ball as BallType } from '../../store/types';
import { Ball } from '../Ball';
import BallsInstanced from '../BallsInstanced';

type BallsLayerProps = {
  balls: BallType[];
  rapierActive: boolean;
  computedQuality: 'low' | 'medium' | 'high';
};

/**
 * Manages the rendering of balls in the scene.
 * Switches between individual components and instanced rendering based on physics engine status.
 *
 * @param {BallsLayerProps} props - Component props.
 * @returns {JSX.Element} The balls layer.
 */
export function BallsLayer({ balls, rapierActive, computedQuality }: BallsLayerProps) {
  if (rapierActive) {
    const maxInstances = computedQuality === 'high' ? 256 : computedQuality === 'medium' ? 128 : 64;
    return <BallsInstanced maxInstances={maxInstances} />;
  }

  return <>{balls.map((ball) => <Ball key={ball.id} ball={ball} />)}</>;
}
