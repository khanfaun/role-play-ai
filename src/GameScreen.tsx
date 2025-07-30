

import React, { useState } from 'react';
import { GameState, ActiveView, ViewState, EntityType, Item, EquipmentSlot, Quest, Location } from '../types';

import StatusPanel from './panels/StatusPanel';
import QuestsPanel from './panels/QuestsPanel';
import CompanionsPanel from './panels/CompanionsPanel';

import InventoryView from './modals/InventoryModal';
import EquipmentView from './modals/EquipmentModal';
import CharacterSheetView from './modals/CharacterSheetModal';
import CraftingView from './modals/CraftingModal';
import LoreView from './modals/LoreModal';
import QuestsView from './modals/QuestsModal';
import StoryView from './StoryView';
import ManagementModal from './modals/JournalModal';


interface GameScreenProps {
  gameState: GameState;
  onPlayerAction: (action: string, sourceType: 'choice' | 'custom') => void;
  isLoading: boolean;
  activeView: ViewState | null;
  onSetActiveView: (viewState: ViewState | null) => void;
  onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number }) => void;
  onSaveGame: () => void;
  onExitToMenu: () => void;
  onUseItem: (item: Item, quantity: number) => void;
  onDropItem: (item: Item, quantity: number) => void;
  onRenameItem: (itemId: number, newName: string) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onAcceptQuest: (questId: number) => void;
  onDeclineQuest: (questId: number) => void;
  unacceptedQuestsCount: number;
  onUpdateHeavenlyRules: (rules: string[]) => void;
  onUpdateCoreMemory: (rules: string[]) => void;
  onUpdateStorySummary: (summaryId: number, newSummary: string) => void;
  onDeleteStorySummary: (summaryId: number) => void;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (locationId: number) => void;
}

interface ToolbarIconProps {
    onClick: () => void;
    children: React.ReactNode;
    label: string;
    isActive: boolean;
    isPrimary?: boolean;
    isExpanded: boolean;
    showLabelWhenExpanded?: boolean;
    wrapperClassName?: string;
    badgeCount?: number;
}


const ToolbarIcon: React.FC<ToolbarIconProps> = ({ 
    onClick, 
    children, 
    label, 
    isActive, 
    isPrimary = false, 
    isExpanded,
    showLabelWhenExpanded = true,
    wrapperClassName = '',
    badgeCount = 0,
}) => {
    
    let buttonClass = "toolbar-button";
    if (isPrimary) buttonClass += " toolbar-story-button";
    if (isActive) buttonClass += " active";
    if (isExpanded) buttonClass += " expanded";

    return (
        <div className={`toolbar-icon-wrapper ${isPrimary ? 'primary' : ''} ${wrapperClassName}`}>
            <button onClick={onClick} className={buttonClass} aria-label={label}>
                {children}
                {isExpanded && showLabelWhenExpanded && <span className="toolbar-label-visible">{label}</span>}
                {badgeCount > 0 && <span className="notification-badge">{badgeCount}</span>}
            </button>
            {!isExpanded && (
                <div className="toolbar-tooltip" role="tooltip">
                    {label}
                </div>
            )}
        </div>
    );
};


const GameScreen: React.FC<GameScreenProps> = (props) => {
    const { 
        gameState, onPlayerAction, isLoading, activeView, onSetActiveView, 
        onShowTooltip, onSaveGame, onExitToMenu, onUseItem, onDropItem, onEquipItem, onUnequipItem, onRenameItem,
        unacceptedQuestsCount, onUpdateHeavenlyRules, onUpdateCoreMemory, onUpdateStorySummary, onDeleteStorySummary,
        onUpdateLocation, onDeleteLocation
    } = props;
    const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(true);
    const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);

    const handleSetView = (type: ActiveView) => {
        if (activeView?.type === type) {
            onSetActiveView({ type: ActiveView.Story });
        } else {
            onSetActiveView({ type });
        }
    };

    const renderActiveView = () => {
        const viewType = activeView?.type ?? ActiveView.Story;
        
        switch (viewType) {
            case ActiveView.Story:
                return <StoryView 
                    gameState={gameState} 
                    onPlayerAction={onPlayerAction} 
                    isLoading={isLoading} 
                    onShowTooltip={onShowTooltip}
                />;
            case ActiveView.Inventory:
                return <InventoryView 
                    inventory={gameState.inventory}
                    character={gameState.character}
                    world={gameState.world}
                    onUseItem={onUseItem}
                    onDropItem={onDropItem}
                    onRenameItem={onRenameItem}
                    onEquipItem={onEquipItem}
                />;
             case ActiveView.Equipment:
                return <EquipmentView 
                    equipment={gameState.equipment} 
                    world={gameState.world}
                    onUnequipItem={onUnequipItem}
                />;
            case ActiveView.CharacterSheet:
                return <CharacterSheetView gameState={gameState} />;
            case ActiveView.Crafting:
                return <CraftingView />;
            case ActiveView.Lore:
                return <LoreView 
                    gameState={gameState} 
                    onUpdateLocation={onUpdateLocation}
                    onDeleteLocation={onDeleteLocation}
                />;
            case ActiveView.Quests:
                return <QuestsView 
                    quests={gameState.quests} 
                    onAcceptQuest={props.onAcceptQuest}
                    onDeclineQuest={props.onDeclineQuest}
                    onShowTooltip={onShowTooltip}
                    gameState={gameState}
                />;
            case ActiveView.Management:
                return <ManagementModal
                    summaries={gameState.storySummaries}
                    onUpdateSummary={onUpdateStorySummary}
                    onDeleteSummary={onDeleteStorySummary}
                    coreMemory={gameState.coreMemory}
                    onUpdateMemory={onUpdateCoreMemory}
                    dynamicRules={gameState.heavenlyRules}
                    onUpdateRules={onUpdateHeavenlyRules}
                />;
            default:
                return <StoryView 
                    gameState={gameState} 
                    onPlayerAction={onPlayerAction} 
                    isLoading={isLoading} 
                    onShowTooltip={onShowTooltip}
                />;
        }
    };

    return (
        <div className={`game-screen ${isLeftSidebarExpanded ? 'left-expanded' : 'left-collapsed'} ${isRightSidebarExpanded ? 'right-expanded' : 'right-collapsed'}`}>
            <aside className={`game-sidebar-left ${isLeftSidebarExpanded ? 'expanded' : 'collapsed'}`}>
                {isLeftSidebarExpanded && (
                    <>
                        <div className="left-sidebar-header">
                            <h3 className="left-sidebar-title">Thông Tin</h3>
                        </div>
                        <div className="sidebar-scroll-container">
                            <StatusPanel character={gameState.character} equipment={gameState.equipment} />
                            <CompanionsPanel companions={gameState.companions} />
                            <QuestsPanel quests={gameState.quests} onShowTooltip={onShowTooltip} />
                        </div>
                    </>
                )}

                <button 
                    className="left-sidebar-toggle-button"
                    onClick={() => setIsLeftSidebarExpanded(!isLeftSidebarExpanded)}
                    aria-label={isLeftSidebarExpanded ? 'Thu gọn' : 'Mở rộng'}
                >
                    {isLeftSidebarExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    )}
                </button>
            </aside>

            <main className="game-main-content">
                <div className="view-animation-wrapper" key={activeView?.type ?? 'story'}>
                   {renderActiveView()}
                </div>
            </main>

            <aside className={`game-sidebar-right ${isRightSidebarExpanded ? 'expanded' : ''}`}>
                 <ToolbarIcon
                    wrapperClassName="toolbar-toggle-button"
                    onClick={() => setIsRightSidebarExpanded(!isRightSidebarExpanded)}
                    label={isRightSidebarExpanded ? 'Thu gọn' : 'Mở rộng'}
                    isActive={false}
                    isExpanded={isRightSidebarExpanded}
                    showLabelWhenExpanded={false}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        {isRightSidebarExpanded ? (
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        ) : (
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        )}
                    </svg>
                </ToolbarIcon>

                <div className="toolbar-separator"></div>

                <ToolbarIcon onClick={() => handleSetView(ActiveView.CharacterSheet)} label="Nhân Vật" isActive={activeView?.type === ActiveView.CharacterSheet} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </ToolbarIcon>
                <ToolbarIcon onClick={() => handleSetView(ActiveView.Inventory)} label="Balo Đồ" isActive={activeView?.type === ActiveView.Inventory} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </ToolbarIcon>
                <ToolbarIcon onClick={() => handleSetView(ActiveView.Equipment)} label="Trang Bị" isActive={activeView?.type === ActiveView.Equipment} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0" />
                    </svg>
                </ToolbarIcon>
                
                <div className="toolbar-separator"></div>

                 <ToolbarIcon 
                    onClick={() => handleSetView(ActiveView.Story)} 
                    label="Cốt Truyện" 
                    isActive={activeView?.type === ActiveView.Story} 
                    isPrimary={true} 
                    isExpanded={isRightSidebarExpanded}
                    showLabelWhenExpanded={false}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </ToolbarIcon>

                <div className="toolbar-separator"></div>

                 <ToolbarIcon 
                    onClick={() => handleSetView(ActiveView.Quests)} 
                    label="Nhiệm Vụ" 
                    isActive={activeView?.type === ActiveView.Quests} 
                    isExpanded={isRightSidebarExpanded}
                    badgeCount={unacceptedQuestsCount}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </ToolbarIcon>
                <ToolbarIcon onClick={() => handleSetView(ActiveView.Crafting)} label="Chế Tạo" isActive={activeView?.type === ActiveView.Crafting} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.37 3.414-1.414 3.414H4.828c-1.784 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </ToolbarIcon>
                
                <div className="toolbar-separator"></div>

                <ToolbarIcon onClick={() => handleSetView(ActiveView.Management)} label="Quản Lý" isActive={activeView?.type === ActiveView.Management} isExpanded={isRightSidebarExpanded}>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                </ToolbarIcon>
                <ToolbarIcon onClick={() => handleSetView(ActiveView.Lore)} label="Tri Thức" isActive={activeView?.type === ActiveView.Lore} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </ToolbarIcon>
                
                <div className="toolbar-spacer"></div>
                <div className="toolbar-separator"></div>

                 <ToolbarIcon onClick={onSaveGame} label="Lưu Game" isActive={false} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </ToolbarIcon>
                 <ToolbarIcon onClick={onExitToMenu} label="Về Menu Chính" isActive={false} isExpanded={isRightSidebarExpanded}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </ToolbarIcon>
            </aside>
        </div>
    );
};

export default GameScreen;