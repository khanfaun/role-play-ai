

import React from 'react';
import { Equipment, EquipmentSlot, RarityLabels, RARITY_SLUGS, Stats, QualityLabels, QualitySlugs, World, Character } from '../../types';
import Button from '../shared/Button';
import ItemFrame from '../shared/ItemFrame';
import { STAT_METADATA } from '../shared/statUtils';
import { getRealmName } from '../../services/realmService';

interface EquipmentViewProps {
  equipment: Equipment[];
  world: World;
  character: Character;
  onUnequipItem: (slot: EquipmentSlot) => void;
}

const EquipmentView: React.FC<EquipmentViewProps> = ({ equipment, world, character, onUnequipItem }) => {
  const slotOrder: EquipmentSlot[] = ['Vũ khí', 'Pháp Bảo', 'Giáp', 'Áo choàng', 'Mũ', 'Găng tay', 'Giày', 'Phụ kiện'];

  const sortedEquipment = [...equipment]
    .filter(equip => slotOrder.includes(equip.slot))
    .sort((a, b) => {
      return slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot);
    });

  return (
    <div className="view-container">
      <h2 className="view-header">Trang Bị</h2>
      <div className="equipment-modal">
        <div className="equipment-grid">
          {sortedEquipment.map((equip) => {
            const item = equip.item;
            const raritySlug = item ? RARITY_SLUGS[item.rarity] || 'thuong' : 'thuong';
            const qualityLabel = item ? QualityLabels[item.quality] : '';
            const qualitySlug = item ? QualitySlugs[item.quality] : '';
            const statEntries = item ? Object.entries(item.equipmentDetails?.stats || {}).filter(([, value]) => value && value !== 0) : [];
            const effects = item ? item.equipmentDetails?.effects?.filter(e => e.trim()) || [] : [];
            
            const canUse = item?.requiredLevel == null || character.stats.level >= item.requiredLevel;
            const requiredRealmName = item?.requiredLevel != null ? getRealmName(item.requiredLevel, world.realmSystem) : null;
            
            const displayName = (item && qualityLabel && item.itemType !== 'Nhiệm vụ' && !item.name.startsWith(qualityLabel))
                ? `${qualityLabel} ${item.name}`
                : (item ? item.name : '');

            return (
              <div key={equip.slot} className="equipment-slot">
                <h4 className="slot-name">{equip.slot}</h4>
                <div className="equipment-item-display">
                  <ItemFrame item={item} />
                  <div className="item-details">
                    {item ? (
                      <>
                        <div className="equipment-item-header">
                          <p className={`item-name ${item.itemType === 'Nhiệm vụ' ? 'color-quest' : `color-equipment rarity-${raritySlug}`}`}>{displayName}</p>
                           {item.itemType !== 'Nhiệm vụ' && (
                             <div className="badge-group">
                               {qualityLabel && (
                                  <span className={`equipment-quality-badge quality-${qualitySlug}`}>{qualityLabel}</span>
                                )}
                                <span className={`equipment-rarity-badge rarity-${raritySlug}`}>
                                  {RarityLabels[item.rarity]}
                                </span>
                             </div>
                           )}
                        </div>
                        
                        <p className="equipment-item-description">{item.description}</p>

                        {requiredRealmName && (
                            <p className={`item-requirement ${canUse ? 'met' : 'unmet'}`}>Yêu cầu: {requiredRealmName}</p>
                        )}

                        {statEntries.length > 0 && (
                          <div className="equipment-stat-block">
                            <h5>Chỉ Số</h5>
                            <div className="stat-grid">
                              {statEntries.map(([key, value]) => {
                                const statKey = key as keyof Stats;
                                const meta = STAT_METADATA[statKey];
                                if (!meta) return null;
                                return (
                                  <div key={key} className="equipment-stat-item">
                                    <span>{meta.label}:</span>
                                    <span className={Number(value) > 0 ? 'stat-mod-pos' : 'stat-mod-neg'}>
                                      {Number(value) > 0 ? `+${value}` : value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {effects.length > 0 && (
                          <div className="equipment-effects-list">
                            <h5>Hiệu Ứng Đặc Biệt</h5>
                            <p>{effects.join('; ')}</p>
                          </div>
                        )}
                        
                        <div className="equipment-item-actions">
                            <Button variant="danger" onClick={() => onUnequipItem(equip.slot)}>Tháo ra</Button>
                        </div>
                      </>
                    ) : (
                      <p className="empty-slot">-- Trống --</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EquipmentView;