import React, { useEffect } from 'react';
import { TooltipState, NPC, Item, Skill, Location, Faction, Lore, EntityType, Quest, Stats, RarityLabels, QualityLabels, QualitySlugs, RARITY_SLUGS, FactionAlignmentLabels } from '../../types';
import { STAT_METADATA } from './statUtils';
import ItemFrame from '../shared/ItemFrame';

const renderContent = (type: EntityType, entity: TooltipState['entity']) => {
    const colorClass = `color-${type}`;

    switch (type) {
        case 'npc': {
            const npc = entity as NPC;
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title ${colorClass}`}>{npc.name}</h3>
                        <span className={`tooltip-badge relationship-badge ${npc.relationship?.toLowerCase().replace(/\s+/g, '-') || 'chưa'}`}>{npc.relationship || 'Chưa rõ'}</span>
                    </div>
                    <div className="tooltip-body">
                        <p><strong>Giới tính:</strong> {npc.gender ?? '???'}</p>
                        <p><strong>Tuổi:</strong> {npc.age ?? '???'}</p>
                        <p><strong>Cảnh giới:</strong> {npc.realm ?? '???'}</p>
                        <p><strong>Tính cách:</strong> {npc.personality ?? '???'}</p>
                        {npc.description && <p className="description">{npc.description}</p>}
                    </div>
                </>
            );
        }
        case 'item':
        case 'equipment': {
            const item = entity as Item;
            const isQuestItem = item.itemType === 'Nhiệm vụ';

            if (isQuestItem) {
                return (
                    <>
                        <div className="tooltip-header">
                            <h3 className="tooltip-title color-quest">{item.name}</h3>
                            <span className="tooltip-badge">{item.itemType}</span>
                        </div>
                        <div className="tooltip-body">
                            <p><strong>Số lượng:</strong> {item.quantity}</p>
                            {item.description && <p className="description">{item.description}</p>}
                        </div>
                    </>
                );
            }

            // New V2 layout for non-quest items
            const raritySlug = RARITY_SLUGS[item.rarity] || 'thuong';
            const qualitySlug = QualitySlugs[item.quality] || '';

            const allStats: { label: string; value: string | number }[] = [];
            const statsSource = item.equipmentDetails?.stats || item.stats;
            if (statsSource) {
                 Object.entries(statsSource).forEach(([key, value]) => {
                    if (value && value !== 0) {
                        const statKey = key as keyof Stats;
                        const label = STAT_METADATA[statKey]?.label || key;
                        allStats.push({ label, value });
                    }
                });
            }

            return (
                <div className="tooltip-v2-container">
                    <div className="tooltip-v2-header">
                        <h3 className={`tooltip-v2-title rarity-${raritySlug}`}>{item.name}</h3>
                    </div>
                    <div className="tooltip-v2-body">
                        <div className="tooltip-v2-left">
                            <ItemFrame item={item} />
                        </div>
                        <div className="tooltip-v2-right">
                            <div className="tooltip-v2-badges">
                                {qualitySlug && <span className={`quality-badge quality-${qualitySlug}`}>{QualityLabels[item.quality]}</span>}
                                <span className={`rarity-badge rarity-${raritySlug}`}>{RarityLabels[item.rarity]}</span>
                            </div>
                            <p className="tooltip-v2-description">{item.description}</p>
                            
                            {(item.effects && item.effects.length > 0) && (
                                <p className="tooltip-v2-effects"><strong>Hiệu ứng: </strong>{item.effects.join('; ')}</p>
                            )}
                            {(item.equipmentDetails?.effects && item.equipmentDetails.effects.length > 0) && (
                                <p className="tooltip-v2-effects"><strong>Hiệu ứng: </strong>{item.equipmentDetails.effects.join('; ')}</p>
                            )}

                            {allStats.length > 0 && (
                                <div className="tooltip-v2-stats">
                                    <h4 className="tooltip-v2-stats-header">CHỈ SỐ</h4>
                                    <div className="tooltip-v2-stats-grid">
                                        {allStats.map(({ label, value }) => (
                                            <div className="tooltip-stat-item" key={label}>
                                                <span>{label}:</span>
                                                <span className={Number(value) > 0 ? 'stat-mod-pos' : 'stat-mod-neg'}>
                                                    {Number(value) > 0 ? `+${value}` : value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        case 'skill': {
            const skill = entity as Skill;
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title ${colorClass}`}>{skill.name}</h3>
                        <span className="tooltip-badge">Kỹ năng</span>
                    </div>
                    <div className="tooltip-body">
                        {skill.description && <p className="description">{skill.description}</p>}
                    </div>
                </>
            );
        }
        case 'location': {
            const location = entity as Location;
            const safetyClass = location.isSafeZone === true ? 'color-safe' : location.isSafeZone === false ? 'color-danger' : 'color-location';
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title ${safetyClass}`}>{location.name}</h3>
                        {location.isSafeZone !== undefined && (
                            <span className={`tooltip-badge safety-badge ${location.isSafeZone ? 'safe' : 'danger'}`}>
                                {location.isSafeZone ? 'An toàn' : 'Nguy hiểm'}
                            </span>
                        )}
                    </div>
                    <div className="tooltip-body">
                        <p><strong>Vùng:</strong> {location.region ?? '???'}</p>
                        {location.description && <p className="description">{location.description}</p>}
                    </div>
                </>
            );
        }
        case 'faction': {
            const faction = entity as Faction;
            const alignmentText = FactionAlignmentLabels[faction.alignment || ''] || faction.alignment || 'Chưa rõ';
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title ${colorClass}`}>{faction.name}</h3>
                        <span className={`tooltip-badge alignment-badge ${alignmentText.toLowerCase().replace(/\s+/g, '-')}`}>{alignmentText}</span>
                    </div>
                    <div className="tooltip-body">
                        <p><strong>Uy tín:</strong> {faction.reputation ?? '???'}</p>
                        {faction.description && <p className="description">{faction.description}</p>}
                    </div>
                </>
            );
        }
        case 'lore': {
            const lore = entity as Lore;
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title ${colorClass}`}>{lore.title}</h3>
                        <span className="tooltip-badge">Tri thức</span>
                    </div>
                    <div className="tooltip-body">
                        {lore.content && <p className="description">{lore.content}</p>}
                    </div>
                </>
            );
        }
        case 'quest': {
            const quest = entity as Quest;
            return (
                <>
                    <div className="tooltip-header">
                        <h3 className={`tooltip-title color-quest`}>{quest.title}</h3>
                        <span className="tooltip-badge">Nhiệm vụ</span>
                    </div>
                    <div className="tooltip-body">
                        <p><strong>Trạng thái:</strong> {quest.status}</p>
                        {quest.reward && <p><strong>Phần thưởng:</strong> {quest.reward}</p>}
                        {quest.description && <p className="description">{quest.description}</p>}
                    </div>
                </>
            );
        }
        default:
            return <p>Không có thông tin.</p>;
    }
};

interface InfoTooltipProps {
  tooltipState: TooltipState | null;
  onClose: () => void;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ tooltipState, onClose }) => {
    useEffect(() => {
        if (!tooltipState) return;
        const timer = setTimeout(() => {
            document.addEventListener('click', onClose, { once: true });
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', onClose);
        };
    }, [tooltipState, onClose]);

    if (!tooltipState) {
        return null;
    }

    const handleTooltipClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    }

    return (
        <div className="info-tooltip-overlay" onClick={onClose}>
            <div
                className="info-tooltip"
                style={{ top: `${tooltipState.position.top}px`, left: `${tooltipState.position.left}px` }}
                onClick={handleTooltipClick}
            >
                {renderContent(tooltipState.type, tooltipState.entity)}
            </div>
        </div>
    );
};

export default InfoTooltip;