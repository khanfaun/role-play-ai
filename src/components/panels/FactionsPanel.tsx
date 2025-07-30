import React from 'react';
import { Faction, FactionAlignmentLabels } from '../../types';

interface FactionsPanelProps {
  factions: Faction[];
}

const FactionsPanel: React.FC<FactionsPanelProps> = ({ factions }) => {
  const discoveredFactions = factions.filter(f => f.isDiscovered);

  return (
    <div className="panel info-panel">
      <h3>Phe Phái Đã Biết</h3>
      <div className="info-list">
        {discoveredFactions.length === 0 ? (
          <p className="empty-text">Chưa biết thông tin về phe phái nào.</p>
        ) : (
          discoveredFactions.map((faction) => {
            const alignmentText = FactionAlignmentLabels[faction.alignment || ''] || faction.alignment || 'Chưa rõ';
            return (
                <div key={faction.name} className="info-item">
                    <div className="info-item-header">
                        <p className="info-item-name">{faction.name}</p>
                        <span className={`alignment-badge ${alignmentText.toLowerCase().replace(/\s+/g, '-')}`}>{alignmentText}</span>
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
  );
};

export default FactionsPanel;