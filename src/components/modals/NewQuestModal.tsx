import React from 'react';
import { Quest, GameState, EntityType } from '../../types';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import InteractiveTextRenderer from '../shared/InteractiveTextRenderer';

interface NewQuestModalProps {
    quest: Quest;
    gameState: GameState;
    onAccept: () => void;
    onDecline: () => void;
    onIgnore: () => void;
    onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number; }) => void;
}

const NewQuestModal: React.FC<NewQuestModalProps> = ({ quest, gameState, onAccept, onDecline, onIgnore, onShowTooltip }) => {
    return (
        <Modal
            isOpen={true}
            onClose={onIgnore}
            title={
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Nhiệm Vụ Mới!</span>
                </>
            }
        >
            <div className="new-quest-modal-body">
                <div className="new-quest-modal-content">
                    <div className="info-item-header">
                        <p className="info-item-name color-quest">{quest.title}</p>
                        <div className="quest-badges">
                            <span className="quest-type-badge">{quest.type}</span>
                        </div>
                    </div>
                    <div className="info-item-details">
                        {quest.type === 'Phụ (có hẹn giờ)' && quest.turnsToComplete != null &&
                            <p><strong>Thời gian còn lại:</strong> {quest.turnsToComplete} lượt</p>
                        }
                        <p>
                            <strong>Điều kiện:</strong>{' '}
                            <InteractiveTextRenderer text={quest.description} gameState={gameState} onShowTooltip={onShowTooltip} />
                        </p>
                        {quest.reward && (
                            <p>
                                <strong>Phần thưởng:</strong>{' '}
                                <InteractiveTextRenderer text={quest.reward} gameState={gameState} onShowTooltip={onShowTooltip} />
                            </p>
                        )}
                    </div>
                </div>

                <div className="new-quest-modal-actions">
                    <Button variant="secondary" onClick={onIgnore}>Để Sau</Button>
                    <Button variant="danger" onClick={onDecline}>Từ Chối</Button>
                    <Button variant="primary" onClick={onAccept}>Chấp Nhận</Button>
                </div>
            </div>
        </Modal>
    );
};

export default NewQuestModal;
