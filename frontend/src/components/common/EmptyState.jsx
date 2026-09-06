// src/components/common/EmptyState.jsx
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No reports found',
  description = 'There are currently no campus maintenance issues matching this view.',
  actionText,
  onAction
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        margin: '16px 0'
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'var(--navy-100)',
          color: 'var(--navy-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}
      >
        <Icon size={24} />
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 6 }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: 360, marginBottom: actionText ? 18 : 0 }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
