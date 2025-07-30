import React, { useState, useMemo, useEffect } from 'react';
import { Character, Stats, Equipment, ActiveEffect } from '../../types';
import { STAT_METADATA, parseCurrency, calculateStatBreakdown, calculatePoolStatBreakdown } from '../../components/shared/statUtils';

// Tooltip mô tả chỉ số
const StatInfoTooltip: React.FC<{ statKey: keyof Stats; character: Character; equipment: Equipment[] }> = ({ statKey, character, equipment }) => {
    const meta = STAT_METADATA[statKey];
    
    const modifiers: { source: string; value: number; duration: string; type: 'pos' | 'neg' }[] = useMemo(() => {
        const mods: { source: string; value: number; duration: string; type: 'pos' | 'neg' }[] = [];
        const relevantKey = statKey === 'hp' ? 'maxHp' : statKey === 'mp' ? 'maxMp' : statKey === 'stamina' ? 'maxStamina' : statKey;

        equipment.forEach(slot => {
            const value = slot.item?.equipmentDetails?.stats?.[relevantKey as keyof Stats];
            if (value && typeof value === 'number' && value !== 0) {
                mods.push({ source: slot.item!.name, value, duration: 'Vĩnh viễn', type: value > 0 ? 'pos' : 'neg' });
            }
        });

        character.activeEffects.forEach(effect => {
            const value = effect.stats?.[relevantKey as keyof Stats];
            if (value && typeof value === 'number' && value !== 0) {
                let durationText = 'Vĩnh viễn';
                const dur = effect.duration;
                if (dur === Infinity) {
                    durationText = 'Vĩnh viễn';
                } else if (typeof dur === 'number' && isFinite(dur)) {
                    durationText = `Còn ${dur} lượt`;
                }
                mods.push({ source: effect.source, value, duration: durationText, type: value > 0 ? 'pos' : 'neg' });
            }
        });
        return mods;
    }, [statKey, character, equipment]);

    if (!meta?.description) return null;

    return (
        <div className="stat-tooltip-simple-panel" onClick={e => e.stopPropagation()}>
            <h5>{meta.label}</h5>
            <p>{meta.description}</p>
            {meta.mechanism && <p><strong>Cơ chế:</strong> {meta.mechanism}</p>}
            
            {modifiers.length > 0 && (
                <div className="stat-tooltip-modifiers">
                    <h6 className="stat-tooltip-modifiers-header">Các nguồn ảnh hưởng:</h6>
                    <ul className="stat-tooltip-modifiers-list">
                        {modifiers.map((mod, index) => (
                            <li key={index}>
                                <span>{mod.source} ({mod.duration})</span>
                                <span className={`stat-mod-${mod.type}`}>{mod.value > 0 ? '+' : ''}{mod.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


interface StatusPanelProps {
  character: Character;
  equipment: Equipment[];
}

const StatusPanel: React.FC<StatusPanelProps> = ({ character, equipment }) => {
    const { stats, realm, currencies } = character;
    const [activeTooltip, setActiveTooltip] = useState<keyof Stats | null>(null);

    useEffect(() => {
        const handleClickOutside = () => {
            if (activeTooltip) {
                setActiveTooltip(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeTooltip]);

    const handleStatClick = (statKey: keyof Stats, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveTooltip(prev => (prev === statKey ? null : statKey));
    };

    const hpBreakdown = useMemo(() => calculatePoolStatBreakdown(character, equipment, 'hp'), [character, equipment]);
    const mpBreakdown = useMemo(() => calculatePoolStatBreakdown(character, equipment, 'mp'), [character, equipment]);
    const staminaBreakdown = useMemo(() => calculatePoolStatBreakdown(character, equipment, 'stamina'), [character, equipment]);
    
    const expPercentage = stats.nextLevelExp > 0 ? (stats.exp / stats.nextLevelExp) * 100 : 0;
    
    return (
        <div className="panel status-panel">
            <h3>{character.name}</h3>
            <p className="character-level">Cấp {stats.level}</p>
            <p className="character-realm">{realm}</p>
            
            <div className="character-currencies">
                 {Object.keys(currencies).length === 0 ? (
                    <div className="currency-display">
                        <span>Chưa có tiền tệ.</span>
                    </div>
                 ) : Object.entries(currencies).map(([name, amount]) => {
                    const { emoji, text } = parseCurrency(name);
                    return (
                        <div key={name} className="currency-display">
                            <span className="currency-icon" title={text}>{emoji}</span>
                            <span className="currency-name">{text}:</span>
                            <span className="currency-amount">{amount.toLocaleString()}</span>
                        </div>
                    );
                 })}
            </div>
            
            <div className="stats-group-separator" />

            <div className="stats-container">
                <div className="stat-bar" onClick={(e) => handleStatClick('hp', e)}>
                    {activeTooltip === 'hp' && <StatInfoTooltip statKey='hp' character={character} equipment={equipment} />}
                    <div className="stat-bar-info">
                         <div className="stat-bar-label-group">
                            <span className="stat-bar-icon">{STAT_METADATA.hp!.icon}</span>
                            <span className="stat-label">{STAT_METADATA.hp!.label}</span>
                        </div>
                        <span className="stat-value">{Math.round(stats.hp)} / {hpBreakdown.total}</span>
                    </div>
                    <div className="stat-bar-bg">
                        <div className="stat-bar-fg hp" style={{ width: `${hpBreakdown.total > 0 ? (stats.hp / hpBreakdown.total) * 100 : 0}%` }}></div>
                    </div>
                </div>

                <div className="stat-bar" onClick={(e) => handleStatClick('mp', e)}>
                     {activeTooltip === 'mp' && <StatInfoTooltip statKey='mp' character={character} equipment={equipment} />}
                    <div className="stat-bar-info">
                        <div className="stat-bar-label-group">
                            <span className="stat-bar-icon">{STAT_METADATA.mp!.icon}</span>
                            <span className="stat-label">{STAT_METADATA.mp!.label}</span>
                        </div>
                        <span className="stat-value">{Math.round(stats.mp)} / {mpBreakdown.total}</span>
                    </div>
                    <div className="stat-bar-bg">
                        <div className="stat-bar-fg mp" style={{ width: `${mpBreakdown.total > 0 ? (stats.mp / mpBreakdown.total) * 100 : 0}%` }}></div>
                    </div>
                </div>
                
                <div className="stat-bar" onClick={(e) => handleStatClick('stamina', e)}>
                     {activeTooltip === 'stamina' && <StatInfoTooltip statKey='stamina' character={character} equipment={equipment} />}
                    <div className="stat-bar-info">
                        <div className="stat-bar-label-group">
                            <span className="stat-bar-icon">{STAT_METADATA.stamina!.icon}</span>
                            <span className="stat-label">{STAT_METADATA.stamina!.label}</span>
                        </div>
                        <span className="stat-value">{Math.round(stats.stamina)} / {staminaBreakdown.total}</span>
                    </div>
                    <div className="stat-bar-bg">
                        <div className="stat-bar-fg stamina" style={{ width: `${staminaBreakdown.total > 0 ? (stats.stamina / staminaBreakdown.total) * 100 : 0}%` }}></div>
                    </div>
                </div>

                 <div className="stat-bar" onClick={(e) => handleStatClick('exp', e)}>
                    {activeTooltip === 'exp' && <StatInfoTooltip statKey='exp' character={character} equipment={equipment} />}
                    <div className="stat-bar-info">
                        <div className="stat-bar-label-group">
                            <span className="stat-bar-icon">{STAT_METADATA.exp!.icon}</span>
                            <span className="stat-label">{STAT_METADATA.exp!.label}</span>
                        </div>
                        <span className="stat-value">{stats.exp} / {stats.nextLevelExp}</span>
                    </div>
                    <div className="stat-bar-bg">
                        <div className="stat-bar-fg exp" style={{ width: `${expPercentage}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusPanel;
