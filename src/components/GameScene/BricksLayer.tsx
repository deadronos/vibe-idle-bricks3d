import { useEffect } from 'react';
import type { Brick } from '../../store/types';
import { BricksInstanced } from '../bricks/BricksInstanced';

type BricksLayerProps = {
  bricks: Brick[];
  onRegenerate: () => void;
};

export function BricksLayer({ bricks, onRegenerate }: BricksLayerProps) {
  useEffect(() => {
    if (bricks.length === 0) {
      const timer = setTimeout(() => {
        onRegenerate();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [bricks.length, onRegenerate]);

  return <BricksInstanced bricks={bricks} />;
}
