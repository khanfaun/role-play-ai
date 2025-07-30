import React, { useState } from 'react';
import { NPC, Faction, FactionAlignmentLabels } from '../../types';

// Faction Card Component
const FactionCard: React.FC<{ faction: Faction }> = ({ faction }) => {
    const alignmentText = FactionAlignmentLabels[faction.alignment || ''] || faction.alignment || 'Chưa rõ';
    return (
        <div className="relationship-card faction-card">
            <div className="card-header">
                <div className="card-title-group">
                    <h4 className="card-name color-faction">{faction.name}</h4>
                    <span className={`alignment-badge ${alignmentText.toLowerCase().replace(/\s+/g, '-')}`}>{alignmentText}</span>
                </div>
            </div>
            <div className="card-body">
                <div className="card-stat-grid">
                    <div className="card-stat-item">
                        <span className="stat-label">Uy tín:</span>
                        <span className="stat-value">{faction.reputation ?? '???'}</span>
                    </div>
                </div>
                {faction.description && <p className="description">{faction.description}</p>}
            </div>
        </div>
    );
};

// NPC Card Component
const NpcCard: React.FC<{ npc: NPC }> = ({ npc }) => (
    <div className="relationship-card npc-card">
        <div className="card-header">
            <div className="card-avatar">
                <span>{npc.name.charAt(0)}</span>
            </div>
            <div className="card-title-group">
                <h4 className="card-name color-npc">{npc.name}</h4>
                <span className={`relationship-badge ${npc.relationship?.toLowerCase().replace(/\s+/g, '-') || 'chưa'}`}>{npc.relationship || 'Chưa rõ'}</span>
            </div>
        </div>
        <div className="card-body">
            <div className="card-stat-grid">
                <div className="card-stat-item">
                    <span className="stat-label">Giới tính:</span>
                    <span className="stat-value">{npc.gender ?? '???'}</span>
                </div>
                <div className="card-stat-item">
                    <span className="stat-label">Tuổi:</span>
                    <span className="stat-value">{npc.age ?? '???'}</span>
                </div>
                <div className="card-stat-item">
                    <span className="stat-label">Cảnh giới:</span>
                    <span className="stat-value">{npc.realm ?? '???'}</span>
                </div>
                 <div className="card-stat-item full-width">
                    <span className="stat-label">Tính cách:</span>
                    <span className="stat-value">{npc.personality ?? '???'}</span>
                </div>
            </div>
            {npc.description && <p className="description">{npc.description}</p>}
        </div>
    </div>
);

// Main Modal Component
interface RelationshipsModalProps {
    npcs: NPC[];
    factions: Faction[];
}

const RelationshipsModal: React.FC<RelationshipsModalProps> = ({ npcs, factions }) => {
    const [activeTab, setActiveTab] = useState<'npcs' | 'factions'>('npcs');
    const discoveredNpcs = npcs.filter(n => n.isDiscovered);
    const discoveredFactions = factions.filter(f => f.isDiscovered);

    return (
        <div className="view-container">
            <h2 className="view-header">Mối Quan Hệ</h2>
            <div className="view-filters">
                <button 
                    onClick={() => setActiveTab('npcs')} 
                    className={`filter-button ${activeTab === 'npcs' ? 'active' : ''}`}
                >
                    Nhân Vật ({discoveredNpcs.length})
                </button>
                <button 
                    onClick={() => setActiveTab('factions')} 
                    className={`filter-button ${activeTab === 'factions' ? 'active' : ''}`}
                >
                    Phe Phái ({discoveredFactions.length})
                </button>
            </div>
            <div className="info-list-view relationship-view">
                <div className="relationship-grid">
                    {activeTab === 'npcs' && (
                        discoveredNpcs.length > 0 
                            ? [...discoveredNpcs].sort((a, b) => a.name.localeCompare(b.name)).map(npc => <NpcCard key={npc.id} npc={npc} />)
                            : <p className="empty-text">Chưa gặp gỡ nhân vật nào.</p>
                    )}
                    {activeTab === 'factions' && (
                        discoveredFactions.length > 0 
                            ? [...discoveredFactions].sort((a, b) => a.name.localeCompare(b.name)).map(faction => <FactionCard key={faction.id} faction={faction} />)
                            : <p className="empty-text">Chưa có thông tin phe phái.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelationshipsModal;