// src/components/issues/FilterBar.jsx
import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export const FilterBar = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  department,
  onDepartmentChange,
  showDepartment = true,
  onReset
}) => {
  const categories = [
    'All',
    'Electrical',
    'Plumbing',
    'Furniture & Fixtures',
    'Cleanliness & Sanitation',
    'Civil & Infrastructure',
    'Safety & Security',
    'Other'
  ];

  const statuses = [
    'All',
    'Reported',
    'Verified',
    'Assigned',
    'In Progress',
    'Resolved',
    'Closed'
  ];

  const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low'];

  const departments = [
    'All',
    'Electrical Maintenance',
    'Plumbing & Water Supply',
    'Civil & Infrastructure',
    'Sanitation & Housekeeping',
    'Carpentry & Furniture'
  ];

  return (
    <div className="filter-bar">
      {/* Search Field */}
      <div className="filter-search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--navy-400)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by issue title, location, or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ paddingLeft: 38, fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div style={{ minWidth: 140 }}>
        <select
          className="select-field"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ fontSize: '13px', padding: '9px 12px' }}
        >
          <option value="All">All Categories</option>
          {categories.filter((c) => c !== 'All').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Status Dropdown */}
      <div style={{ minWidth: 130 }}>
        <select
          className="select-field"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ fontSize: '13px', padding: '9px 12px' }}
        >
          <option value="All">All Statuses</option>
          {statuses.filter((s) => s !== 'All').map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Priority Dropdown */}
      <div style={{ minWidth: 120 }}>
        <select
          className="select-field"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{ fontSize: '13px', padding: '9px 12px' }}
        >
          <option value="All">All Priorities</option>
          {priorities.filter((p) => p !== 'All').map((pr) => (
            <option key={pr} value={pr}>{pr}</option>
          ))}
        </select>
      </div>

      {/* Department Dropdown (optional) */}
      {showDepartment && (
        <div style={{ minWidth: 160 }}>
          <select
            className="select-field"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            style={{ fontSize: '13px', padding: '9px 12px' }}
          >
            <option value="All">All Departments</option>
            {departments.filter((d) => d !== 'All').map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      )}

      {/* Reset Button */}
      {onReset && (
        <button
          onClick={onReset}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
          title="Reset all filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
