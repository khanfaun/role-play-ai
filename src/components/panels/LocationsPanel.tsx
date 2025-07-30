import React from 'react';
import { Location } from '../../types';

interface LocationsPanelProps {
  locations: Location[];
}

const LocationsPanel: React.FC<LocationsPanelProps> = ({ locations }) => {
  const discoveredLocations = locations.filter(l => l.isDiscovered);

  return (
    <div className="panel info-panel">
      <h3>Địa Điểm Đã Biết</h3>
      <div className="info-list">
        {discoveredLocations.length === 0 ? (
          <p className="empty-text">Chưa khám phá địa điểm nào.</p>
        ) : (
          discoveredLocations.map((location) => {
            const safetyClass = location.isSafeZone === true ? 'color-safe' : location.isSafeZone === false ? 'color-danger' : 'color-location';
            return (
              <div key={location.name} className="info-item">
                <div className="info-item-header">
                  <p className={`info-item-name ${safetyClass}`}>{location.name}</p>
                  {location.isSafeZone !== undefined && (
                      <span className={`safety-badge ${location.isSafeZone ? 'safe' : 'danger'}`}>
                          {location.isSafeZone ? 'An toàn' : 'Nguy hiểm'}
                      </span>
                  )}
                </div>
                <div className="info-item-details">
                    <p><strong>Vùng:</strong> {location.region ?? '???'}</p>
                    {location.description && <p className="description"><strong>Mô tả:</strong> {location.description}</p>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default LocationsPanel;