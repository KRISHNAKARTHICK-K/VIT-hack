// src/pages/department/DepartmentDashboard.jsx - Real-Time Connected Department Field Terminal
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { issuesApi } from '../../api/issues';

const DEFAULT_BEFORE_IMG = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';
const DEFAULT_AFTER_PRESET = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';

export const DepartmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { subscribe, reconnectCount } = useSocket();
  const fileInputRef = useRef(null);

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolution terminal states
  const [notes, setNotes] = useState('Replaced damaged rapid-start 40W electronic ballast and fitted 2x direct retrofit T8 LED tubes. Multimeter reading verified stable 230V line. Corridor illumination restored safely.');
  const [resolutionPhotoFile, setResolutionPhotoFile] = useState(null);
  const [resolutionPreviewUrl, setResolutionPreviewUrl] = useState(DEFAULT_AFTER_PRESET);
  const [timeToResolve, setTimeToResolve] = useState('2.5');

  const myDepartment = user?.departmentName || 'Electrical Maintenance';

  const fetchDepartmentIssues = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await issuesApi.getAll();
      setIssues(data);

      setSelectedIssue((current) => {
        if (!current && data.length > 0) {
          return data.find((i) => i.id === 'CT-1021') || data[0];
        }
        if (current) {
          const updated = data.find((i) => i.id === current.id);
          return updated || current;
        }
        return null;
      });
    } catch (err) {
      if (!isSilent) showToast('Failed to load department work orders: ' + err.message, 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDepartmentIssues(false);
  }, [fetchDepartmentIssues, reconnectCount]);

  // Real-Time Socket Event Subscriptions
  useEffect(() => {
    const handleRealtimeChange = (data) => {
      fetchDepartmentIssues(true);
      if (data?.type === 'ISSUE_ASSIGNED' && data.department === myDepartment) {
        showToast(`New Work Order Assigned: ${data.issueId}!`, 'info');
      }
    };

    const unsubAssigned = subscribe('issue:assigned', handleRealtimeChange);
    const unsubCreated = subscribe('issue:created', () => fetchDepartmentIssues(true));
    const unsubUpdated = subscribe('issue:updated', handleRealtimeChange);
    const unsubProgress = subscribe('issue:progress', handleRealtimeChange);
    const unsubResolved = subscribe('issue:resolved', handleRealtimeChange);
    const unsubConfirmed = subscribe('issue:confirmed', handleRealtimeChange);

    return () => {
      unsubAssigned();
      unsubCreated();
      unsubUpdated();
      unsubProgress();
      unsubResolved();
      unsubConfirmed();
    };
  }, [fetchDepartmentIssues, myDepartment, showToast, subscribe]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolutionPhotoFile(file);
      setResolutionPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Workflow 1: Start Work
  const handleStartWork = async (issue) => {
    setActionLoading(true);
    try {
      const updated = await issuesApi.updateStatus(issue.id, {
        status: 'In Progress',
        comment: `${user?.name || 'Lead Technician'} arrived on site and initiated maintenance repairs.`
      });
      setSelectedIssue(updated);
      showToast(`Work started on ${issue.id}. Status: In Progress`, 'success');
      fetchDepartmentIssues(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow 2: Update Progress Note
  const handleUpdateProgress = async () => {
    if (!selectedIssue) return;
    setActionLoading(true);
    try {
      const updated = await issuesApi.addProgress(selectedIssue.id, {
        text: notes.trim() || 'Technician testing voltage with digital multimeter on site.'
      });
      setSelectedIssue(updated);
      showToast(`Progress logged to work order ${selectedIssue.id}`, 'success');
      fetchDepartmentIssues(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow 3: Mark Completed & Request Student Confirmation
  const handleMarkCompleted = async () => {
    if (!selectedIssue) return;
    if (!notes.trim()) {
      showToast('Please provide completion service notes for university audit.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('notes', notes.trim());
      formData.append('timeToResolveHours', timeToResolve);

      if (resolutionPhotoFile) {
        formData.append('resolutionPhoto', resolutionPhotoFile);
      } else if (resolutionPreviewUrl) {
        formData.append('resolutionImageUrl', resolutionPreviewUrl);
      }

      const updated = await issuesApi.resolve(selectedIssue.id, formData);
      setSelectedIssue(updated);
      showToast(`Work Order ${selectedIssue.id} marked Completed! Notification sent for student sign-off.`, 'success');
      fetchDepartmentIssues(true);
    } catch (err) {
      showToast('Resolution submission failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="p-12">
          <LoadingState message="Connecting to Department Dispatch Terminal..." />
        </div>
      </PageContainer>
    );
  }

  const activeWorkOrders = issues.filter(
    (i) => i.status === 'In Progress' || i.status === 'Assigned' || i.status === 'Reported' || i.status === 'Verified'
  );

  return (
    <PageContainer>
      <section className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6 animate-fadeIn" id="view-maintenance">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
          <div>
            <div className="text-xs font-mono text-[#64748B] uppercase tracking-wider">
              Facilities Field Work Terminal
            </div>
            <h1 className="text-headline-xl font-headline-xl font-bold text-primary">
              Department Operations: {myDepartment}
            </h1>
            <p className="text-body-sm text-[#64748B] mt-0.5">
              Technician: <strong>{user?.name || 'M. Venkatesh'}</strong> · Vehicle Unit: Van-04
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-[#1E3A8A] font-mono text-xs rounded border border-blue-200 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Live Sync Active
            </span>
            <button
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] text-xs font-semibold rounded hover:bg-slate-50 transition-colors"
              onClick={() => navigate(`/student/issues/${selectedIssue?.id || 'CT-1021'}`)}
            >
              View Live Tracker
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Task Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center justify-between">
              <span>Assigned Work Orders</span>
              <span className="text-xs font-mono text-[#64748B]">{activeWorkOrders.length} In-Queue</span>
            </h2>

            {/* List of Active Work Orders */}
            {activeWorkOrders.map((issue) => {
              const isSelected = selectedIssue?.id === issue.id;
              const isOverdue = issue.priority === 'Urgent' || (Date.now() - new Date(issue.createdAt).getTime() > 48 * 3600 * 1000);

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-lg p-5 shadow-sm space-y-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[#1E3A8A] ring-2 ring-blue-100'
                      : isOverdue
                      ? 'border border-rose-300 hover:border-rose-500'
                      : 'border border-[#E2E8F0] hover:border-slate-400'
                  }`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        isOverdue
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : issue.status === 'In Progress'
                          ? 'text-[#1E3A8A] bg-blue-50 border-blue-200'
                          : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}>
                        {issue.id} · {isOverdue ? 'OVERDUE' : issue.status.toUpperCase()}
                      </span>
                      <h3 className="font-bold text-primary text-base mt-1.5">
                        {issue.title}
                      </h3>
                      <div className="text-xs text-[#64748B] font-mono mt-0.5">
                        {issue.location} {issue.specificLocation ? `· ${issue.specificLocation}` : ''}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      issue.priority === 'Urgent' || issue.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {issue.priority}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                    <span className={`font-semibold font-mono ${isOverdue ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {isOverdue ? 'Overdue (+45m)' : 'SLA: Within Target Window'}
                    </span>
                    <div className="flex items-center gap-2">
                      {issue.status !== 'In Progress' && (
                        <button
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWork(issue);
                          }}
                        >
                          Start Work
                        </button>
                      )}
                      <span className="text-[#1E3A8A] font-bold">
                        {isSelected ? 'Active in Workspace →' : 'Switch To'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resolution Evidence & Sign-Off Terminal (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-xs font-mono text-[#64748B]">Active Task Terminal</span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-primary">
                  Resolution Evidence &amp; Work Sign-Off: {selectedIssue?.id || 'CT-1021'}
                </h3>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-[#1E3A8A] px-2.5 py-1 rounded font-semibold border border-blue-200">
                {selectedIssue?.status === 'Resolved' || selectedIssue?.status === 'Closed' ? 'Resolved / Closed' : 'Field Unit Active'}
              </span>
            </div>

            {/* Resolution Evidence Before / After Uploader */}
            <div className="space-y-3">
              <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">compare</span>
                Resolution Proof (Mandatory for Closed-Loop Verification)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before (Student report snapshot) */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#64748B]">Before Fix (Original Dispatch Log)</span>
                  <div className="relative rounded border border-[#CBD5E1] overflow-hidden bg-slate-100 h-36">
                    <img
                      className="w-full h-full object-cover"
                      src={selectedIssue?.imageUrl || DEFAULT_BEFORE_IMG}
                      alt="Before repair snapshot"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      Before
                    </span>
                  </div>
                </div>

                {/* After (Technician resolution photo uploader) */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#64748B]">After Fix (Technician Camera Upload)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />

                  {resolutionPreviewUrl ? (
                    <div className="relative rounded border border-emerald-500 overflow-hidden bg-slate-100 h-36 group">
                      <img
                        className="w-full h-full object-cover"
                        src={resolutionPreviewUrl}
                        alt="Repaired fixture resolution proof"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-emerald-800 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        Verified Fix
                      </span>
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div
                      className="relative rounded border-2 border-dashed border-[#1E3A8A] overflow-hidden bg-[#EFF4FF] h-36 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined text-[#1E3A8A] text-[28px]">add_a_photo</span>
                      <span className="text-xs font-bold text-[#1E3A8A] mt-1">Upload Repaired Fixture Photo</span>
                      <span className="text-[10px] text-[#64748B]">Ensures student verification sign-off</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consumed Parts & Inventory */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary block">
                Parts &amp; Materials Consumed
              </label>
              <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span>1x Replacement Component Set (Central Inventory)</span>
                  <span className="font-mono font-semibold text-primary">In Vehicle Inventory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Standard Diagnostic &amp; Safety Testing</span>
                  <span className="font-mono font-semibold text-emerald-700">Passed</span>
                </div>
              </div>
            </div>

            {/* Technician Work Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary block">
                Technician Service Notes for Record
              </label>
              <textarea
                className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded text-body-sm text-primary focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                placeholder="Details of repair, ballast wiring test voltage, ballast harness replacement..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] flex-wrap gap-2">
              <button
                className="px-3 py-2 border border-[#CBD5E1] rounded text-xs font-medium text-[#475569] hover:bg-slate-50 transition-colors"
                onClick={() => showToast('Dispatched request to Secondary Maintenance Unit', 'info')}
              >
                Hold for Parts
              </button>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 rounded text-xs font-semibold transition-colors"
                  onClick={handleUpdateProgress}
                  disabled={actionLoading}
                >
                  Log Progress
                </button>
                <button
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  onClick={handleMarkCompleted}
                  disabled={actionLoading}
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>{actionLoading ? 'Recording Resolution...' : 'Sign-Off & Upload Proof'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
};
