import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

/**
 * Custom hook for handling global keyboard shortcuts.
 * - Space: Toggle pause
 * - U: Upgrade ball damage
 */
export const useKeyboardShortcuts = () => {
  const togglePause = useGameStore((state) => state.togglePause);
  const upgradeBallDamage = useGameStore((state) => state.upgradeBallDamage);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
      }
      if (event.code === 'KeyU') {
        event.preventDefault();
        upgradeBallDamage();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePause, upgradeBallDamage]);
};
