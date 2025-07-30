import React from 'react';
import { GameState, EntityType } from '../../types';

interface InteractiveTextRendererProps {
  text: string;
  gameState: GameState;
  onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number }) => void;
}

const InteractiveTextRenderer: React.FC<InteractiveTextRendererProps> = ({ text, gameState, onShowTooltip }) => {
    const entities: { name: string; type: EntityType; }[] = [
        ...(gameState.character.skills || []).map(e => ({ name: e.name, type: 'skill' as EntityType })),
        // Use knowledgeBase for items and equipment tooltips in the story
        ...(gameState.knowledgeBase?.items || []).map(e => ({
            name: e.name,
            type: e.itemType === 'Trang bị' ? 'equipment' as EntityType : 'item' as EntityType
        })),
        ...(gameState.npcs || []).map(e => ({ name: e.name, type: 'npc' as EntityType })),
        ...(gameState.locations || []).map(e => ({ name: e.name, type: 'location' as EntityType })),
        ...(gameState.factions || []).map(e => ({ name: e.name, type: 'faction' as EntityType })),
        ...(gameState.lore || []).map(e => ({ name: e.title, type: 'lore' as EntityType })),
        ...(gameState.quests || []).map(e => ({ name: e.title, type: 'quest' as EntityType })),
    ];
    
    const uniqueEntities = Array.from(new Map(entities.map(e => [e.name, e])).values())
      .filter(e => e.name && e.name.trim() !== '')
      .sort((a, b) => b.name.length - a.name.length);

    if (uniqueEntities.length === 0 || !text) {
        return <>{text}</>;
    }

    // Add 'i' flag for case-insensitivity and 'g' for global matching.
    const regex = new RegExp(`(${uniqueEntities.map(e => e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    
    // The filter(Boolean) is important to remove empty strings that can result from split
    const parts = text.split(regex).filter(Boolean);

    return (
        <>
            {parts.map((part, index) => {
                // Find entity by comparing lowercase names to handle case-insensitivity
                const entity = uniqueEntities.find(e => e.name.toLowerCase() === part.toLowerCase());
                if (entity) {
                    // This part is a matched entity name
                    return (
                        <span
                            key={`${part}-${index}`}
                            className={`interactive-text ${entity.type}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Pass the original, correctly cased name to the tooltip handler
                                onShowTooltip(entity.type, entity.name, { x: e.clientX, y: e.clientY });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                                    onShowTooltip(entity.type, entity.name, { x: rect.left, y: rect.bottom });
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            {part}
                        </span>
                    );
                }
                // This part is a plain text segment
                return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
            })}
        </>
    );
};

export default InteractiveTextRenderer;