

import React, { useState, MouseEvent, useRef } from 'react';
import { Item, Stats, RarityLabels, RARITY_SLUGS, ItemTypeLabels, QualityLabels, QualitySlugs, Rarity, Character, World } from '../../types';
import Button from '../shared/Button';
import { STAT_METADATA } from '../shared/statUtils';
import ItemFrame from '../shared/ItemFrame';
import Modal from '../shared/Modal';
import { getRealmName } from '../../services/realmService';


interface InventoryViewProps {
  inventory: Item[];
  character: Character;
  world: World;
  onUseItem: (item: Item, quantity: number) => void;
  onDropItem: (item: Item, quantity: number) => void;
  onRenameItem: (itemId: number, newName: string) => void;
  onEquipItem: (item: Item) => void;
}

const StatDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="inventory-stat">
        <span className="inventory-stat-label">{label}</span>
        <span className="inventory-stat-value">{typeof value === 'number' && value > 0 ? `+${value}` : value}</span>
    </div>
);

const ItemTooltip: React.FC<{ item: Item, world: World, character: Character, className?: string }> = ({ item, world, character, className }) => {
    const rarity = item.rarity || 'thường';
    const rarityLabel = RarityLabels[rarity] || rarity;
    const raritySlug = RARITY_SLUGS[rarity] || 'thuong';
    const showUsageInfo = (item.duration != null) || (item.uses != null);

    const qualityLabel = QualityLabels[item.quality] || '';
    const qualitySlug = QualitySlugs[item.quality] || '';

    const typeLabel = ItemTypeLabels[item.type] || '';
    
    const isQuestItem = item.itemType === 'Nhiệm vụ';
    const canUse = item.requiredLevel == null || character.stats.level >= item.requiredLevel;
    const requiredRealmName = item.requiredLevel != null ? getRealmName(item.requiredLevel, world.realmSystem) : null;
    
    const displayName = (qualityLabel && item.itemType !== 'Nhiệm vụ' && !item.name.startsWith(qualityLabel))
        ? `${qualityLabel} ${item.name}`
        : item.name;

    return (
        <div className={`item-tooltip ${className || ''}`}>
            <div className={`item-tooltip-header ${isQuestItem ? 'quest' : `rarity-${raritySlug}`}`}>
                <div className="item-tooltip-title-group">
                    <h4 className={`item-tooltip-name ${isQuestItem ? 'color-quest' : ''}`}>{displayName}</h4>
                     {!isQuestItem && (
                         <span className={`inventory-rarity-badge rarity-${raritySlug}`}>
                            {rarityLabel}
                        </span>
                    )}
                </div>
                <span className="item-tooltip-quantity">x{item.quantity}</span>
            </div>
            <div className="item-tooltip-body">
                <div className="inventory-card-tags">
                    <span className="tag type">{item.itemType}</span>
                     {!isQuestItem && qualityLabel && (
                        <span className={`tag quality-tag quality-${qualitySlug}`}>{qualityLabel}</span>
                    )}
                    {typeLabel && !isQuestItem && (
                        <span className="tag type">{typeLabel}</span>
                    )}
                    {item.type === 'pill' && item.pillType && (
                        <span className="tag type">{item.pillType}</span>
                    )}
                </div>
                <p className="inventory-card-description">{item.description}</p>
                <div className="inventory-card-details">
                     {requiredRealmName && (
                        <p className={`item-requirement ${canUse ? 'met' : 'unmet'}`}>
                            Yêu cầu: {requiredRealmName}
                        </p>
                    )}
                    {item.equipmentDetails?.stats && Object.keys(item.equipmentDetails.stats).length > 0 && (
                        <div className="stat-section">
                            <h5>Chỉ Số Trang Bị</h5>
                            <div className="stat-grid">
                                {Object.entries(item.equipmentDetails.stats).map(([key, value]) => {
                                    const statKey = key as keyof Stats;
                                    const label = STAT_METADATA[statKey]?.label || key;
                                    return (value && value !== 0) ? (
                                        <StatDisplay key={key} label={label} value={value} />
                                    ) : null
                                })}
                            </div>
                        </div>
                    )}
                    {item.equipmentDetails?.effects && item.equipmentDetails.effects.length > 0 && (
                        <div className="stat-section">
                            <h5>Hiệu Ứng Đặc Biệt</h5>
                            <p className="effects-list">{item.equipmentDetails.effects.join('; ')}</p>
                        </div>
                    )}
                    {item.isConsumable && (
                        <>
                            {(() => {
                                const isSpecialPill = item.type === 'pill' && (item.pillType === 'Cải tạo' || item.pillType === 'Bí Đan');
                                if (!item.stats || Object.keys(item.stats).length === 0) return null;
                                
                                let statsEntries = Object.entries(item.stats);
                                if (isSpecialPill) {
                                    statsEntries = statsEntries.filter(([key]) => !['hp', 'mp', 'stamina'].includes(key));
                                }
                                
                                const visibleStats = statsEntries.filter(([, value]) => value && value !== 0);
                                if (visibleStats.length === 0) return null;
                                
                                return (
                                    <div className="stat-section">
                                        <h5>Hiệu Ứng Khi Dùng</h5>
                                        <div className="stat-grid">
                                            {visibleStats.map(([key, value]) => {
                                                const statKey = key as keyof Stats;
                                                const label = STAT_METADATA[statKey]?.label || key;
                                                return <StatDisplay key={key} label={label} value={value} />;
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                            {showUsageInfo && (
                                <div className="stat-section">
                                    <h5>Thông Tin Sử Dụng</h5>
                                    <div className="stat-grid">
                                        {(item.duration != null) && (
                                            <StatDisplay label="Số lượt tác dụng" value={`${item.duration} lượt`} />
                                        )}
                                        {(item.uses != null) && <StatDisplay label="Số lần sử dụng" value={`${item.uses} lần`} />}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const InventoryItem: React.FC<{
    item: Item;
    character: Character;
    world: World;
    isSelected: boolean;
    onSelect: () => void;
    onDeselect: () => void;
    onUseItem: (item: Item) => void;
    onDropItem: (item: Item) => void;
    onRenameItem: (item: Item) => void;
    onEquipItem: (item: Item) => void;
}> = ({ item, character, world, isSelected, onSelect, onDeselect, onUseItem, onDropItem, onRenameItem, onEquipItem }) => {
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipPositionClass, setTooltipPositionClass] = useState('');

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const tooltipWidth = 320; // from css .item-tooltip
            const spaceOnRight = window.innerWidth - rect.right;
            if (spaceOnRight < (tooltipWidth + 15)) { // 15 is margin from `left: calc(100% + 15px)`
                setTooltipPositionClass('tooltip-left');
            } else {
                setTooltipPositionClass('');
            }
        }
    };
    
    const canUse = item.itemType === 'Nhiệm vụ' || item.requiredLevel == null || character.stats.level >= item.requiredLevel;

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };
    
    const qualityLabel = QualityLabels[item.quality] || '';
    const displayName = (qualityLabel && item.itemType !== 'Nhiệm vụ' && !item.name.startsWith(qualityLabel))
        ? `${qualityLabel} ${item.name}`
        : item.name;

    const renderActions = () => {
        if (!isSelected || !canUse) return null;
        
        const handleActionClick = (e: MouseEvent, action: (item: Item) => void) => {
            e.stopPropagation();
            action(item);
            onDeselect();
        };

        const handleRenameClick = (e: MouseEvent) => {
             e.stopPropagation();
             onRenameItem(item);
             // Keep item selected after opening rename modal
        }

        const isUnusableMaterial = ['material', 'ore', 'herb', 'book'].includes(item.type);
        
        return (
            <div className="inventory-item-actions">
                {item.itemType === 'Trang bị' && 
                    <Button variant="primary" onClick={(e) => handleActionClick(e, onEquipItem)} disabled={!canUse}>Trang bị</Button>
                }
                {item.itemType === 'Vật phẩm thường' && item.isConsumable && !isUnusableMaterial &&
                    <Button variant="primary" onClick={(e) => handleActionClick(e, onUseItem)} disabled={!canUse}>Sử dụng</Button>
                }
                <Button variant="danger" onClick={(e) => handleActionClick(e, onDropItem)}>Xóa</Button>
                <button className="inventory-rename-link" onClick={handleRenameClick}>
                    Sửa tên
                </button>
            </div>
        );
    };

    return (
        <div 
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            className={`inventory-item-container ${isSelected ? 'selected' : ''} ${!canUse ? 'disabled' : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`Vật phẩm ${displayName}`}
        >
            <div className="inventory-item-frame-wrapper">
                <ItemFrame item={item} />
                 {!canUse && <div className="item-lock-overlay">🔒</div>}
                <span className="inventory-item-quantity">x{item.quantity}</span>
                {renderActions()}
                <ItemTooltip item={item} world={world} character={character} className={tooltipPositionClass} />
            </div>
            <p className={`inventory-item-name ${item.itemType === 'Nhiệm vụ' ? 'color-quest' : ''}`}>{displayName}</p>
        </div>
    );
};

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, character, world, onUseItem, onDropItem, onRenameItem, onEquipItem }) => {
    type FilterType = 'all' | 'quest' | 'equipment' | 'pill' | 'herb' | 'material' | 'ore' | 'rune' | 'book' | 'other';
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
    const [quantityModalItem, setQuantityModalItem] = useState<Item | null>(null);
    const [useQuantity, setUseQuantity] = useState(1);
    const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
    const [selectedQualities, setSelectedQualities] = useState<Set<number>>(new Set());
    
    const [dropQuantityModalItem, setDropQuantityModalItem] = useState<Item | null>(null);
    const [dropQuantity, setDropQuantity] = useState(1);

    const [renameModalItem, setRenameModalItem] = useState<Item | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [renamePrefix, setRenamePrefix] = useState('');

    const handleRarityChange = (rarity: Rarity) => {
        setSelectedRarities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rarity)) {
                newSet.delete(rarity);
            } else {
                newSet.add(rarity);
            }
            return newSet;
        });
    };

    const handleQualityChange = (quality: number) => {
        setSelectedQualities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(quality)) {
                newSet.delete(quality);
            } else {
                newSet.add(quality);
            }
            return newSet;
        });
    };

    const handleGridClick = () => {
        setSelectedItemKey(null);
    };

    const handleUseClick = (item: Item) => {
        if (item.pillType === 'Hồi Phục' && item.quantity > 1) {
            setUseQuantity(1); // Reset quantity
            setQuantityModalItem(item);
        } else {
            onUseItem(item, 1);
        }
    };
    
    const handleDropClick = (item: Item) => {
        if (item.quantity > 1) {
            setDropQuantity(1); // Reset quantity
            setDropQuantityModalItem(item);
        } else {
            onDropItem(item, 1);
        }
    };

    const handleRenameClick = (item: Item) => {
        const qualityLabel = QualityLabels[item.quality] || '';
        let currentPrefix = '';
        let currentBaseName = item.name;
    
        // Determine the correct prefix from data, if applicable
        if (qualityLabel && item.itemType !== 'Nhiệm vụ') {
            currentPrefix = qualityLabel;
        }
    
        // Determine the base name by stripping any known quality prefix
        const qualityPrefixes = Object.values(QualityLabels);
        for (const prefix of qualityPrefixes) {
            if (currentBaseName.startsWith(prefix + ' ')) {
                currentBaseName = currentBaseName.substring(prefix.length).trim();
                // If we found a prefix on the name, but our data-driven prefix is empty, use the one we found.
                // This handles edge cases like quest items having a prefixed name.
                if (!currentPrefix) {
                    currentPrefix = prefix;
                }
                break;
            }
        }
        
        setRenamePrefix(currentPrefix);
        setNewItemName(currentBaseName);
        setRenameModalItem(item);
        setSelectedItemKey(null); // Deselect item after clicking rename
    };

    const confirmUseQuantity = () => {
        if (quantityModalItem) {
            onUseItem(quantityModalItem, useQuantity);
            setQuantityModalItem(null);
        }
    };
    
    const confirmDropQuantity = () => {
        if (dropQuantityModalItem) {
            onDropItem(dropQuantityModalItem, dropQuantity);
            setDropQuantityModalItem(null);
        }
    };

    const confirmRename = () => {
        if (renameModalItem && newItemName.trim()) {
            const finalName = renamePrefix 
                ? `${renamePrefix} ${newItemName.trim()}`
                : newItemName.trim();
            onRenameItem(renameModalItem.id, finalName);
            setRenameModalItem(null);
            setRenamePrefix('');
        }
    };

    const filteredInventory = inventory.filter(item => {
        const typeFilterMatch = (() => {
            switch(activeFilter) {
                case 'quest': return item.itemType === 'Nhiệm vụ';
                case 'equipment': return item.itemType === 'Trang bị';
                case 'pill': return item.type === 'pill';
                case 'herb': return item.type === 'herb';
                case 'material': return item.type === 'material';
                case 'ore': return item.type === 'ore';
                case 'rune': return item.type === 'rune';
                case 'book': return item.type === 'book';
                case 'other': return item.type === 'other' && item.itemType !== 'Nhiệm vụ';
                case 'all':
                default:
                    return true;
            }
        })();
        if (!typeFilterMatch) return false;

        if (selectedRarities.size > 0 && !selectedRarities.has(item.rarity)) {
            return false;
        }

        if (selectedQualities.size > 0 && !selectedQualities.has(item.quality)) {
            return false;
        }

        return true;
    }).sort((a,b) => {
        const rarityOrder: Record<string, number> = { 'thần thoại': 5, 'huyền thoại': 4, 'sử thi': 3, 'quý': 2, 'hiếm': 1, 'thường': 0 };
        const rarityA = rarityOrder[a.rarity] ?? 0;
        const rarityB = rarityOrder[b.rarity] ?? 0;
        if (rarityA !== rarityB) return rarityB - rarityA;
        if(a.quality !== b.quality) return b.quality - a.quality;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="view-container">
            <h2 className="view-header">Balo Đồ</h2>
            <div className="inventory-layout">
                <aside className="inventory-filters-sidebar">
                    <div className="filter-group">
                        <h4 className="filter-group-title">Độ hiếm</h4>
                        <div className="filter-checkbox-list">
                            {(Object.keys(RarityLabels) as Rarity[]).map((key) => (
                                <div key={key} className="filter-checkbox-item">
                                    <input
                                        type="checkbox"
                                        id={`rarity-${key}`}
                                        checked={selectedRarities.has(key)}
                                        onChange={() => handleRarityChange(key)}
                                        className="filter-checkbox"
                                    />
                                    <label htmlFor={`rarity-${key}`}>{RarityLabels[key]}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="filter-group">
                        <h4 className="filter-group-title">Phẩm chất</h4>
                        <div className="filter-checkbox-list">
                            {Object.entries(QualityLabels).map(([key, label]) => (
                                <div key={key} className="filter-checkbox-item">
                                    <input
                                        type="checkbox"
                                        id={`quality-${key}`}
                                        checked={selectedQualities.has(Number(key))}
                                        onChange={() => handleQualityChange(Number(key))}
                                        className="filter-checkbox"
                                    />
                                    <label htmlFor={`quality-${key}`}>{label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="inventory-content">
                    <div className="inventory-tabs">
                        <button onClick={() => setActiveFilter('all')} className={`inventory-tab-button ${activeFilter === 'all' ? 'active' : ''}`}>Tất cả</button>
                        <button onClick={() => setActiveFilter('quest')} className={`inventory-tab-button ${activeFilter === 'quest' ? 'active' : ''}`}>Nhiệm vụ</button>
                        <button onClick={() => setActiveFilter('equipment')} className={`inventory-tab-button ${activeFilter === 'equipment' ? 'active' : ''}`}>Trang bị</button>
                        <button onClick={() => setActiveFilter('pill')} className={`inventory-tab-button ${activeFilter === 'pill' ? 'active' : ''}`}>Đan dược</button>
                        <button onClick={() => setActiveFilter('herb')} className={`inventory-tab-button ${activeFilter === 'herb' ? 'active' : ''}`}>Dược liệu</button>
                        <button onClick={() => setActiveFilter('material')} className={`inventory-tab-button ${activeFilter === 'material' ? 'active' : ''}`}>Vật liệu</button>
                        <button onClick={() => setActiveFilter('ore')} className={`inventory-tab-button ${activeFilter === 'ore' ? 'active' : ''}`}>Khoáng thạch</button>
                        <button onClick={() => setActiveFilter('rune')} className={`inventory-tab-button ${activeFilter === 'rune' ? 'active' : ''}`}>Phù chú</button>
                        <button onClick={() => setActiveFilter('book')} className={`inventory-tab-button ${activeFilter === 'book' ? 'active' : ''}`}>Sách</button>
                        <button onClick={() => setActiveFilter('other')} className={`inventory-tab-button ${activeFilter === 'other' ? 'active' : ''}`}>Khác</button>
                    </div>
                    
                    {filteredInventory.length === 0 ? (
                        <p className="empty-text">Không có vật phẩm nào.</p>
                    ) : (
                        <div className="inventory-grid" onClick={handleGridClick}>
                            {filteredInventory.map((item, index) => {
                                const itemKey = `${item.id}-${item.name}-${index}`;
                                return (
                                    <InventoryItem 
                                        key={itemKey} 
                                        item={item}
                                        character={character}
                                        world={world}
                                        isSelected={selectedItemKey === itemKey}
                                        onSelect={() => setSelectedItemKey(prev => prev === itemKey ? null : itemKey)}
                                        onDeselect={() => setSelectedItemKey(null)}
                                        onUseItem={handleUseClick}
                                        onDropItem={handleDropClick}
                                        onRenameItem={handleRenameClick}
                                        onEquipItem={onEquipItem}
                                    />
                                )})}
                        </div>
                    )}
                </main>
            </div>
            {quantityModalItem && (
                <Modal
                    isOpen={true}
                    onClose={() => setQuantityModalItem(null)}
                    title={`Sử dụng ${quantityModalItem.name}`}
                >
                    <div className="form-field">
                        <label htmlFor="use-quantity-input">Số lượng (Tối đa: {quantityModalItem.quantity})</label>
                        <input
                            id="use-quantity-input"
                            type="number"
                            className="form-input"
                            value={useQuantity}
                            onChange={e => {
                                const val = Math.max(1, Math.min(quantityModalItem.quantity, Number(e.target.value) || 1));
                                setUseQuantity(val);
                            }}
                            min="1"
                            max={quantityModalItem.quantity}
                            autoFocus
                        />
                    </div>
                    <div className="confirmation-actions">
                        <Button variant="secondary" onClick={() => setQuantityModalItem(null)}>Hủy</Button>
                        <Button variant="primary" onClick={confirmUseQuantity}>Xác nhận</Button>
                    </div>
                </Modal>
            )}
            {dropQuantityModalItem && (
                <Modal
                    isOpen={true}
                    onClose={() => setDropQuantityModalItem(null)}
                    title={`Vứt ${dropQuantityModalItem.name}`}
                >
                    <div className="form-field">
                        <label htmlFor="drop-quantity-input">Số lượng muốn vứt (Tối đa: {dropQuantityModalItem.quantity})</label>
                        <input
                            id="drop-quantity-input"
                            type="number"
                            className="form-input"
                            value={dropQuantity}
                            onChange={e => {
                                const val = Math.max(1, Math.min(dropQuantityModalItem.quantity, Number(e.target.value) || 1));
                                setDropQuantity(val);
                            }}
                            min="1"
                            max={dropQuantityModalItem.quantity}
                            autoFocus
                        />
                    </div>
                    <div className="confirmation-actions">
                        <Button variant="secondary" onClick={() => setDropQuantityModalItem(null)}>Hủy</Button>
                        <Button variant="danger" onClick={confirmDropQuantity}>Xác nhận</Button>
                    </div>
                </Modal>
            )}
             {renameModalItem && (
                <Modal
                    isOpen={true}
                    onClose={() => setRenameModalItem(null)}
                    title={`Sửa tên cho ${renameModalItem.name}`}
                >
                    <div className="form-field">
                        <label htmlFor="rename-item-input">Tên mới</label>
                        <div className="rename-input-group">
                           {renamePrefix && <span className="rename-prefix">{renamePrefix}</span>}
                           <input
                                id="rename-item-input"
                                type="text"
                                className="form-input"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') confirmRename() }}
                            />
                        </div>
                    </div>
                    <div className="confirmation-actions">
                        <Button variant="secondary" onClick={() => setRenameModalItem(null)}>Hủy</Button>
                        <Button variant="primary" onClick={confirmRename}>Xác nhận</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default InventoryView;