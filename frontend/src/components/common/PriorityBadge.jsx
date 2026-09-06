// src/components/common/PriorityBadge.jsx
import React from 'react';

export const PriorityBadge = ({ priority = 'Medium', className = '' }) => {
  const norm = (priority || 'medium').toLowerCase();

  let style = {
    backgroundColor: '#fffbeb',
    color: '#b45309',
    borderColor: '#fde68a'
  };

  if (norm === 'urgent' || norm === 'critical') {
    style = {
      backgroundColor: '#fff1f2',
      color: '#be123c',
      borderColor: '#fecdd3',
      fontWeight: 700
    };
  } else if (norm === 'high') {
    style = {
      backgroundColor: '#fff1f2',
      color: '#be123c',
      borderColor: '#fecdd3',
      fontWeight: 600
    };
  } else if (norm === 'low') {
    style = {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      borderColor: '#e2e8f0',
      fontWeight: 500
    };
  }

  return (
    <span
      className={`priority-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        border: '1px solid',
        ...style
      }}
    >
      <span>{priority === 'High' ? 'High Priority' : priority}</span>
    </span>
  );
};
