import React from 'react';
import { ACHIEVEMENTS, useGameStore } from '../../store/gameStore';
import { AchievementsPanel } from './AchievementsPanel';
import { ComboDisplay } from './ComboDisplay';
import { Controls } from './Controls';
import { ScorePanel } from './ScorePanel';
import { StatsPanel } from './StatsPanel';
import { UpgradesPanel } from './UpgradesPanel';
import { MobileUpgrades } from './MobileUpgrades';
import { SettingsPanel } from './SettingsPanel';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import './UI.css';

export function UI() {
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const [showSettings, setShowSettings] = React.useState(false);

  useKeyboardShortcuts();

  const latestAchievementId = unlockedAchievements[unlockedAchievements.length - 1];
  const latestAchievement = ACHIEVEMENTS.find((item) => item.id === latestAchievementId);
  const latestAnnouncement = useGameStore((state) => state.latestAnnouncement);
  const compactHudEnabled = useGameStore((state) => state.settings.compactHudEnabled);
  const liveMessage = latestAnnouncement || (latestAchievement ? `Achievement unlocked: ${latestAchievement.label}` : '');

  return (
    <div className="ui-container">
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      <ComboDisplay />
      <ScorePanel onOpenSettings={() => setShowSettings(true)} />
      {!compactHudEnabled && <StatsPanel />}
      <UpgradesPanel />
      <MobileUpgrades />
      {!compactHudEnabled && <AchievementsPanel />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <Controls />
    </div>
  );
}
