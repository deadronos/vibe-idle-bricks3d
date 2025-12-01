import React from 'react';
import { ACHIEVEMENTS, useGameStore } from '../../store/gameStore';
import { AchievementsPanel } from './AchievementsPanel';
import { Controls } from './Controls';
import { ScorePanel } from './ScorePanel';
import { StatsPanel } from './StatsPanel';
import { UpgradesPanel } from './UpgradesPanel';
import { SettingsPanel } from './SettingsPanel';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import './UI.css';

export function UI() {
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const [showSettings, setShowSettings] = React.useState(false);

  useKeyboardShortcuts();

  const latestAchievementId = unlockedAchievements[unlockedAchievements.length - 1];
  const latestAchievement = ACHIEVEMENTS.find((item) => item.id === latestAchievementId);
  const liveMessage = latestAchievement ? `Achievement unlocked: ${latestAchievement.label}` : '';

  return (
    <div className="ui-container">
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      <ScorePanel onOpenSettings={() => setShowSettings(true)} />
      <StatsPanel />
      <UpgradesPanel />
      <AchievementsPanel />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <Controls />
    </div>
  );
}
