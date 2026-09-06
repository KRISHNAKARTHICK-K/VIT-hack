// src/components/issues/ImageUploader.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '../common/Button';

const PRESET_PHOTOS = [
  { label: 'Corridor Light', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Water Leak', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80' },
  { label: 'Damaged Desk', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80' },
  { label: 'Broken Pavement', url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=80' }
];

export const ImageUploader = ({
  onFileSelect,
  onPresetSelect,
  previewUrl,
  label = 'Issue Photograph Evidence',
  required = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>

      {previewUrl ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-strong)',
            height: 220,
            backgroundColor: 'var(--navy-900)'
          }}
        >
          <img
            src={previewUrl}
            alt="Upload Preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = '';
              onFileSelect(null);
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Remove photo"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '30px 20px',
            textAlign: 'center',
            backgroundColor: dragOver ? 'var(--primary-light)' : '#ffffff',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'var(--navy-100)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <Upload size={20} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)' }}>
            Click to upload or drag photograph here
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            PNG, JPG or WebP up to 10MB
          </p>

          {/* Quick preset selector for fast testing */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Presets:</span>
            {PRESET_PHOTOS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => onPresetSelect && onPresetSelect(preset.url)}
              >
                <ImageIcon size={12} />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
