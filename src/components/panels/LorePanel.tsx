import React from 'react';
import { Lore } from '../../types';

interface LorePanelProps {
  lore: Lore[];
}

const LorePanel: React.FC<LorePanelProps> = ({ lore }) => {
  return (
    <div className="panel info-panel">
      <h3>Tri Thức Thế Giới</h3>
      <div className="info-list">
        {lore.length === 0 ? (
          <p className="empty-text">Chưa thu thập được tri thức nào.</p>
        ) : (
          lore.map((entry) => (
            <div key={entry.title} className="info-item lore-item">
                <p className="info-item-name">{entry.title}</p>
                <p className="description">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LorePanel;
