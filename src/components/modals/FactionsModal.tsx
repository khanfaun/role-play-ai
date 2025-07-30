import React from 'react';
import { Faction, FactionAlignmentLabels } from '../../types';

interface FactionsViewProps {
  factions: Faction[];
}

const FactionsView: React.FC<FactionsViewProps> = ({ factions }) => {
  return (
    <div className="view-container">
      <h2 className="view-header">Phe Phái Đã Biết</h2>
      <div className="info-list-view">
        <div className="info-list">
          {factions.length === 0 ? (
            <p className="empty-text">Chưa biết thông tin về phe phái nào.</p>
          ) : (
            factions.map((faction) => {
              const alignmentText = FactionAlignmentLabels[faction.alignment || ''] || faction.alignment || 'Chưa rõ';
              return (
                <div key={faction.name} className="info-item">
                    <div className="info-item-header">
                        <p className="info-item-name color-faction">{faction.name}</p>
                        <span className={`alignment-badge ${faction.alignment?.toLowerCase().replace('派','') || 'chưa'}`}>{alignmentText}</span>
                    </div>
                    <div className="info-item-details">
                        <p><strong>Uy tín:</strong> {faction.reputation ?? '???'}</p>
                        {faction.description && <p className="description"><strong>Mô tả:</strong> {faction.description}</p>}
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FactionsView;