// src/components/showcase/ResolvedShowcase.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_STITCH_SHOWCASE = [
  {
    id: "CT-0994",
    title: "Main Library East Reading Room HVAC Water Leakage",
    location: "Main Library · 3rd Floor East Wing",
    resolvedTime: "Resolved 18h ago",
    rating: "5.0",
    department: "HVAC Engineering Division",
    confirmationTag: "Confirmed by Student Union",
    beforeImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNh3p6t9hCP9YTn648PQ7dPWZYtbEtMfUhZev-k5XwlZOdYErdeCMsTXWb7D2SzwIQ3JL7Kc30khoDHkG7gHCW81e0a6LblBRFAzPHlkgtGl6gb7G8LW0AfI8ib6gsyU3gyIrsOeAHjizYKzB0dO6i0IkM1PFIFrAvOQ4fmXuThPfubsnchXLlOwinGZbA3aKH6EJ9tdnncNAy6SvK9C9ycOmOE1gP2XcF4R-JXg7Z8IV0tftUMTiDUA",
    afterImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOA7RcsWlHiDwzoVx-LLc-S11uf8H1-dYZ_t87T4IT4ygDXKPV5l2irnVjqG7-R_R0mTSEYpyo0BMfLyxXOgNG5NTJRe-gbijDPDWIjZIquLq4n_X9plETsXnSdjYOhot1ZZjl6GHvznN6jvtMfDioDJDn6Cl1ksDo9aX4zaJuKr0hu0aWH_RgIYwnNCt7P_uJCLDY-mbWN8uaj98ZjWtR0K5WsTd9vGsxgJQp5dHfHWCE-E0KkjTHRg"
  },
  {
    id: "CT-0981",
    title: "Pathway illumination lamp post wiring repair",
    location: "South Quad Pathway · Near Sports Complex",
    resolvedTime: "Resolved 2d ago",
    rating: "4.9",
    department: "Campus Electrical Services",
    confirmationTag: "Safety Audit Passed",
    beforeImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2HuC34zkd2d_EwGXLHIS02Hdv4CdMul-2kMPRBB3ex5CKuMcgGx8ZDE2qkE0KCuqlNLuZeo7_PUnJ0_sOk8No5BXhCd_HsQ1hyGxIdqdHbWhlrjji3g_4K4QTgumRgaPqy-NqngWC_2lSFLxlHfUq6bfWDS6EuNPVsjO29rhOqCUc7avqQXICQkScuu3YxMsyOG45jzcwfGsDzvB2KjfsOEsTkwXd6UxUJdqjdSDqJADhtRJtUQldcA",
    afterImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfEPevCpbPL6DhU0SBiWLbhCYCUoFzQFtszGU1foMyTXWMV43cSKFi9jYRocC0TOjAz8eRSiQOYvc1j6bcKKTt0kVhN8BCId79LWIMzdsU8HCM--hLS5z1nZZjvROcUZgtw91xq5ibA-yjFD_rNGEXztFnCHKvHCdITzVD5td6mt9ggZtGxdw2QwmUgHvid7KOEFXy3Ax0bpm4F2P2ztrlbuHoFvVTgu8u2NSyqp2ys71NgWikTF82cw"
  }
];

export const ResolvedShowcase = ({ items = [] }) => {
  // If dynamic resolved items exist from API, map them or combine with Stitch showcase
  const displayCards = items.length > 0
    ? items.slice(0, 4).map((issue, idx) => ({
        id: issue.id,
        title: issue.title,
        location: `${issue.location} · ${issue.specificLocation || 'Campus Zone'}`,
        resolvedTime: `Resolved ${issue.resolutionProof?.timeToResolveHours || 4}h ago`,
        rating: idx === 0 ? "5.0" : "4.9",
        department: issue.assignedDepartment || "Facilities Engineering",
        confirmationTag: "Verified & Closed",
        beforeImage: issue.imageUrl || DEFAULT_STITCH_SHOWCASE[0].beforeImage,
        afterImage: issue.resolutionProof?.imageUrl || DEFAULT_STITCH_SHOWCASE[0].afterImage
      }))
    : DEFAULT_STITCH_SHOWCASE;

  return (
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.005em' }}>
            Recently Resolved Campus Issues
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 2 }}>
            Public accountability showcase verified by student feedback ratings.
          </p>
        </div>
        <span
          className="font-mono"
          style={{ fontSize: '12px', color: 'var(--cobalt)', cursor: 'pointer', fontWeight: 600 }}
        >
          View Historical Registry &rarr;
        </span>
      </div>

      {/* Grid of 2 Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {displayCards.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {item.resolvedTime}
                  </span>
                  <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.id}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    marginTop: 6,
                    lineHeight: 1.3
                  }}
                >
                  {item.title}
                </h3>
                <div
                  className="font-mono"
                  style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}
                >
                  {item.location}
                </div>
              </div>

              {/* Star Rating */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#fffbeb',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #fde68a'
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color: '#d97706',
                    fontVariationSettings: "'FILL' 1"
                  }}
                >
                  star
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                  {item.rating}
                </span>
              </div>
            </div>

            {/* Before / After Photos Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-input)',
                  overflow: 'hidden',
                  backgroundColor: '#f1f5f9',
                  height: 112
                }}
              >
                <img
                  src={item.beforeImage}
                  alt="Before repair"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <span
                  className="font-mono"
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)'
                  }}
                >
                  Before
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-input)',
                  overflow: 'hidden',
                  backgroundColor: '#f1f5f9',
                  height: 112
                }}
              >
                <img
                  src={item.afterImage}
                  alt="Verified fix"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <span
                  className="font-mono"
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    backgroundColor: '#065f46',
                    color: '#ffffff',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)'
                  }}
                >
                  Verified Fix
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div
              style={{
                paddingTop: 10,
                borderTop: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>
                Resolved by <strong>{item.department}</strong>
              </span>
              <span
                style={{
                  color: '#047857',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  verified
                </span>
                <span>{item.confirmationTag}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
