// src/components/common/StatusBadge.jsx
import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const norm = status.toLowerCase().replace(/\s+/g, '-');

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-600';
  let pulse = false;

  if (norm === 'in-progress' || norm === 'progress') {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
    dotClass = 'bg-blue-600';
    pulse = true;
  } else if (norm === 'verified') {
    bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
    dotClass = 'bg-purple-600';
  } else if (norm === 'assigned') {
    bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotClass = 'bg-indigo-600';
  } else if (norm === 'resolved' || norm === 'closed') {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClass = 'bg-emerald-600';
  } else if (norm === 'reported') {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    dotClass = 'bg-amber-600';
  } else if (norm === 'overdue' || norm === 'critical') {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-600';
  }

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 600,
        border: '1px solid transparent',
        lineHeight: 1.4
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          animation: pulse ? 'pulse 1.5s infinite' : 'none'
        }}
      />
      <span>{status}</span>
    </span>
  );
};
