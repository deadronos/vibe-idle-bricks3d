import { useGameStore } from '../../store/gameStore';
import type { GameSettings } from '../../store/types';
import './UI.css';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
    const settings = useGameStore((state) => state.settings);
    const toggleSetting = useGameStore((state) => state.toggleSetting);

    const settingLabels: Record<keyof GameSettings, string> = {
        enableBloom: 'Bloom',
        enableShadows: 'Shadows',
        enableSound: 'Sound',
        enableParticles: 'Particles',
        enableFullRigidPhysics: 'Full Rigid Physics (Rapier)',
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>
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
        </div>
    );
}
