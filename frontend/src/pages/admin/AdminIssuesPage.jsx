// src/pages/admin/AdminIssuesPage.jsx - Real-Time Master Issue Registry & Dispatches
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { FilterBar } from '../../components/issues/FilterBar';
import { IssueTable } from '../../components/issues/IssueTable';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/issues/Timeline';
import { PriorityCalculator } from '../../components/admin/PriorityCalculator';
import { DuplicateMergerModal } from '../../components/admin/DuplicateMergerModal';
import { LoadingState } from '../../components/common/LoadingState';
import { issuesApi } from '../../api/issues';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import {
  CheckCircle,
  Wrench,
  Layers,
  AlertTriangle,
  Building,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const DEPARTMENTS = [
  'Electrical Maintenance',
  'Plumbing & Water Supply',
  'Civil & Infrastructure',
  'Sanitation & Housekeeping',
  'Carpentry & Furniture'
];

export const AdminIssuesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { subscribe, reconnectCount } = useSocket();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [department, setDepartment] = useState(searchParams.get('department') || 'All');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'All');

  // Selected Issue Management Modal
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Action states inside Modal
  const [assignDepartment, setAssignDepartment] = useState(DEPARTMENTS[0]);
  const [actionLoading, setActionLoading] = useState(false);
  const [calculatedPriorityData, setCalculatedPriorityData] = useState(null);

  const fetchIssues = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await issuesApi.getAll({
        search,
        status,
        category,
        priority,
        department,
        location: locationFilter !== 'All' ? locationFilter : undefined
      });
      setIssues(data);

      // If URL has specific issue ID, auto-open
      const urlId = searchParams.get('id');
      if (urlId) {
        const target = data.find((i) => i.id === urlId);
        if (target) {
          setSelectedIssue(target);
          setIsManageModalOpen(true);
        }
      }
    } catch (err) {
      if (!isSilent) showToast('Failed to load issues: ' + err.message, 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [category, department, locationFilter, priority, search, searchParams, showToast, status]);

  useEffect(() => {
    fetchIssues(false);
  }, [fetchIssues, reconnectCount]);

  // Real-Time Socket Event Subscriptions
  useEffect(() => {
    const handleRealtimeChange = () => {
      fetchIssues(true);
    };

    const unsubCreated = subscribe('issue:created', handleRealtimeChange);
    const unsubUpdated = subscribe('issue:updated', handleRealtimeChange);
    const unsubAssigned = subscribe('issue:assigned', handleRealtimeChange);
    const unsubResolved = subscribe('issue:resolved', handleRealtimeChange);
    const unsubConfirmed = subscribe('issue:confirmed', handleRealtimeChange);
    const unsubMerged = subscribe('issue:merged', handleRealtimeChange);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAssigned();
      unsubResolved();
      unsubConfirmed();
      unsubMerged();
    };
  }, [fetchIssues, subscribe]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('All');
    setCategory('All');
    setPriority('All');
    setDepartment('All');
    setLocationFilter('All');
    setSearchParams({});
  };

  const handleOpenManage = (issue) => {
    setSelectedIssue(issue);
    setAssignDepartment(issue.assignedDepartment || DEPARTMENTS[0]);
    setIsManageModalOpen(true);
  };

  // 1. Verify and set priority
  const handleVerifyReport = async () => {
    if (!selectedIssue) return;
    setActionLoading(true);
    try {
      const updated = await issuesApi.verify(selectedIssue.id, {
        priority: calculatedPriorityData?.priority || selectedIssue.priority,
        severity: calculatedPriorityData?.factors?.severity,
        safetyImpact: calculatedPriorityData?.factors?.safetyImpact,
        peopleAffected: calculatedPriorityData?.factors?.peopleAffected,
        comment: 'Estate Office validated condition on site and established priority matrix.'
      });
      setSelectedIssue(updated);
      showToast(`Ticket ${selectedIssue.id} verified and prioritized`, 'success');
      fetchIssues(true);
    } catch (err) {
      showToast('Verification failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Assign Department
  const handleAssignDepartment = async () => {
    if (!selectedIssue) return;
    setActionLoading(true);
    try {
      const updated = await issuesApi.assign(selectedIssue.id, {
        department: assignDepartment,
        comment: `Work order dispatched to ${assignDepartment}.`
      });
      setSelectedIssue(updated);
      showToast(`Assigned to ${assignDepartment}`, 'success');
      fetchIssues(true);
    } catch (err) {
      showToast('Assignment failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer
      title="Campus Issue Management Console"
      subtitle="Review, verify, prioritize, assign departments, and consolidate student maintenance reports"
      action={
        <Button variant="secondary" icon={RefreshCw} size="sm" onClick={() => fetchIssues(false)}>
          Refresh Queue
        </Button>
      }
    >
      {/* Multi-attribute Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        priority={priority}
        onPriorityChange={setPriority}
        department={department}
        onDepartmentChange={setDepartment}
        showDepartment={true}
        onReset={handleResetFilters}
      />

      {/* Issues Table */}
      {loading ? (
        <LoadingState message="Filtering campus issues..." />
      ) : (
        <IssueTable
          issues={issues}
          onSelectIssue={handleOpenManage}
          actionLabel="Review & Dispatch"
        />
      )}

      {/* Comprehensive Issue Management Modal */}
      {selectedIssue && (
        <Modal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          title={`Manage Ticket ${selectedIssue.id}: ${selectedIssue.title}`}
          maxWidth="780px"
          footer={
            <Button variant="secondary" onClick={() => setIsManageModalOpen(false)}>
              Close Console
            </Button>
          }
        >
          <div>
            {/* Header info bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={selectedIssue.status} />
                <PriorityBadge priority={selectedIssue.priority} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-600)' }}>
                  {selectedIssue.category}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Reported {new Date(selectedIssue.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Photo & Description */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedIssue.imageUrl ? '180px 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
              {selectedIssue.imageUrl && (
                <div style={{ height: 130, backgroundColor: 'var(--navy-900)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img
                    src={selectedIssue.imageUrl}
                    alt={selectedIssue.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div>
                <p style={{ fontSize: '13px', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: 8 }}>
                  {selectedIssue.description}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Location: <strong>{selectedIssue.location}</strong> ({selectedIssue.specificLocation})
                  <br />
                  Reported by: <strong>{selectedIssue.reportedBy?.name || 'Student'}</strong> ({selectedIssue.reportedBy?.rollNumber})
                </div>
              </div>
            </div>

            {/* Smart Complaint Merging Action Button */}
            <div style={{ marginBottom: 20, padding: 12, backgroundColor: 'var(--navy-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
                  Smart Complaint Merging
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Check if other students have reported the same issue in {selectedIssue.location}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Layers}
                onClick={() => setIsMergeModalOpen(true)}
              >
                Scan & Merge Duplicates
              </Button>
            </div>

            {/* Admin Verification & Impact-Based Priority */}
            <div style={{ marginBottom: 20 }}>
              <PriorityCalculator
                initialSeverity={selectedIssue.severity || 'Medium'}
                initialSafety={selectedIssue.safetyImpact || 'Moderate'}
                initialPeople={selectedIssue.peopleAffected || 'Classroom (30-60 people)'}
                onPriorityCalculated={(p, factors) => {
                  setCalculatedPriorityData({ priority: p, factors });
                }}
              />

              {selectedIssue.status === 'Reported' && (
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  size="sm"
                  onClick={handleVerifyReport}
                  loading={actionLoading}
                  style={{ width: '100%' }}
                >
                  Verify Ticket & Set Calculated Priority ({calculatedPriorityData?.priority || selectedIssue.priority})
                </Button>
              )}
            </div>

            {/* Department Assignment */}
            <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wrench size={16} color="var(--primary)" />
                <span>Department Assignment</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="select-field"
                  style={{ fontSize: '13px', flex: 1 }}
                  value={assignDepartment}
                  onChange={(e) => setAssignDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssignDepartment}
                  loading={actionLoading}
                >
                  Dispatch to Department
                </Button>
              </div>
            </div>

            {/* Timeline Audit Trail */}
            <Timeline
              currentStatus={selectedIssue.status}
              timeline={selectedIssue.timeline}
              progressUpdates={selectedIssue.progressUpdates}
            />
          </div>
        </Modal>
      )}

      {/* Duplicate Merger Modal */}
      {selectedIssue && (
        <DuplicateMergerModal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          primaryIssue={selectedIssue}
          onMergedSuccess={() => {
            fetchIssues(true);
            setIsManageModalOpen(false);
          }}
        />
      )}
    </PageContainer>
  );
};
