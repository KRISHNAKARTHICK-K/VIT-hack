// src/components/issues/IssueCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { MapPin, Calendar, Building, ArrowRight } from 'lucide-react';

export const IssueCard = ({ issue, basePath = '/student/issues' }) => {
  const imageUrl = issue.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        transition: 'all var(--transition-fast)',
        height: '100%'
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden', backgroundColor: 'var(--navy-100)' }}>
        <img
          src={imageUrl}
          alt={issue.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <StatusBadge status={issue.status} />
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      {/* Body */}
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{issue.id}</span>
          <span>•</span>
          <span>{issue.category}</span>
        </div>

        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--navy-900)',
            lineHeight: 1.3,
            marginBottom: 8
          }}
        >
          {issue.title}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--navy-600)',
            lineHeight: 1.4,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1
          }}
        >
          {issue.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '12px', color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building size={14} color="var(--navy-400)" />
            <span>{issue.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--navy-400)" />
            <span>
              {new Date(issue.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--navy-500)' }}>
          {issue.assignedDepartment || 'Pending Assignment'}
        </span>
        <Link
          to={`${basePath}/${issue.id}`}
          className="btn btn-secondary btn-sm"
          style={{ gap: 4 }}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
