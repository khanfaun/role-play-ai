import React from 'react';
import { Quest, EntityType } from '../../types';

interface QuestsPanelProps {
  quests: Quest[];
  onShowTooltip: (type: EntityType, entityName: string, position: { x: number; y: number }) => void;
}

const QuestsPanel: React.FC<QuestsPanelProps> = ({ quests, onShowTooltip }) => {
  const activeQuests = quests.filter(q => q.status === 'Đã nhận');

  return (
    <div className="panel quests-panel">
      <h3>Nhiệm Vụ Đang Làm</h3>
      <div className="quests-list">
        {activeQuests.length === 0 ? (
          <p className="empty-text">Chưa có nhiệm vụ nào đang làm.</p>
        ) : (
          activeQuests.map((quest) => (
            <div 
                key={quest.id} 
                className="quest-item-interactive"
                onClick={(e) => {
                    e.stopPropagation();
                    onShowTooltip('quest', quest.title, { x: e.clientX, y: e.clientY });
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        onShowTooltip('quest', quest.title, { x: rect.left, y: rect.bottom });
                    }
                }}
                role="button"
                tabIndex={0}
            >
              <p className="quest-title">{quest.title}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestsPanel;
