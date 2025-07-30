import React from 'react';
import { Item, ItemTypeEmojis, RARITY_SLUGS } from '../../types';

interface ItemFrameProps {
  item: Item | null;
}

const ItemFrame: React.FC<ItemFrameProps> = ({ item }) => {
    if (!item) {
        return <div className="empty-item-frame">Trống</div>;
    }

    const { rarity, quality, type, itemType, pillType } = item;

    let emoji;
    if (itemType === 'Nhiệm vụ') {
        emoji = '🗝️';
    } else if (type === 'pill') {
        switch (pillType) {
            case 'Hồi Phục': emoji = '🟢'; break;
            case 'Cải tạo': emoji = '🟠'; break;
            case 'Bí Đan': emoji = '🟣'; break;
            default: emoji = ItemTypeEmojis[type] || '❓';
        }
    } else {
        emoji = ItemTypeEmojis[type] || '❓';
    }

    const raritySlug = RARITY_SLUGS[rarity] || 'thuong';
    const frameClass = itemType === 'Nhiệm vụ' ? 'quest' : raritySlug;
    
    // Ensure quality is within the 1-5 range for rendering stars
    const validQuality = Math.max(1, Math.min(5, quality || 1));

    return (
        <div className={`item-frame ${frameClass}`}>
            <div className="item-icon">{emoji}</div>
            {itemType !== 'Nhiệm vụ' && (
                <div className="star-row">
                    {Array.from({ length: validQuality }, (_, i) => (
                        <span key={i}>⭐</span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ItemFrame;