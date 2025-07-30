import React, { ChangeEvent } from 'react';
import { GameState, GameScreen, ViewState, TooltipState, Item, EquipmentSlot, GameSetupData, EntityType, Quest, StorySummaryEntry, Location } from './types';
import { SetupScreen } from './components/SetupScreen';
import GameScreenComponent from './components/GameScreen';
import InfoTooltip from './components/shared/InfoTooltip';
import Modal from './components/shared/Modal';
import Button from './components/shared/Button';
import NewQuestModal from './components/modals/NewQuestModal';

// Main Menu Component
interface MainMenuScreenProps {
  onNewGame: () => void;
  onLoadGame: (event: ChangeEvent<HTMLInputElement>) => void;
}

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ onNewGame, onLoadGame }) => {
    const handleLoadClick = () => {
        document.getElementById('load-game-input')?.click();
    };

    return (
        <div className="main-menu-screen">
            <div className="main-menu-container">
                <h1 className="main-menu-title">Role Play AI</h1>
                <p className="main-menu-description">
                    Chào mừng đến với thế giới Role Play AI! Một tựa game nhập vai phiêu lưu bằng chữ, nơi mọi diễn biến được tạo ra bởi AI. Hãy kiến tạo nhân vật và bắt đầu hành trình của riêng bạn!
                </p>
                <div className="main-menu-actions">
                    <button className="main-menu-button primary" onClick={onNewGame}>Cuộc Phiêu Lưu Mới</button>
                    <button className="main-menu-button secondary" onClick={handleLoadClick}>Tải Game</button>
                    <input
                        type="file"
                        id="load-game-input"
                        style={{ display: 'none' }}
                        onChange={onLoadGame}
                        accept=".json"
                    />
                    <button className="main-menu-button tertiary" disabled>Nhập/Xuất Dữ Liệu Lưu</button>
                    <button className="main-menu-button tertiary" disabled>Thông Tin Cập Nhật</button>
                    <button className="main-menu-button tertiary" disabled>Thiết Lập API Gemini</button>
                    <button className="main-menu-button tertiary" disabled>Cài Đặt Lưu Trữ</button>
                </div>
                <p className="main-menu-version">Phiên bản 1.3.0</p>
            </div>
        </div>
    );
};

interface AppUIProps {
    gameState: GameState | null;
    currentScreen: GameScreen;
    isLoading: boolean;
    activeView: ViewState | null;
    tooltipState: TooltipState | null;
    popupMessage: { title: string; content: string } | null;
    confirmation: { title: string; content: string; onConfirm: () => void; } | null;
    newQuestNotification: Quest | null;
    onNewGame: () => void;
    onLoadGame: (event: ChangeEvent<HTMLInputElement>) => void;
    onSaveGame: () => void;
    onExitToMenu: () => void;
    onShowPopup: (title: string, content: string) => void;
    onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number; }) => void;
    onCloseTooltip: () => void;
    onGameStart: (setupData: GameSetupData) => void;
    onPlayerAction: (action: string, sourceType: 'choice' | 'custom') => void;
    onUseItem: (item: Item, quantity: number) => void;
    onDropItem: (item: Item, quantity: number) => void;
    onRenameItem: (itemId: number, newName: string) => void;
    onEquipItem: (item: Item) => void;
    onUnequipItem: (slot: EquipmentSlot) => void;
    onAcceptQuest: (questId: number) => void;
    onDeclineQuest: (questId: number) => void;
    onAcceptNewQuest: (questId: number) => void;
    onDeclineNewQuest: (questId: number) => void;
    onIgnoreNewQuest: () => void;
    onSetActiveView: (state: ViewState | null) => void;
    setPopupMessage: (message: { title: string; content: string; } | null) => void;
    setConfirmation: (confirmation: { title: string; content: string; onConfirm: () => void; } | null) => void;
    onUpdateHeavenlyRules: (rules: string[]) => void;
    onUpdateCoreMemory: (rules: string[]) => void;
    onUpdateStorySummary: (summaryId: number, newSummary: string) => void;
    onDeleteStorySummary: (summaryId: number) => void;
    onUpdateLocation: (location: Location) => void;
    onDeleteLocation: (locationId: number) => void;
    hasStoryStarted: boolean;
    onStartStory: () => void;
}

const AppUI: React.FC<AppUIProps> = ({
    gameState,
    currentScreen,
    isLoading,
    activeView,
    tooltipState,
    popupMessage,
    confirmation,
    newQuestNotification,
    onNewGame,
    onLoadGame,
    onSaveGame,
    onExitToMenu,
    onShowPopup,
    onShowTooltip,
    onCloseTooltip,
    onGameStart,
    onPlayerAction,
    onUseItem,
    onDropItem,
    onRenameItem,
    onEquipItem,
    onUnequipItem,
    onAcceptQuest,
    onDeclineQuest,
    onAcceptNewQuest,
    onDeclineNewQuest,
    onIgnoreNewQuest,
    onSetActiveView,
    setPopupMessage,
    setConfirmation,
    onUpdateHeavenlyRules,
    onUpdateCoreMemory,
    onUpdateStorySummary,
    onDeleteStorySummary,
    onUpdateLocation,
    onDeleteLocation,
    hasStoryStarted,
    onStartStory
}) => {

    const renderPopup = () => (
        <Modal
            isOpen={!!popupMessage}
            onClose={() => setPopupMessage(null)}
            title={popupMessage?.title || ''}
        >
            <p className="popup-message-content">{popupMessage?.content}</p>
        </Modal>
    );

    const renderConfirmationModal = () => {
        if (!confirmation) return null;

        const handleConfirm = () => {
            confirmation.onConfirm();
            setConfirmation(null);
        };

        const handleCancel = () => {
            setConfirmation(null);
        };

        return (
            <Modal
                isOpen={!!confirmation}
                onClose={handleCancel}
                title={confirmation.title}
            >
                <div className="confirmation-modal-content">
                    <p>{confirmation.content}</p>
                    <div className="confirmation-actions">
                        <Button variant="secondary" onClick={handleCancel}>Hủy Bỏ</Button>
                        <Button variant="danger" onClick={handleConfirm}>Xác Nhận</Button>
                    </div>
                </div>
            </Modal>
        );
    };

    const renderCurrentScreen = () => {
        if (currentScreen === GameScreen.MainMenu) {
            return <MainMenuScreen onNewGame={onNewGame} onLoadGame={onLoadGame} />;
        }

        if (currentScreen === GameScreen.Setup) {
            return <SetupScreen onGameStart={onGameStart} isLoading={isLoading} onExitToMenu={onExitToMenu} onShowPopup={onShowPopup} />;
        }

        if (gameState) {
            const unacceptedQuestsCount = gameState.quests.filter(q => q.status === 'Chưa nhận').length;
            return <GameScreenComponent 
                        gameState={gameState} 
                        onPlayerAction={onPlayerAction} 
                        isLoading={isLoading}
                        activeView={activeView}
                        onSetActiveView={onSetActiveView}
                        onShowTooltip={onShowTooltip}
                        onSaveGame={onSaveGame}
                        onExitToMenu={onExitToMenu}
                        onUseItem={onUseItem}
                        onDropItem={onDropItem}
                        onRenameItem={onRenameItem}
                        onEquipItem={onEquipItem}
                        onUnequipItem={onUnequipItem}
                        onAcceptQuest={onAcceptQuest}
                        onDeclineQuest={onDeclineQuest}
                        unacceptedQuestsCount={unacceptedQuestsCount}
                        onUpdateHeavenlyRules={onUpdateHeavenlyRules}
                        onUpdateCoreMemory={onUpdateCoreMemory}
                        onUpdateStorySummary={onUpdateStorySummary}
                        onDeleteStorySummary={onDeleteStorySummary}
                        onUpdateLocation={onUpdateLocation}
                        onDeleteLocation={onDeleteLocation}
                        hasStoryStarted={hasStoryStarted}
                        onStartStory={onStartStory}
                    />;
        }

        return (
          <div className="loading-screen">
            Đang tải...
          </div>
        );
    };

    return (
        <>
            {renderPopup()}
            {renderConfirmationModal()}
            <InfoTooltip tooltipState={tooltipState} onClose={onCloseTooltip} />
            {newQuestNotification && gameState && (
                <NewQuestModal
                    quest={newQuestNotification}
                    gameState={gameState}
                    onAccept={() => onAcceptNewQuest(newQuestNotification.id)}
                    onDecline={() => onDeclineNewQuest(newQuestNotification.id)}
                    onIgnore={onIgnoreNewQuest}
                    onShowTooltip={onShowTooltip}
                />
            )}
            {renderCurrentScreen()}
        </>
    );
};

export default AppUI;