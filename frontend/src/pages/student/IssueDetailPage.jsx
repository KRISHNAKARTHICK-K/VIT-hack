// src/pages/student/IssueDetailPage.jsx - Real-Time Connected Issue Details & Closed-Loop Tracker
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { issuesApi } from '../../api/issues';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';

export const IssueDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { subscribe, joinIssueRoom, leaveIssueRoom, reconnectCount } = useSocket();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [escalating, setEscalating] = useState(false);

  // Lightbox Modal for Photo Evidence
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const fetchIssue = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await issuesApi.getById(id);
      setIssue(data);
    } catch (err) {
      if (!isSilent) {
        showToast('Failed to load issue details: ' + err.message, 'error');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchIssue(false);
    joinIssueRoom(id);

    return () => {
      leaveIssueRoom(id);
    };
  }, [fetchIssue, id, joinIssueRoom, leaveIssueRoom, reconnectCount]);

  // Real-Time Socket Event Listener for this specific issue
  useEffect(() => {
    const handleUpdate = (data) => {
      if (!data?.issue) return;
      if (data.issue.id?.toUpperCase() === id?.toUpperCase() || data.issueId?.toUpperCase() === id?.toUpperCase()) {
        setIssue(data.issue);
      }
    };

    const unsubUpdated = subscribe('issue:updated', handleUpdate);
    const unsubProgress = subscribe('issue:progress', handleUpdate);
    const unsubResolved = subscribe('issue:resolved', handleUpdate);
    const unsubConfirmed = subscribe('issue:confirmed', handleUpdate);

    return () => {
      unsubUpdated();
      unsubProgress();
      unsubResolved();
      unsubConfirmed();
    };
  }, [id, subscribe]);

  const handleConfirmResolution = async () => {
    setConfirming(true);
    try {
      const updated = await issuesApi.confirmResolution(id, 'Student inspected and verified fix on-site.');
      setIssue(updated);
      showToast('Thank you! Issue confirmed as resolved and closed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleEscalateUnresolved = async () => {
    setEscalating(true);
    try {
      const response = await fetch(`/api/issues/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('campustrack_token')}`
        },
        body: JSON.stringify({
          action: 'reject',
          comment: 'Student reported issue still persists on-site. Returned to In Progress.'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to escalate');
      setIssue(data);
      showToast('Facilities dispatch notified: Ticket returned to In Progress for additional rectification.', 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="p-12">
          <LoadingState message="Fetching technical dispatch inspection record..." />
        </div>
      </PageContainer>
    );
  }

  if (!issue) {
    return (
      <PageContainer>
        <div className="text-center py-16 space-y-4">
          <h2 className="text-xl font-bold text-primary">Work Order Not Found</h2>
          <p className="text-sm text-[#64748B]">Ticket #{id} does not exist in the central registry.</p>
          <Link to="/student/dashboard">
            <button className="px-4 py-2 bg-[#0F2942] text-white rounded text-sm font-semibold">
              Return to Operations Hub
            </button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Determine active stage index (0 to 5)
  const getStageIndex = (status) => {
    switch (status) {
      case 'Reported': return 0;
      case 'Verified': return 1;
      case 'Assigned': return 2;
      case 'In Progress': return 3;
      case 'Resolved': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const currentStage = getStageIndex(issue.status);

  // Photos
  const initialPhoto =
    issue.imageUrl ||
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';

  const progressPhoto =
    issue.resolutionProof?.imageUrl ||
    (issue.status === 'Resolved' || issue.status === 'Closed'
      ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
      : initialPhoto);

  return (
    <PageContainer>
      <section className="p-6 md:p-8 max-w-[1380px] mx-auto space-y-6 animate-fadeIn" id="view-details">
        {/* Breadcrumb & Back */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <Link to="/student/dashboard" className="hover:underline flex items-center gap-1 text-[#1E3A8A]">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to My Reports
            </Link>
            <span>/</span>
            <span>{issue.location || 'Campus Facilities'}</span>
            <span>/</span>
            <span className="text-primary font-bold">{issue.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {issue.status === 'In Progress' ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                Technician Active On-Site
              </span>
            ) : issue.status === 'Resolved' ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Work Completed &amp; Awaiting Sign-Off
              </span>
            ) : issue.status === 'Closed' ? (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Closed &amp; Verified
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Triage In Queue
              </span>
            )}
          </div>
        </div>

        {/* Ticket Header Bar */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  WORK ORDER # {issue.id}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                  issue.priority === 'Urgent' || issue.priority === 'High'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : issue.priority === 'Medium'
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-slate-700 bg-slate-50 border-slate-200'
                }`}>
                  {issue.priority || 'Normal'} Priority
                </span>
                <span className="text-xs text-[#64748B] font-mono">
                  Logged {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} via Portal
                </span>
              </div>
              <h1 className="text-headline-xl font-headline-xl font-bold text-primary mt-1.5">
                {issue.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] mt-1.5">
                <span>Reporter: <strong>{issue.reportedBy?.name || user?.name || 'Aarav Sharma'}</strong> ({issue.reportedBy?.rollNumber ? `ID: ${issue.reportedBy.rollNumber}` : 'Student'})</span>
                <span>•</span>
                <span>Campus Location: <strong>{issue.location} · {issue.specificLocation || 'General Access Area'}</strong></span>
                <span>•</span>
                <span>Assigned Dept: <strong className="text-[#1E3A8A] font-mono">{issue.assignedDepartment || 'Estate Office Triage'}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="px-3 py-1.5 text-xs font-medium border border-[#CBD5E1] rounded hover:bg-slate-50 flex items-center gap-1 text-[#334155] transition-colors"
                onClick={() => window.print()}
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Record</span>
              </button>
              <button
                className="px-3 py-1.5 text-xs font-semibold bg-[#0F2942] text-white rounded hover:bg-[#1E3A8A] flex items-center gap-1 transition-colors"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Work order link copied to clipboard!', 'success');
                }}
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Share Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6-STAGE VISUAL DISPATCH TIMELINE */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E3A8A]">timeline</span>
              Dispatched Resolution Lifecycle
            </h2>
            <span className="text-xs font-mono text-[#64748B]">Real-Time Synced</span>
          </div>

          <div className="relative pt-3 pb-2">
            <div className="hidden sm:block absolute top-8 left-6 right-6 h-0.5 bg-[#CBD5E1] z-0"></div>
            {/* Progress Fill Bar */}
            <div
              className="hidden sm:block absolute top-8 left-6 h-0.5 bg-[#1E3A8A] z-0 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentStage / 5) * 100)}%` }}
            ></div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
              {/* Stage 1: Reported */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow ${
                  currentStage >= 0 ? 'bg-[#1E3A8A] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="font-bold text-xs text-primary mt-2">1. Reported</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">Logged with photo</div>
              </div>

              {/* Stage 2: Verified */}
              <div className={`flex flex-col items-center text-center ${currentStage < 1 ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow ${
                  currentStage >= 1 ? 'bg-[#1E3A8A] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="font-bold text-xs text-primary mt-2">2. Verified</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {currentStage >= 1 ? 'Approved' : 'Pending'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">Estate Desk Review</div>
              </div>

              {/* Stage 3: Assigned */}
              <div className={`flex flex-col items-center text-center ${currentStage < 2 ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow ${
                  currentStage >= 2 ? 'bg-[#1E3A8A] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="font-bold text-xs text-primary mt-2">3. Assigned</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {currentStage >= 2 ? 'Dispatched' : 'Pending'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {issue.assignedDepartment || 'Dept Triage'}
                </div>
              </div>

              {/* Stage 4: In Progress */}
              <div className={`flex flex-col items-center text-center ${currentStage < 3 ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 shadow ${
                  currentStage === 3
                    ? 'bg-blue-600 text-white ring-blue-100 animate-pulse'
                    : currentStage > 3
                    ? 'bg-[#1E3A8A] text-white ring-white'
                    : 'bg-slate-200 text-slate-600 ring-white'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">build</span>
                </div>
                <div className="font-bold text-xs text-[#1E3A8A] mt-2">4. In Progress</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {currentStage >= 3 ? 'Active Work' : 'Queued'}
                </div>
                <div className="text-[10px] text-blue-700 font-medium">Technician On-Site</div>
              </div>

              {/* Stage 5: Work Completed */}
              <div className={`flex flex-col items-center text-center ${currentStage < 4 ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 shadow ${
                  currentStage >= 4
                    ? 'bg-emerald-600 text-white ring-emerald-100'
                    : 'bg-slate-200 text-slate-600 ring-white'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                </div>
                <div className="font-bold text-xs text-[#64748B] mt-2">5. Resolved</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {currentStage >= 4 ? 'Proof Uploaded' : 'Pending Work'}
                </div>
                <div className="text-[10px] text-slate-500">Evidence verified</div>
              </div>

              {/* Stage 6: Confirmation */}
              <div className={`flex flex-col items-center text-center ${currentStage < 5 ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 shadow ${
                  currentStage === 5
                    ? 'bg-emerald-700 text-white ring-emerald-200'
                    : 'bg-slate-200 text-slate-600 ring-white'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">rate_review</span>
                </div>
                <div className="font-bold text-xs text-[#64748B] mt-2">6. Closed</div>
                <div className="text-[11px] font-mono text-[#64748B]">
                  {currentStage === 5 ? 'Sign-Off Complete' : 'Final Sign-Off'}
                </div>
                <div className="text-[10px] text-slate-500">Student verification</div>
              </div>
            </div>
          </div>

          {/* Closed-Loop Confirmation Interactive Module */}
          <div className="bg-[#EFF4FF] border border-[#CBD5E1] rounded-lg p-4 mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
              </div>
              <div>
                <div className="text-label-md font-label-md font-bold text-primary">Student Closed-Loop Confirmation</div>
                <div className="text-xs text-[#475569]">
                  {issue.status === 'Resolved'
                    ? 'Technician has completed repairs and submitted photo proof. Please verify the physical fix below.'
                    : issue.status === 'Closed'
                    ? 'Thank you! You have confirmed this repair and the ticket is officially closed in university archives.'
                    : 'Once technician completes repairs and uploads resolution photos, this rating prompt unlocks for verification.'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-all"
                onClick={handleConfirmResolution}
                disabled={issue.status !== 'Resolved' || confirming || escalating}
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{confirming ? 'Recording Verification...' : 'Confirm Resolution & Close'}</span>
              </button>
              <button
                className="px-4 py-2 bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 border border-rose-300 text-xs font-semibold rounded flex items-center gap-1.5 transition-all"
                onClick={handleEscalateUnresolved}
                disabled={issue.status !== 'Resolved' || confirming || escalating}
              >
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{escalating ? 'Escalating...' : 'Still Unresolved'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Technical Inspection vs Dispatch Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Photo Evidence & Hierarchy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Photographic Inspection Evidence Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Photographic Evidence &amp; Site Inspection
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#475569]">Initial Report Photo (Uploaded by Student)</div>
                  <div
                    className="relative rounded border border-[#CBD5E1] overflow-hidden bg-slate-100 h-48 cursor-pointer group"
                    onClick={() => setActivePhotoModal({ url: initialPhoto, title: 'Initial Incident Report Photo' })}
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      src={initialPhoto}
                      alt="Initial report photo"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                      Before Repair
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">zoom_in</span> Click to Zoom
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#475569]">
                    {issue.status === 'Resolved' || issue.status === 'Closed' ? 'Resolution Proof (Uploaded by Technician)' : 'Current Technician Work Inspection'}
                  </div>
                  <div
                    className="relative rounded border border-[#CBD5E1] overflow-hidden bg-slate-100 h-48 cursor-pointer group"
                    onClick={() => setActivePhotoModal({ url: progressPhoto, title: 'Technician Resolution Evidence Photo' })}
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      src={progressPhoto}
                      alt="Work inspection photo"
                    />
                    <span className={`absolute top-2 left-2 px-2 py-0.5 text-white text-[10px] font-mono rounded ${issue.status === 'Resolved' || issue.status === 'Closed' ? 'bg-emerald-700' : 'bg-blue-700'}`}>
                      {issue.status === 'Resolved' || issue.status === 'Closed' ? 'After Repair Proof' : 'Live Progress Photo'}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">zoom_in</span> Click to Zoom
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-2">
                <div className="text-xs font-semibold text-[#334155]">Reported Description &amp; Symptoms:</div>
                <p className="text-body-sm text-[#475569] leading-relaxed">
                  "{issue.description}"
                </p>
              </div>

              {issue.resolutionProof && (
                <div className="p-3.5 bg-emerald-50 rounded border border-emerald-200 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Technician Resolution Summary:
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    "{issue.resolutionProof.notes}"
                  </p>
                  <div className="text-[11px] font-mono text-emerald-700 flex items-center justify-between pt-1">
                    <span>Resolved by: {issue.resolutionProof.resolvedBy}</span>
                    <span>Time Taken: {issue.resolutionProof.timeToResolveHours || 2.5} hrs</span>
                  </div>
                </div>
              )}

              {/* Physical Hierarchy */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-[#64748B]">Physical Facility Hierarchy:</div>
                <div className="font-code-sm text-code-sm bg-slate-100 border border-slate-200 px-3 py-2 rounded text-slate-800 font-mono">
                  VIT Campus &gt; {issue.location || 'Academic Block B'} &gt; {issue.specificLocation || 'Classroom / Corridor'}
                </div>
              </div>
            </div>

            {/* Floorplan Snippet & Coordinates */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  Campus Facility Proximity Zone
                </h3>
                <span className="text-xs font-mono text-[#64748B]">Zone: {issue.location}</span>
              </div>
              <div className="h-32 bg-slate-100 border border-slate-200 rounded flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundSize: '16px 16px',
                    backgroundImage: 'linear-gradient(to right, #64748B 1px, transparent 1px), linear-gradient(to bottom, #64748B 1px, transparent 1px)'
                  }}
                ></div>
                <div className="relative z-10 flex items-center gap-3 bg-white/95 px-4 py-2 rounded border border-[#CBD5E1] shadow-sm">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                  <div className="text-xs font-bold text-primary">
                    {issue.location} · {issue.specificLocation || 'Facility Node'}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">(Campus Infrastructure Grid)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch Team & Timeline */}
          <div className="lg:col-span-5 space-y-6">
            {/* Assigned Maintenance Department Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">engineering</span>
                Assigned Dispatch Team
              </h3>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="w-10 h-10 rounded bg-[#0F2942] text-white flex items-center justify-center font-bold font-mono">
                  {issue.assignedDepartment ? issue.assignedDepartment.substring(0, 2).toUpperCase() : 'EO'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-primary text-sm truncate">
                    {issue.assignedDepartment || 'Estate Office Triage'}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    Lead Technician: {issue.assignedTo || 'Assigned on Dispatch'}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">
                  {issue.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                  <div className="text-[#64748B]">Target SLA Window</div>
                  <div className="font-mono font-bold text-primary mt-0.5">
                    {issue.priority === 'Urgent' ? '4 Hours' : issue.priority === 'High' ? '12 Hours' : '24 Hours'}
                  </div>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                  <div className="text-[#64748B]">Safety Impact</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {issue.safetyImpact || 'Moderate'}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="w-full py-2 bg-white hover:bg-slate-50 text-[#1E3A8A] border border-[#CBD5E1] rounded text-label-md font-label-md font-semibold transition-colors flex items-center justify-center gap-1.5"
                  onClick={() => navigate('/department/dashboard')}
                >
                  <span className="material-symbols-outlined text-[16px]">construction</span>
                  <span>Open in Technician Terminal</span>
                </button>
              </div>
            </div>

            {/* Chronological Audit Log */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-headline-sm font-headline-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">history</span>
                Chronological Audit Trail
              </h3>
              <div className="space-y-4 border-l-2 border-[#CBD5E1] ml-2 pl-4 text-xs">
                {issue.timeline && issue.timeline.length > 0 ? (
                  issue.timeline.slice().reverse().map((event, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                        event.stage === 'Closed' ? 'bg-emerald-700' : event.stage === 'Resolved' ? 'bg-emerald-500' : event.stage === 'In Progress' ? 'bg-blue-600 animate-pulse' : 'bg-[#1E3A8A]'
                      }`}></span>
                      <div className="flex justify-between text-[#64748B] font-mono text-[11px]">
                        <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-semibold text-primary">{event.actor || 'System'}</span>
                      </div>
                      <p className="font-semibold text-primary mt-0.5">{event.stage}</p>
                      <p className="text-[#475569] mt-0.5">{event.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span>
                    <div className="flex justify-between text-[#64748B] font-mono text-[11px]">
                      <span>{new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{issue.reportedBy?.name || 'Student'}</span>
                    </div>
                    <p className="text-[#334155] mt-0.5">
                      Ticket created with photo evidence via Student Portal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Zoom Lightbox Modal */}
        {activePhotoModal && (
          <Modal
            isOpen={true}
            onClose={() => setActivePhotoModal(null)}
            title={activePhotoModal.title}
          >
            <div className="space-y-4">
              <div className="max-h-[70vh] overflow-hidden rounded border border-slate-200 bg-slate-950 flex items-center justify-center">
                <img
                  src={activePhotoModal.url}
                  alt={activePhotoModal.title}
                  className="max-h-[68vh] w-auto object-contain"
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-[#0F2942] text-white text-xs font-semibold rounded"
                  onClick={() => setActivePhotoModal(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </Modal>
        )}
      </section>
    </PageContainer>
  );
};
