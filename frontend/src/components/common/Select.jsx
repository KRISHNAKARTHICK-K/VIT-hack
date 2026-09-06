// src/components/common/Select.jsx
import React from 'react';

export const Select = ({
  label,
  id,
  options = [],
  error,
  hint,
  required = false,
  className = '',
  value,
  onChange,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className="select-field"
        value={value}
        onChange={onChange}
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
        {children}
      </select>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-hint" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  );
};
