import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './PrestigeModal.css';

interface PrestigeModalProps {
    onClose: () => void;
}

export function PrestigeModal({ onClose }: PrestigeModalProps) {
    const vibeCrystals = useGameStore((state) => state.vibeCrystals);
    const prestigeLevel = useGameStore((state) => state.prestigeLevel);
    const prestigeMultiplier = useGameStore((state) => state.prestigeMultiplier);
    const maxWaveReached = useGameStore((state) => state.maxWaveReached);
    const getPrestigeReward = useGameStore((state) => state.getPrestigeReward);
    const performPrestige = useGameStore((state) => state.performPrestige);

    const reward = getPrestigeReward();
    const canPrestige = reward > 0;
    const multiplierBonus = Math.round((prestigeMultiplier - 1) * 100);
    const futureMultiplier = 1 + (vibeCrystals + reward) * 0.1;
    const futureBonus = Math.round((futureMultiplier - 1) * 100);

    const modalRef = React.useRef<HTMLDivElement | null>(null);
    const handlePrestige = () => {
        if (canPrestige) {
            performPrestige();
            onClose();
        }
    };

    React.useEffect(() => {
        const root = modalRef.current;
        if (!root) return;
        const prevActive = document.activeElement as HTMLElement | null;
        const focusables = root.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (focusables && focusables.length > 0) focusables[0].focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key !== 'Tab') return;
            if (!focusables || focusables.length === 0) return;
            if (e.shiftKey) {
                if (document.activeElement === focusables[0]) {
                    e.preventDefault();
                    focusables[focusables.length - 1].focus();
                }
            } else {
                if (document.activeElement === focusables[focusables.length - 1]) {
                    e.preventDefault();
                    focusables[0].focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (prevActive) prevActive.focus();
        };
    }, [onClose]);

    return (
            <div className="modal-overlay" onClick={onClose}>
                <div ref={modalRef} className="modal-content prestige-modal" role="dialog" aria-modal="true" aria-labelledby="prestige-heading" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ×
                </button>

                <h2 id="prestige-heading">🌟 Prestige System</h2>

                <div className="prestige-stats">
                    <div className="prestige-stat">
                        <span className="stat-label">Vibe Crystals:</span>
                        <span className="stat-value crystal-glow">{vibeCrystals}</span>
                    </div>
                    <div className="prestige-stat">
                        <span className="stat-label">Prestige Level:</span>
                        <span className="stat-value">{prestigeLevel}</span>
                    </div>
                    <div className="prestige-stat">
                        <span className="stat-label">Current Multiplier:</span>
                        <span className="stat-value multiplier-glow">+{multiplierBonus}%</span>
                    </div>
                </div>

                <div className="prestige-divider"></div>

                {canPrestige ? (
                    <>
                        <div className="prestige-reward">
                            <p className="reward-text">
                                Prestige now to earn <span className="crystal-glow">{reward}</span> Vibe Crystal{reward !== 1 ? 's' : ''}!
                            </p>
                            <p className="reward-subtext">
                                New multiplier: <span className="multiplier-glow">+{futureBonus}%</span> score
                            </p>
                        </div>

                        <div className="prestige-warning">
                            ⚠️ This will reset your score, wave, and upgrades
                        </div>

                        <div className="prestige-actions">
                            <button className="prestige-button confirm" onClick={handlePrestige}>
                                ✨ Prestige Now
                            </button>
                            <button className="prestige-button cancel" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="prestige-requirement">
                            <p>Prestige is available starting at Wave 5</p>
                            <p className="requirement-detail">
                                Current Wave: {maxWaveReached} / 5
                            </p>
                        </div>

                        <div className="prestige-actions">
                            <button className="prestige-button cancel" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
