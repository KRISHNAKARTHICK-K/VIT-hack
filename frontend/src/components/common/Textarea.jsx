// src/components/common/Textarea.jsx
import React from 'react';

export const Textarea = ({
  label,
  id,
  error,
  hint,
  required = false,
  className = '',
  rows = 4,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className="textarea-field"
        {...props}
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-hint" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  );
};
