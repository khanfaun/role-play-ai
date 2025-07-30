import React, { useState, ChangeEvent, useRef } from 'react';
import { GameState, Item, RarityLabels, RARITY_SLUGS, Stats, ItemTypeLabels, Rarity, QualityLabels, QualitySlugs, ItemType, RegularItemTypeKeys, Location, World, Character } from '../../types';
import { STAT_METADATA } from '../shared/statUtils';
import ItemFrame from '../shared/ItemFrame';
import Button from '../shared/Button';
import { getRealmName } from '../../services/realmService';

// --- Reusable components copied from InventoryModal ---
const StatDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="inventory-stat">
        <span className="inventory-stat-label">{label}</span>
        <span className="inventory-stat-value">{typeof value === 'number' && value > 0 ? `+${value}` : value}</span>
    </div>
);

const ItemTooltip: React.FC<{ item: Item; world: World, character: Character, className?: string }> = ({ item, world, character, className }) => {
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


const KnowledgeBaseGridItem: React.FC<{ item: Item; gameState: GameState }> = ({ item, gameState }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipPositionClass, setTooltipPositionClass] = useState('');

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const tooltipWidth = 320;
            const spaceOnRight = window.innerWidth - rect.right;
            if (spaceOnRight < (tooltipWidth + 15)) {
                setTooltipPositionClass('tooltip-left');
            } else {
                setTooltipPositionClass('');
            }
        }
    };

    const qualityLabel = QualityLabels[item.quality] || '';
    const displayName = (qualityLabel && item.itemType !== 'Nhiệm vụ' && !item.name.startsWith(qualityLabel))
        ? `${qualityLabel} ${item.name}`
        : item.name;

    return (
        <div 
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            className="inventory-item-container"
            role="button"
            tabIndex={0}
            aria-label={`Vật phẩm ${displayName}`}
        >
            <div className="inventory-item-frame-wrapper">
                <ItemFrame item={item} />
                <span className="inventory-item-quantity">x{item.quantity}</span>
                <ItemTooltip item={item} world={gameState.world} character={gameState.character} className={tooltipPositionClass} />
            </div>
            <p className={`inventory-item-name ${item.itemType === 'Nhiệm vụ' ? 'color-quest' : ''}`}>{displayName}</p>
        </div>
    );
};


interface LoreViewProps {
  gameState: GameState;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (locationId: number) => void;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


const LoreView: React.FC<LoreViewProps> = ({ gameState, onUpdateLocation, onDeleteLocation }) => {
  const { lore, knowledgeBase, locations } = gameState;
  const [filter, setFilter] = useState<'lore' | 'items' | 'locations'>('lore');
  const discoveredLocations = locations.filter(l => l.isDiscovered);

  // --- State and handlers for item filtering ---
  type FilterType = 'all' | 'quest' | 'equipment' | 'pill' | 'herb' | 'material' | 'ore' | 'rune' | 'book' | 'other';
  const [activeItemFilter, setActiveItemFilter] = useState<FilterType>('all');
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
  const [selectedQualities, setSelectedQualities] = useState<Set<number>>(new Set());

  const handleRarityChange = (rarity: Rarity) => {
    setSelectedRarities(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rarity)) { newSet.delete(rarity); } else { newSet.add(rarity); }
        return newSet;
    });
  };

  const handleQualityChange = (quality: number) => {
      setSelectedQualities(prev => {
          const newSet = new Set(prev);
          if (newSet.has(quality)) { newSet.delete(quality); } else { newSet.add(quality); }
          return newSet;
      });
  };

  const filteredItems = (knowledgeBase.items || []).filter(item => {
    const typeFilterMatch = (() => {
        switch(activeItemFilter) {
            case 'quest': return item.itemType === 'Nhiệm vụ';
            case 'equipment': return item.itemType === 'Trang bị';
            case 'pill': return item.type === 'pill';
            case 'herb': return item.type === 'herb';
            case 'material': return item.type === 'material';
            case 'ore': return item.type === 'ore';
            case 'rune': return item.type === 'rune';
            case 'book': return item.type === 'book';
            case 'other': return item.type === 'other' && item.itemType !== 'Nhiệm vụ';
            case 'all': default: return true;
        }
    })();
    if (!typeFilterMatch) return false;
    if (selectedRarities.size > 0 && !selectedRarities.has(item.rarity)) return false;
    if (selectedQualities.size > 0 && !selectedQualities.has(item.quality)) return false;
    return true;
  }).sort((a,b) => {
      const rarityOrder: Record<string, number> = { 'thần thoại': 5, 'huyền thoại': 4, 'sử thi': 3, 'quý': 2, 'hiếm': 1, 'thường': 0 };
      const rarityA = rarityOrder[a.rarity] ?? 0;
      const rarityB = rarityOrder[b.rarity] ?? 0;
      if (rarityA !== rarityB) return rarityB - rarityA;
      if(a.quality !== b.quality) return b.quality - a.quality;
      return a.name.localeCompare(b.name);
  });
  
  // --- State and handlers for location filtering & editing ---
  const [safetyFilter, setSafetyFilter] = useState<Set<'safe' | 'dangerous'>>(new Set());
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const handleSafetyFilterChange = (filter: 'safe' | 'dangerous') => {
      setSafetyFilter(prev => {
          const newSet = new Set(prev);
          if (newSet.has(filter)) { newSet.delete(filter); } else { newSet.add(filter); }
          return newSet;
      });
  };

  const handleToggleRegion = (regionName: string) => {
    setOpenRegions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(regionName)) { newSet.delete(regionName); } else { newSet.add(regionName); }
        return newSet;
    });
  };
  
  const handleStartEdit = (location: Location) => { setEditingLocation(JSON.parse(JSON.stringify(location))); };
  const handleCancelEdit = () => { setEditingLocation(null); };
  const handleSaveEdit = () => { if (editingLocation) { onUpdateLocation(editingLocation); setEditingLocation(null); }};

  const filteredLocations = discoveredLocations.filter(loc => {
    if (safetyFilter.size === 0) return true;
    const isSafe = loc.isSafeZone === true;
    if (safetyFilter.has('safe') && isSafe) return true;
    if (safetyFilter.has('dangerous') && !isSafe) return true;
    return false;
  });

  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    const region = loc.region || 'Chưa rõ khu vực';
    if (!acc[region]) acc[region] = [];
    acc[region].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  return (
    <div className="view-container">
      <h2 className="view-header">Tri Thức & Khám Phá</h2>
      <div className="view-filters">
        <button onClick={() => setFilter('lore')} className={`filter-button ${filter === 'lore' ? 'active' : ''}`}>Tri Thức Thế Giới ({lore.length})</button>
        <button onClick={() => setFilter('items')} className={`filter-button ${filter === 'items' ? 'active' : ''}`}>Vật Phẩm Đã Biết ({knowledgeBase.items.length})</button>
        <button onClick={() => setFilter('locations')} className={`filter-button ${filter === 'locations' ? 'active' : ''}`}>Địa Điểm Đã Biết ({discoveredLocations.length})</button>
      </div>
      
      {filter === 'lore' && (
        <div className="info-list-view"><div className="info-list">
            {lore.length === 0 ? <p className="empty-text">Chưa thu thập được tri thức nào.</p> : [...lore].sort((a,b) => b.id - a.id).map((entry) => (
                <div key={entry.id} className="info-item lore-item">
                    <p className="info-item-name color-lore">{entry.title}</p>
                    <p className="description">{entry.content}</p>
                </div>
            ))}
        </div></div>
      )}

      {filter === 'items' && (
         <div className="inventory-layout">
            <aside className="inventory-filters-sidebar">
                <div className="filter-group">
                    <h4 className="filter-group-title">Độ hiếm</h4>
                    <div className="filter-checkbox-list">
                        {(Object.keys(RarityLabels) as Rarity[]).map((key) => (<div key={key} className="filter-checkbox-item">
                            <input type="checkbox" id={`rarity-${key}`} checked={selectedRarities.has(key)} onChange={() => handleRarityChange(key)} className="filter-checkbox"/>
                            <label htmlFor={`rarity-${key}`}>{RarityLabels[key]}</label>
                        </div>))}
                    </div>
                </div>
                 <div className="filter-group">
                    <h4 className="filter-group-title">Phẩm chất</h4>
                    <div className="filter-checkbox-list">
                        {Object.entries(QualityLabels).map(([key, label]) => (<div key={key} className="filter-checkbox-item">
                            <input type="checkbox" id={`quality-${key}`} checked={selectedQualities.has(Number(key))} onChange={() => handleQualityChange(Number(key))} className="filter-checkbox"/>
                            <label htmlFor={`quality-${key}`}>{label}</label>
                        </div>))}
                    </div>
                </div>
            </aside>
            <main className="inventory-content">
                <div className="inventory-tabs">
                    <button onClick={() => setActiveItemFilter('all')} className={`inventory-tab-button ${activeItemFilter === 'all' ? 'active' : ''}`}>Tất cả</button>
                    <button onClick={() => setActiveItemFilter('quest')} className={`inventory-tab-button ${activeItemFilter === 'quest' ? 'active' : ''}`}>Nhiệm vụ</button>
                    <button onClick={() => setActiveItemFilter('equipment')} className={`inventory-tab-button ${activeItemFilter === 'equipment' ? 'active' : ''}`}>Trang bị</button>
                    <button onClick={() => setActiveItemFilter('pill')} className={`inventory-tab-button ${activeItemFilter === 'pill' ? 'active' : ''}`}>Đan dược</button>
                    <button onClick={() => setActiveItemFilter('herb')} className={`inventory-tab-button ${activeItemFilter === 'herb' ? 'active' : ''}`}>Dược liệu</button>
                    <button onClick={() => setActiveItemFilter('material')} className={`inventory-tab-button ${activeItemFilter === 'material' ? 'active' : ''}`}>Vật liệu</button>
                    <button onClick={() => setActiveItemFilter('ore')} className={`inventory-tab-button ${activeItemFilter === 'ore' ? 'active' : ''}`}>Khoáng thạch</button>
                    <button onClick={() => setActiveItemFilter('rune')} className={`inventory-tab-button ${activeItemFilter === 'rune' ? 'active' : ''}`}>Phù chú</button>
                    <button onClick={() => setActiveItemFilter('book')} className={`inventory-tab-button ${activeItemFilter === 'book' ? 'active' : ''}`}>Sách</button>
                    <button onClick={() => setActiveItemFilter('other')} className={`inventory-tab-button ${activeItemFilter === 'other' ? 'active' : ''}`}>Khác</button>
                </div>
                {filteredItems.length === 0 ? <p className="empty-text">Không có vật phẩm nào.</p> : <div className="inventory-grid">
                    {filteredItems.map((item) => (<KnowledgeBaseGridItem key={`${item.id}-${item.name}`} item={item} gameState={gameState} />))}
                </div>}
            </main>
        </div>
      )}
      
      {filter === 'locations' && (
        <div className="inventory-layout">
          <aside className="inventory-filters-sidebar">
            <div className="filter-group">
                <h4 className="filter-group-title">Trạng Thái</h4>
                <div className="filter-checkbox-list">
                    <div className="filter-checkbox-item">
                        <input type="checkbox" id="safety-safe" checked={safetyFilter.has('safe')} onChange={() => handleSafetyFilterChange('safe')} className="filter-checkbox"/>
                        <label htmlFor="safety-safe">An Toàn</label>
                    </div>
                    <div className="filter-checkbox-item">
                        <input type="checkbox" id="safety-dangerous" checked={safetyFilter.has('dangerous')} onChange={() => handleSafetyFilterChange('dangerous')} className="filter-checkbox"/>
                        <label htmlFor="safety-dangerous">Nguy Hiểm</label>
                    </div>
                </div>
            </div>
          </aside>
          <main className="inventory-content" style={{padding: '0 1rem'}}>
             {Object.keys(groupedLocations).length === 0 ? (
                <p className="empty-text">Không có địa điểm nào.</p>
             ) : (
                <div className="accordion-container">
                    {Object.entries(groupedLocations).map(([region, regionLocations]) => (
                        <div className="accordion-item" key={region}>
                            <button className="accordion-header" onClick={() => handleToggleRegion(region)} aria-expanded={openRegions.has(region)}>
                                <span>{region} ({regionLocations.length})</span>
                                <span className={`accordion-icon ${openRegions.has(region) ? 'open' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </span>
                            </button>
                            {openRegions.has(region) && (
                                <div className="accordion-content">
                                    <div className="info-list">
                                        {regionLocations.map(location => {
                                            const safetyClass = location.isSafeZone === true ? 'color-safe' : location.isSafeZone === false ? 'color-danger' : 'color-location';
                                            return (
                                                editingLocation?.id === location.id ? (
                                                    <div key={location.id} className="addon-item">
                                                        <div className="form-field"><label>Tên</label><input type="text" className="form-input" value={editingLocation.name} onChange={e => setEditingLocation({...editingLocation, name: e.target.value})} autoFocus/></div>
                                                        <div className="form-field"><label>Vùng</label><input type="text" className="form-input" value={editingLocation.region} onChange={e => setEditingLocation({...editingLocation, region: e.target.value})}/></div>
                                                        <div className="form-field"><label>Mô tả</label><textarea className="form-textarea" value={editingLocation.description} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})}></textarea></div>
                                                        <div className="form-field-checkbox"><input type="checkbox" className="form-checkbox" id={`edit-safe-${location.id}`} checked={!!editingLocation.isSafeZone} onChange={e => setEditingLocation({...editingLocation, isSafeZone: e.target.checked})}/><label htmlFor={`edit-safe-${location.id}`}>Là khu an toàn?</label></div>
                                                        <div className="addon-item-actions"><Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button><Button variant="primary" onClick={handleSaveEdit}>Lưu</Button></div>
                                                    </div>
                                                ) : (
                                                    <div key={location.id} className="info-item location-item-card">
                                                        <div className="info-item-header">
                                                            <div className="location-title-group">
                                                                <p className={`info-item-name ${safetyClass}`}>{location.name}</p>
                                                                {location.isSafeZone !== undefined && (
                                                                    <span className={`safety-badge ${location.isSafeZone ? 'safe' : 'danger'}`}>
                                                                        {location.isSafeZone ? 'An toàn' : 'Nguy hiểm'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="rule-actions">
                                                                <button onClick={() => handleStartEdit(location)} className="rule-action-btn edit" aria-label="Sửa"><EditIcon /></button>
                                                                <button onClick={() => onDeleteLocation(location.id)} className="rule-action-btn delete" aria-label="Xóa"><DeleteIcon /></button>
                                                            </div>
                                                        </div>
                                                        {location.description && (
                                                            <div className="info-item-details">
                                                                <p className="description">{location.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             )}
          </main>
        </div>
      )}
    </div>
  );
};

export default LoreView;