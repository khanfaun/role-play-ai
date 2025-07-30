import React, { useState, useMemo } from 'react';
import { Quest, GameState } from '../../types';
import Button from '../shared/Button';
import InteractiveTextRenderer from '../shared/InteractiveTextRenderer';

interface QuestsViewProps {
  quests: Quest[];
  onAcceptQuest: (questId: number) => void;
  onDeclineQuest: (questId: number) => void;
  onShowTooltip: (type: any, entityName: string, position: { x: number; y: number }) => void;
  gameState: GameState;
}

const QuestItem: React.FC<{
  quest: Quest;
  gameState: GameState;
  onShowTooltip: QuestsViewProps['onShowTooltip'];
  onAcceptQuest?: QuestsViewProps['onAcceptQuest'];
  onDeclineQuest?: QuestsViewProps['onDeclineQuest'];
}> = ({ quest, gameState, onShowTooltip, onAcceptQuest, onDeclineQuest }) => (
    <div className="info-item quest-item">
        <div className="info-item-header">
            <p className="info-item-name color-quest">{quest.title}</p>
            <div className="quest-badges">
                <span className="quest-type-badge">{quest.type}</span>
                <span className={`tooltip-badge status-${quest.status.replace(/\s/g, '-').toLowerCase()}`}>{quest.status}</span>
            </div>
        </div>
        <div className="info-item-details">
            {quest.type === 'Phụ (có hẹn giờ)' && quest.turnsToComplete != null && quest.status === 'Đã nhận' &&
                <p><strong>Thời gian còn lại:</strong> {quest.turnsToComplete} lượt</p>
            }
            <p><strong>Điều kiện:</strong> <InteractiveTextRenderer text={quest.description} gameState={gameState} onShowTooltip={onShowTooltip} /></p>
            {quest.reward && <p><strong>Phần thưởng:</strong> <InteractiveTextRenderer text={quest.reward} gameState={gameState} onShowTooltip={onShowTooltip} /></p>}
            {quest.penalty && <p className="quest-penalty"><strong>Hình phạt (nếu thất bại):</strong> <InteractiveTextRenderer text={quest.penalty} gameState={gameState} onShowTooltip={onShowTooltip} /></p>}
        </div>
        {quest.status === 'Chưa nhận' && onAcceptQuest && onDeclineQuest && (
            <div className="quest-actions">
                <Button variant="danger" onClick={() => onDeclineQuest(quest.id)}>Từ chối</Button>
                <Button variant="primary" onClick={() => onAcceptQuest(quest.id)}>Chấp nhận</Button>
            </div>
        )}
    </div>
);


const QuestsView: React.FC<QuestsViewProps> = ({ quests, onAcceptQuest, onDeclineQuest, onShowTooltip, gameState }) => {
    type QuestFilter = 'Tất cả' | 'Chưa nhận' | 'Đang làm' | 'Hoàn thành' | 'Không hoàn thành';
    const [activeFilter, setActiveFilter] = useState<QuestFilter>('Tất cả');

    const sortedQuests = useMemo(() => [...quests].sort((a, b) => b.id - a.id), [quests]);

    const filteredQuests = useMemo(() => {
        if (activeFilter === 'Tất cả') {
            return sortedQuests;
        }
        const filterStatus = activeFilter === 'Đang làm' ? 'Đã nhận' : activeFilter;
        return sortedQuests.filter(q => q.status === filterStatus);
    }, [sortedQuests, activeFilter]);
    
    const unacceptedQuests = filteredQuests.filter(q => q.status === 'Chưa nhận');
    const acceptedQuests = filteredQuests.filter(q => q.status === 'Đã nhận');
    const completedQuests = filteredQuests.filter(q => q.status === 'Hoàn thành');
    const failedQuests = filteredQuests.filter(q => q.status === 'Không hoàn thành');

    const filterButtons: QuestFilter[] = ['Tất cả', 'Chưa nhận', 'Đang làm', 'Hoàn thành', 'Không hoàn thành'];

    return (
        <div className="view-container">
            <h2 className="view-header">Nhật Ký Nhiệm Vụ</h2>
            <div className="view-filters">
                {filterButtons.map(filter => (
                    <button 
                        key={filter} 
                        onClick={() => setActiveFilter(filter)} 
                        className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
            <div className="info-list-view quest-view">
                <div className="info-list">
                    {filteredQuests.length === 0 ? (
                        <p className="empty-text">Không có nhiệm vụ nào phù hợp với bộ lọc.</p>
                    ) : (
                        <>
                            {(activeFilter === 'Tất cả' || activeFilter === 'Chưa nhận') && unacceptedQuests.length > 0 && (
                                <div className="quest-group">
                                    <h3 className="quest-group-title">Nhiệm Vụ Có Thể Nhận ({unacceptedQuests.length})</h3>
                                    {unacceptedQuests.map(q => <QuestItem key={q.id} quest={q} gameState={gameState} onShowTooltip={onShowTooltip} onAcceptQuest={onAcceptQuest} onDeclineQuest={onDeclineQuest} />)}
                                </div>
                            )}
                            {(activeFilter === 'Tất cả' || activeFilter === 'Đang làm') && acceptedQuests.length > 0 && (
                                <div className="quest-group">
                                    <h3 className="quest-group-title">Nhiệm Vụ Đang Làm ({acceptedQuests.length})</h3>
                                    {acceptedQuests.map(q => <QuestItem key={q.id} quest={q} gameState={gameState} onShowTooltip={onShowTooltip} />)}
                                </div>
                            )}
                            {(activeFilter === 'Tất cả' || activeFilter === 'Hoàn thành') && completedQuests.length > 0 && (
                                <div className="quest-group">
                                    <h3 className="quest-group-title">Nhiệm Vụ Đã Hoàn Thành ({completedQuests.length})</h3>
                                    {completedQuests.map(q => <QuestItem key={q.id} quest={q} gameState={gameState} onShowTooltip={onShowTooltip} />)}
                                </div>
                            )}
                            {(activeFilter === 'Tất cả' || activeFilter === 'Không hoàn thành') && failedQuests.length > 0 && (
                                <div className="quest-group">
                                    <h3 className="quest-group-title">Nhiệm Vụ Đã Bỏ Lỡ ({failedQuests.length})</h3>
                                    {failedQuests.map(q => <QuestItem key={q.id} quest={q} gameState={gameState} onShowTooltip={onShowTooltip} />)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestsView;
