import React from 'react';
import { Companion } from '../../types';

interface CompanionsPanelProps {
  companions: Companion[];
}

const CompanionsPanel: React.FC<CompanionsPanelProps> = ({ companions }) => {
  return (
    <div className="panel companions-panel">
      <h3>Đồng Hành</h3>
      <div className="companions-list">
        {companions.length === 0 ? (
          <p className="empty-text">Bạn đang đi một mình.</p>
        ) : (
          companions.map((companion) => (
            <div key={companion.name} className="companion-item">
               <div className="companion-avatar">
                 {companion.name.charAt(0)}
               </div>
               <div>
                <p className="companion-name">{companion.name}</p>
                <p className="companion-description" title={companion.description}>{companion.description}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompanionsPanel;
