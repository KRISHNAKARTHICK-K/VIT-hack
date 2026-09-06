// src/components/common/Input.jsx
import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  error,
  hint,
  required = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: 12, color: 'var(--navy-400)', pointerEvents: 'none' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className="input-field"
          style={Icon ? { paddingLeft: '38px' } : undefined}
          {...props}
        />
      </div>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-hint" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  );
};
