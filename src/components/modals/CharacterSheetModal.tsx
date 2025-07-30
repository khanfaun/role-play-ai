

import React, { useState, useMemo, useEffect } from 'react';
import { GameState, Stats, Faction, NPC, Character, Equipment, Skill, ActiveEffect } from '../../types';
import { STAT_METADATA, parseCurrency } from '../shared/statUtils';

type StatKey = keyof Omit<Stats, 'hp' | 'mp' | 'exp' | 'level' | 'nextLevelExp' | 'stamina'>;
type MaxStatKey = 'maxHp' | 'maxMp' | 'maxStamina';

interface StatBreakdown {
    key: StatKey | MaxStatKey | 'hp' | 'mp' | 'stamina';
    base: number;
    modifier: number;
    total: number;
}

const calculateStatBreakdown = (
    character: Character,
    equipment: Equipment[],
    key: StatKey | MaxStatKey
): StatBreakdown => {
    const base = character.stats[key] as number;
    let modifier = 0;
    equipment.forEach(slot => {
        if (slot.item?.equipmentDetails?.stats?.[key]) {
            modifier += slot.item.equipmentDetails.stats[key] || 0;
        }
    });
    character.activeEffects.forEach(effect => {
        if (effect.stats[key]) {
            modifier += effect.stats[key] || 0;
        }
    });
    return { key, base, modifier, total: base + modifier };
};

const calculatePoolStatBreakdown = (
    character: Character,
    equipment: Equipment[],
    statType: 'hp' | 'mp' | 'stamina'
): StatBreakdown => {
    const maxStatKey: 'maxHp' | 'maxMp' | 'maxStamina' = statType === 'hp' ? 'maxHp' : statType === 'mp' ? 'maxMp' : 'maxStamina';
    const breakdown = calculateStatBreakdown(character, equipment, maxStatKey);
    return { ...breakdown, key: statType };
};

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


const InfoAndStatsTab: React.FC<{ character: Character; equipment: Equipment[] }> = ({ character, equipment }) => {
    const { stats } = character;
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
    
    const statBreakdowns = useMemo(() => ({
        atk: calculateStatBreakdown(character, equipment, 'atk'),
        magicPower: calculateStatBreakdown(character, equipment, 'magicPower'),
        def: calculateStatBreakdown(character, equipment, 'def'),
        spd: calculateStatBreakdown(character, equipment, 'spd'),
        burstPower: calculateStatBreakdown(character, equipment, 'burstPower'),
        constitution: calculateStatBreakdown(character, equipment, 'constitution'),
        killingIntent: calculateStatBreakdown(character, equipment, 'killingIntent'),
        expr: calculateStatBreakdown(character, equipment, 'expr'),
    }), [character, equipment]);

    const statOrder: (keyof typeof statBreakdowns)[] = ['atk', 'magicPower', 'def', 'spd', 'burstPower', 'constitution', 'killingIntent', 'expr'];

    const expPercentage = stats.nextLevelExp > 0 ? (stats.exp / stats.nextLevelExp) * 100 : 0;
    
    const StatBarDisplay: React.FC<{
        icon: React.ReactNode;
        label: string;
        breakdown: StatBreakdown;
        currentValue: number;
        barColorClass: string;
        statKey: keyof Stats;
        isTooltipVisible: boolean;
        onStatClick: (key: keyof Stats, e: React.MouseEvent) => void;
    }> = ({ icon, label, breakdown, currentValue, barColorClass, statKey, isTooltipVisible, onStatClick }) => {
        const { base, total, modifier } = breakdown;
        const percentage = total > 0 ? (currentValue / total) * 100 : 0;
        const modifierColorClass = modifier > 0 ? 'stat-mod-pos' : modifier < 0 ? 'stat-mod-neg' : '';
        const totalColorClass = total > base ? 'stat-mod-pos' : total < base ? 'stat-mod-neg' : '';
        return (
            <div className="stat-bar" onClick={(e) => onStatClick(statKey, e)}>
                {isTooltipVisible && <StatInfoTooltip statKey={statKey} character={character} equipment={equipment} />}
                <div className="stat-bar-info">
                    <div className="stat-bar-label-group">
                        <span className="stat-bar-icon">{icon}</span>
                        <span className="stat-label">{label}</span>
                    </div>
                    <span className={`stat-value ${totalColorClass}`}>
                        {Math.round(currentValue)} / {total}
                        <span className="stat-display-breakdown">
                            {' ('}{base} <span className={modifierColorClass}>{modifier >= 0 ? '+' : ''}{modifier}</span>{')'}
                        </span>
                    </span>
                </div>
                <div className="stat-bar-bg">
                    <div className={`stat-bar-fg ${barColorClass}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };
    
    const StatDisplay: React.FC<{
        icon: React.ReactNode;
        label: string;
        breakdown: StatBreakdown;
        statKey: keyof Stats;
        isTooltipVisible: boolean;
        onStatClick: (key: keyof Stats, e: React.MouseEvent) => void;
    }> = ({ icon, label, breakdown, statKey, isTooltipVisible, onStatClick }) => {
        const { base, total, modifier } = breakdown;
        const totalColorClass = total > base ? 'stat-mod-pos' : total < base ? 'stat-mod-neg' : '';
        const modifierColorClass = modifier > 0 ? 'stat-mod-pos' : modifier < 0 ? 'stat-mod-neg' : '';
        return (
            <div className="stat-display-item" onClick={(e) => onStatClick(statKey, e)}>
                {isTooltipVisible && <StatInfoTooltip statKey={statKey} character={character} equipment={equipment} />}
                <div className="stat-display-label-group">
                    <span className="stat-display-icon">{icon}</span>
                    <span className="stat-display-label">{label}:</span>
                </div>
                <div className="stat-display-values-group">
                    <span className={`stat-display-value ${totalColorClass}`}>{total}</span>
                    <span className="stat-display-breakdown">
                        {' ('}{base} <span className={modifierColorClass}>{modifier >= 0 ? '+' : ''}{modifier}</span>{')'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="char-sheet-info-tab">
            <div className="character-summary-section">
                <div className="summary-box details">
                     <h4>Thông tin</h4>
                     <p><strong>Cấp độ:</strong> {character.stats.level}</p>
                     <p><strong>Cảnh giới:</strong> {character.realm}</p>
                     <p><strong>Tuổi:</strong> {character.age} / {character.lifespan}</p>
                     <p><strong>Giới tính:</strong> {character.gender}</p>
                     <div className="character-sheet-currencies">
                        {Object.entries(character.currencies).map(([name, amount]) => {
                            const { emoji, text } = parseCurrency(name);
                            return (
                                <p key={name} className="currency-display-cs">
                                    <strong>{emoji ? `${emoji} ${text}`: text}:</strong> {amount.toLocaleString()}
                                </p>
                            );
                        })}
                     </div>
                </div>
                <div className="summary-box bio-goal">
                    <div className="summary-item">
                        <h4>Tiểu sử</h4>
                        <p>{character.background}</p>
                    </div>
                    <div className="summary-item">
                        <h4>Mục tiêu</h4>
                        <p>{character.goal}</p>
                    </div>
                </div>
            </div>
            <div className="stats-group-separator" />
            <div className="character-stats-layout">
                <div className="stat-bars-column">
                    <StatBarDisplay statKey="hp" label={STAT_METADATA.hp!.label} icon={STAT_METADATA.hp!.icon} breakdown={hpBreakdown} currentValue={stats.hp} barColorClass="hp" isTooltipVisible={activeTooltip === 'hp'} onStatClick={handleStatClick} />
                    <StatBarDisplay statKey="mp" label={STAT_METADATA.mp!.label} icon={STAT_METADATA.mp!.icon} breakdown={mpBreakdown} currentValue={stats.mp} barColorClass="mp" isTooltipVisible={activeTooltip === 'mp'} onStatClick={handleStatClick} />
                    <StatBarDisplay statKey="stamina" label={STAT_METADATA.stamina!.label} icon={STAT_METADATA.stamina!.icon} breakdown={staminaBreakdown} currentValue={stats.stamina} barColorClass="stamina" isTooltipVisible={activeTooltip === 'stamina'} onStatClick={handleStatClick} />
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
                <div className="other-stats-grid">
                    {statOrder.map((key) => {
                        const breakdown = statBreakdowns[key];
                        const meta = STAT_METADATA[key as keyof Stats];
                        if (!meta || !breakdown) return null;
                        const statKeyTyped = key as keyof Stats;
                        return (<StatDisplay key={key} statKey={statKeyTyped} label={meta.label} icon={meta.icon} breakdown={breakdown} isTooltipVisible={activeTooltip === statKeyTyped} onStatClick={handleStatClick} />);
                    })}
                </div>
            </div>
        </div>
    );
};

const StatusEffectsTab: React.FC<{ activeEffects: ActiveEffect[] }> = ({ activeEffects }) => (
    <div className="info-list">
        {activeEffects.length === 0 ? (
            <p className="empty-text">Không có hiệu ứng trạng thái nào.</p>
        ) : (
            activeEffects.map(effect => (
                <div key={effect.name} className="info-item">
                    <p className="info-item-name">{effect.name}</p>
                    <div className="info-item-details">
                        <p><strong>Nguồn:</strong> {effect.source}</p>
                        <p><strong>Thời gian:</strong> {(() => {
                            const dur = effect.duration;
                            if (dur === Infinity) return 'Vĩnh viễn';
                            if (typeof dur === 'number' && isFinite(dur)) return `${dur} lượt`;
                            return 'Vĩnh viễn';
                        })()}</p>
                        <p className="description"><strong>Mô tả:</strong> {effect.description}</p>
                    </div>
                </div>
            ))
        )}
    </div>
);

const SkillsTab: React.FC<{ skills: Skill[] }> = ({ skills }) => (
    <div className="info-list">
        {skills.length === 0 ? (
            <p className="empty-text">Chưa học được kỹ năng nào.</p>
        ) : (
            skills.map(skill => (
                <div key={skill.name} className="info-item">
                    <p className="info-item-name color-skill">{skill.name}</p>
                    <p className="description">{skill.description}</p>
                </div>
            ))
        )}
    </div>
);

type Tab = 'Thông tin' | 'Kỹ năng' | 'Trạng thái';

const CharacterSheetView: React.FC<{ gameState: GameState; }> = ({ gameState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Thông tin');
  const { character, equipment } = gameState;
  const { skills, activeEffects } = character;
  
  return (
    <div className="view-container">
       <h2 className="view-header">Bảng Nhân Vật - {character.name}</h2>
       <div className="character-sheet-modal-v2">
        <nav className="character-sheet-tabs">
          {(['Thông tin', 'Kỹ năng', 'Trạng thái'] as Tab[]).map(tab => (
            <button 
              key={tab} 
              className={`character-sheet-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <main className="character-sheet-content">
          {activeTab === 'Thông tin' && <InfoAndStatsTab character={character} equipment={equipment} />}
          {activeTab === 'Kỹ năng' && <SkillsTab skills={skills} />}
          {activeTab === 'Trạng thái' && <StatusEffectsTab activeEffects={activeEffects} />}
        </main>
      </div>
    </div>
  );
};

export default CharacterSheetView;