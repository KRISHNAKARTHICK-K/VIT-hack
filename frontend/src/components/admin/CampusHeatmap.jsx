// src/components/admin/CampusHeatmap.jsx
import React from 'react';

export const CampusHeatmap = ({ heatmapData = [], onSelectLocation, selectedLocation }) => {
  const getIntensityBadge = (intensity) => {
    switch (intensity) {
      case 'high':
        return {
          barColor: '#dc2626',
          badgeBg: '#fee2e2',
          badgeText: '#b91c1c',
          border: '#fecdd3',
          cardBg: '#fff1f280',
          label: 'Critical Zone',
          percent: 85
        };
      case 'medium':
        return {
          barColor: '#d97706',
          badgeBg: '#fef3c7',
          badgeText: '#b45309',
          border: '#fde68a',
          cardBg: '#fffbeb80',
          label: 'Elevated',
          percent: 60
        };
      default:
        return {
          barColor: '#10b981',
          badgeBg: '#d1fae5',
          badgeText: '#047857',
          border: '#e2e8f0',
          cardBg: '#f8fafc',
          label: 'Stable',
          percent: 25
        };
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 12,
          marginBottom: 16
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--cobalt)' }}>
              local_fire_department
            </span>
            <span>Campus Hotspot Registry</span>
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
            Zone density ranking by volume
          </div>
        </div>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--cobalt)', fontWeight: 600 }}>
          Live Map Data
        </span>
      </div>

      {/* List of Zones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {heatmapData.map((node) => {
          const config = getIntensityBadge(node.intensity);
          const isSelected = selectedLocation === node.name;

          return (
            <div
              key={node.name}
              onClick={() => onSelectLocation(isSelected ? null : node.name)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isSelected ? 'var(--cobalt)' : config.border}`,
                backgroundColor: isSelected ? '#eff4ff' : config.cardBg,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                  {node.name}
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: config.badgeBg,
                    color: config.badgeText,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {node.activeIssues} Active Issues
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#e2e8f0',
                  overflow: 'hidden',
                  marginBottom: 6
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(12, Math.min(100, node.activeIssues * 25))}%`,
                    backgroundColor: config.barColor,
                    borderRadius: 'var(--radius-full)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{node.latestIssue ? `Recent: ${node.latestIssue}` : 'No active incident spikes'}</span>
                <span className="font-mono" style={{ fontWeight: 600, color: config.badgeText }}>
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
