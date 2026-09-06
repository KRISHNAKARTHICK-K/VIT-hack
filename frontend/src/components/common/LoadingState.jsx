// src/components/common/LoadingState.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading campus data...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: 'var(--navy-500)',
        gap: '12px'
      }}
    >
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      <p style={{ fontSize: '14px', fontWeight: 500 }}>{message}</p>
    </div>
  );
};
