import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PrestigeModal } from './PrestigeModal';
import { UpgradesList } from './UpgradesList';
import type { BuyMultiplier } from '../../store/types';

/**
 * Desktop panel for purchasing upgrades and accessing prestige.
 *
 * @returns {JSX.Element} The upgrades panel.
 */
export function UpgradesPanel() {
  const vibeCrystals = useGameStore((state) => state.vibeCrystals);
  const maxWaveReached = useGameStore((state) => state.maxWaveReached);
  const buyMultiplier = useGameStore((state) => state.buyMultiplier || 1);
  const setBuyMultiplier = useGameStore((state) => state.setBuyMultiplier);

  const [showPrestige, setShowPrestige] = React.useState(false);
  const canPrestige = maxWaveReached >= 5;

  const multipliers: BuyMultiplier[] = [1, 10, 100, 'max'];

  return (
    <div className="panel upgrades-panel" role="region" aria-labelledby="upgrades-heading">
      <h2 id="upgrades-heading">Upgrades</h2>

      <div className="multiplier-selector">
        {multipliers.map((m) => (
          <button
            key={m}
            className={`multiplier-button ${buyMultiplier === m ? 'active' : ''}`}
            onClick={() => setBuyMultiplier?.(m)}
          >
            {m === 'max' ? 'MAX' : `x${m}`}
          </button>
        ))}
      </div>

      <UpgradesList />

      <div className="prestige-section">
        <button
          className={`prestige-trigger ${canPrestige ? 'available' : ''}`}
          onClick={() => setShowPrestige(true)}
        >
          <span className="prestige-icon">🌟</span>
          <span className="prestige-label">Prestige</span>
          {vibeCrystals > 0 && <span className="prestige-crystals">{vibeCrystals} 💎</span>}
        </button>
      </div>

      {showPrestige && <PrestigeModal onClose={() => setShowPrestige(false)} />}
    </div>
  );
}
