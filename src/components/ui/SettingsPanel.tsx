import React from 'react';
import { useGameStore } from '../../store/gameStore';
import type { GameSettings } from '../../store/types';
import './UI.css';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
    const settings = useGameStore((state) => state.settings);
    const toggleSetting = useGameStore((state) => state.toggleSetting);
    const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);
    const modalRef = React.useRef<HTMLDivElement | null>(null);

    const settingLabels: Record<keyof GameSettings, string> = {
        enableBloom: 'Bloom',
        enableShadows: 'Shadows',
        enableSound: 'Sound',
        enableParticles: 'Particles',
        enableFullRigidPhysics: 'Full Rigid Physics (Rapier)',
        compactHudEnabled: 'Compact HUD',
        graphicsQuality: 'Graphics Quality',
    };

    React.useEffect(() => {
        const root = modalRef.current;
        if (!root) return;
        const prevActive = document.activeElement as HTMLElement | null;
        // Focus first focusable element
        const focusables = root.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        const first = focusables[0];
        if (first) first.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (focusables.length === 0) return;
            // const focusedIndex = Array.prototype.indexOf.call(focusables, document.activeElement);
            if (e.shiftKey) {
                // If shift-tab on first, move to last
                if (document.activeElement === focusables[0]) {
                    e.preventDefault();
                    focusables[focusables.length - 1].focus();
                }
            } else {
                // Tab: if on last, go to first
                if (document.activeElement === focusables[focusables.length - 1]) {
                    e.preventDefault();
                    focusables[0].focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onEsc);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keydown', onEsc);
            if (prevActive) prevActive.focus();
        };
    }, [onClose]);

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="settings-heading" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2 id="settings-heading">Settings</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>
                <div className="settings-grid">
                    {(() => {
                        const settingsRecord = settings as unknown as Record<string, unknown>;
                        return (Object.keys(settings) as Array<keyof GameSettings>)
                            .filter((k) => typeof settingsRecord[k] === 'boolean')
                            .map((key) => (
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
                            ));
                    })()}

                    <div className="setting-item">
                        <label htmlFor="graphics-quality">Graphics Quality</label>
                        <select
                            id="graphics-quality"
                            value={settings.graphicsQuality || 'auto'}
                            onChange={(e) => setGraphicsQuality?.(e.target.value as 'auto' | 'low' | 'medium' | 'high')}
                        >
                            <option value="auto">Auto</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
