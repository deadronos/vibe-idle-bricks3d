import { useGameStore } from '../../store/gameStore';
import type { GameSettings } from '../../store/types';
import './UI.css';

export function SettingsPanel() {
    const settings = useGameStore((state) => state.settings);
    const toggleSetting = useGameStore((state) => state.toggleSetting);

    const settingLabels: Record<keyof GameSettings, string> = {
        enableBloom: 'Bloom',
        enableShadows: 'Shadows',
        enableSound: 'Sound',
        enableParticles: 'Particles',
    };

    return (
        <div className="panel settings-panel">
            <h2>Settings</h2>
            <div className="settings-grid">
                {(Object.keys(settings) as Array<keyof GameSettings>).map((key) => (
                    <div key={key} className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={!!settings[key]}
                                onChange={() => toggleSetting(key)}
                            />
                            {settingLabels[key]}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
