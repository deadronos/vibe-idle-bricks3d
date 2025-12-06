import { useGameStore } from '../../store/gameStore';
import './ComboDisplay.css';

/**
 * Displays the current hit combo and damage multiplier.
 * Only visible when a combo is active (count > 0).
 *
 * @returns {JSX.Element | null} The combo display or null.
 */
export function ComboDisplay() {
  const comboCount = useGameStore((state) => state.comboCount);
  const comboMultiplier = useGameStore((state) => state.comboMultiplier);

  if (comboCount === 0) return null;

  const bonusPercent = Math.round((comboMultiplier - 1) * 100);

  return (
    <div className="combo-display">
      <div className="combo-count">{comboCount}x Combo!</div>
      <div className="combo-bonus">+{bonusPercent}% Damage</div>
    </div>
  );
}
