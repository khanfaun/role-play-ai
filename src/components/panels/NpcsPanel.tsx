import React from 'react';
import { NPC } from '../../types';

interface NpcsPanelProps {
  npcs: NPC[];
}

const NpcsPanel: React.FC<NpcsPanelProps> = ({ npcs }) => {
  const discoveredNpcs = npcs.filter(n => n.isDiscovered);

  return (
    <div className="panel info-panel">
      <h3>NPCs Đã Gặp</h3>
      <div className="info-list">
        {discoveredNpcs.length === 0 ? (
          <p className="empty-text">Chưa gặp gỡ NPC nào.</p>
        ) : (
          discoveredNpcs.map((npc) => (
            <div key={npc.name} className="info-item">
               <div className="info-item-header">
                 <p className="info-item-name">{npc.name}</p>
                 <span className={`relationship-badge ${npc.relationship?.toLowerCase().replace(/\s+/g, '-') || 'chưa'}`}>{npc.relationship || 'Chưa rõ'}</span>
               </div>
               <div className="info-item-details">
                    <p><strong>Giới tính:</strong> {npc.gender ?? '???'}</p>
                    <p><strong>Tuổi:</strong> {npc.age ?? '???'}</p>
                    <p><strong>Cảnh giới:</strong> {npc.realm ?? '???'}</p>
                    <p><strong>Tính cách:</strong> {npc.personality ?? '???'}</p>
                    {npc.description && <p className="description"><strong>Mô tả:</strong> {npc.description}</p>}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NpcsPanel;