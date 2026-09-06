// src/components/admin/DuplicateMergerModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { issuesApi } from '../../api/issues';
import { useToast } from '../../context/ToastContext';
import { Copy, Layers, AlertCircle, CheckSquare, Square } from 'lucide-react';

export const DuplicateMergerModal = ({
  isOpen,
  onClose,
  primaryIssue,
  onMergedSuccess
}) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reason, setReason] = useState('Identified as duplicate report for the same campus maintenance location.');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && primaryIssue) {
      setLoading(true);
      issuesApi.getDuplicates(primaryIssue.id)
        .then((data) => {
          setCandidates(data);
          // Pre-select known duplicate if flag exists
          const preselected = data.filter(d => d.isPotentialDuplicateOf === primaryIssue.id).map(d => d.id);
          setSelectedIds(preselected);
        })
        .catch((err) => {
          showToast('Failed to load duplicate candidates: ' + err.message, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, primaryIssue]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleMerge = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one related report to merge.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await issuesApi.merge({
        primaryId: primaryIssue.id,
        duplicateIds: selectedIds,
        reason
      });
      showToast(`Merged ${selectedIds.length} report(s) into ${primaryIssue.id}`, 'success');
      onMergedSuccess();
      onClose();
    } catch (err) {
      showToast('Merge failed: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Complaint Merging"
      maxWidth="640px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleMerge}
            loading={submitting}
            disabled={selectedIds.length === 0}
            icon={Layers}
          >
            Consolidate & Merge Selected ({selectedIds.length})
          </Button>
        </>
      }
    >
      <div>
        <div className="alert-banner alert-info" style={{ marginBottom: 16 }}>
          <Layers size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Primary Ticket: {primaryIssue?.id} — {primaryIssue?.title}</strong>
            <p style={{ marginTop: 2 }}>
              Merging related or duplicate reports links them together, closes redundant tickets, and aggregates affected student counts on the primary ticket.
            </p>
          </div>
        </div>

        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 8 }}>
          Possible Duplicate Reports in {primaryIssue?.location}
        </h4>

        {loading ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: 12 }}>
            Scanning for related tickets...
          </p>
        ) : candidates.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', backgroundColor: 'var(--navy-50)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
            No related open reports detected in {primaryIssue?.location} for this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
            {candidates.map((cand) => {
              const isSelected = selectedIds.includes(cand.id);
              return (
                <div
                  key={cand.id}
                  onClick={() => toggleSelect(cand.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ marginTop: 2, color: isSelected ? 'var(--primary)' : 'var(--navy-400)' }}>
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-900)' }}>
                        {cand.id} — {cand.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {cand.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--navy-600)', marginTop: 4 }}>
                      {cand.description}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                      Reported by {cand.reportedBy?.name || 'Student'} • {new Date(cand.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reason field */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4 }}>
            Consolidation Note / Audit Reason
          </label>
          <input
            type="text"
            className="input-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ fontSize: '13px' }}
          />
        </div>
      </div>
    </Modal>
  );
};
