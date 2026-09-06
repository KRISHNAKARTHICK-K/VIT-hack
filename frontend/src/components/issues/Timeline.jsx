// src/components/issues/Timeline.jsx
import React from 'react';

const STITCH_STAGES = [
  { key: 'Reported', label: '1. Reported', defaultSub: 'Logged & Auto-triaged', icon: 'check' },
  { key: 'Verified', label: '2. Verified', defaultSub: 'Duty Desk Approved', icon: 'check' },
  { key: 'Assigned', label: '3. Assigned', defaultSub: 'Crew Dispatched', icon: 'check' },
  { key: 'In Progress', label: '4. In Progress', defaultSub: 'Electrician on Site', icon: 'build' },
  { key: 'Resolved', label: '5. Resolved', defaultSub: 'Parts replacement', icon: 'task_alt' },
  { key: 'Closed', label: '6. Confirmation', defaultSub: 'Final Sign-off', icon: 'rate_review' }
];

export const Timeline = ({
  currentStatus = 'In Progress',
  timeline = [],
  progressUpdates = [],
  onConfirmResolution,
  isConfirming = false
}) => {
  const currentIndex = STITCH_STAGES.findIndex(
    (s) => s.key.toLowerCase() === currentStatus.toLowerCase()
  );

  const activeIndex = currentIndex >= 0 ? currentIndex : 3;

  const getEventForStage = (stageKey) => {
    return (timeline || []).find((ev) => ev.stage.toLowerCase() === stageKey.toLowerCase());
  };

  const isResolvedOrClosed = currentStatus === 'Resolved' || currentStatus === 'Closed';

  return (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 12,
          marginBottom: 20
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--cobalt)', fontSize: 20 }}>
            timeline
          </span>
          <span>Dispatched Resolution Lifecycle</span>
        </h2>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Updated {timeline && timeline.length > 0 ? new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
        </span>
      </div>

      {/* 6-Stage Horizontal Stepper */}
      <div style={{ position: 'relative', paddingTop: 12, paddingBottom: 16 }}>
        {/* Background Line */}
        <div
          className="hidden sm:block"
          style={{
            position: 'absolute',
            top: 28,
            left: 24,
            right: 24,
            height: 2,
            backgroundColor: '#cbd5e1',
            zIndex: 0
          }}
        />

        {/* Progress Fill Line */}
        <div
          className="hidden sm:block"
          style={{
            position: 'absolute',
            top: 28,
            left: 24,
            width: `${Math.min(100, Math.max(0, (activeIndex / (STITCH_STAGES.length - 1)) * 100))}%`,
            height: 2,
            backgroundColor: 'var(--cobalt)',
            zIndex: 1,
            transition: 'width 0.3s ease'
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 12,
            position: 'relative',
            zIndex: 2
          }}
        >
          {STITCH_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex || currentStatus === 'Closed';
            const isActive = idx === activeIndex && currentStatus !== 'Closed';
            const event = getEventForStage(stage.key);

            let circleBg = '#e2e8f0';
            let circleColor = '#475569';
            let pulseStyle = {};

            if (isActive) {
              circleBg = '#2563eb';
              circleColor = '#ffffff';
              pulseStyle = {
                boxShadow: '0 0 0 4px #dbeafe',
                animation: 'pulse 1.5s infinite'
              };
            } else if (isCompleted) {
              circleBg = 'var(--cobalt)';
              circleColor = '#ffffff';
            }

            return (
              <div
                key={stage.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: circleBg,
                    color: circleColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    border: '3px solid #ffffff',
                    boxShadow: 'var(--shadow-xs)',
                    ...pulseStyle
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isCompleted ? 'check' : stage.icon}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: isActive ? 'var(--cobalt)' : 'var(--primary)', marginTop: 8 }}>
                  {stage.label}
                </div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {event?.timestamp
                    ? new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : 'Pending'}
                </div>
                <div style={{ fontSize: '10px', color: isActive ? '#1d4ed8' : '#047857', fontWeight: 500, marginTop: 2 }}>
                  {event?.comment ? event.comment.substring(0, 22) + '...' : stage.defaultSub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed-Loop Confirmation Interactive Module (Stitch Specs) */}
      <div
        style={{
          backgroundColor: '#eff4ff',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--cobalt)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                thumb_up
              </span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                Student Closed-Loop Confirmation
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isResolvedOrClosed
                  ? 'Maintenance has reported this issue resolved. Please confirm whether the repair meets campus safety standards.'
                  : 'Once technician uploads resolution photos and completes work, this confirmation prompt activates for the reporter.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-success btn-sm"
              style={{ gap: 6, padding: '7px 14px' }}
              onClick={onConfirmResolution}
              disabled={isConfirming || currentStatus === 'Closed'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                check_circle
              </span>
              <span>{currentStatus === 'Closed' ? 'Verified & Closed' : 'Yes, It Is Resolved'}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ gap: 6, padding: '7px 12px', color: '#be123c', borderColor: '#fecdd3' }}
              onClick={() => alert('Facilities desk alerted: Re-inspection requested.')}
              disabled={currentStatus === 'Closed'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                error
              </span>
              <span>Still Unresolved</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
