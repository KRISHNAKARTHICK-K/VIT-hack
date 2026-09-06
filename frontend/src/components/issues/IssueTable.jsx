// src/components/issues/IssueTable.jsx
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Button } from '../common/Button';
import { MapPin, Building, ExternalLink } from 'lucide-react';

export const IssueTable = ({
  issues = [],
  onSelectIssue,
  actionLabel = 'Review',
  emptyMessage = 'No matching issues found.'
}) => {
  if (!issues || issues.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title & Location</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned Department</th>
            <th>Reported Date</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                {issue.id}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                  {issue.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Building size={12} />
                  <span>{issue.location}</span>
                  {issue.specificLocation && issue.specificLocation !== issue.location && (
                    <span>• {issue.specificLocation}</span>
                  )}
                </div>
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--navy-700)' }}>
                  {issue.category}
                </span>
              </td>
              <td>
                <PriorityBadge priority={issue.priority} />
              </td>
              <td>
                <StatusBadge status={issue.status} />
              </td>
              <td style={{ color: issue.assignedDepartment ? 'var(--navy-800)' : 'var(--text-muted)', fontSize: '12px' }}>
                {issue.assignedDepartment || '—'}
              </td>
              <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(issue.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectIssue && onSelectIssue(issue)}
                >
                  <span>{actionLabel}</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
