import { Arena } from '../Arena';
import { FrameManager } from '../../engine/FrameManager';

/**
 * Renders the static arena geometry and initializes the physics frame manager.
 *
 * @returns {JSX.Element} The arena layer.
 */
export function ArenaLayer() {
  return (
    <>
      <Arena />
      <FrameManager />
    </>
  );
}
