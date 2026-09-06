// src/pages/admin/AdminDashboard.jsx - Real-Time Connected Admin Operations Center
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { CampusHeatmap } from '../../components/admin/CampusHeatmap';
import { DuplicateMergerModal } from '../../components/admin/DuplicateMergerModal';
import { LoadingState } from '../../components/common/LoadingState';
import { issuesApi } from '../../api/issues';
import { analyticsApi } from '../../api/analytics';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { subscribe, reconnectCount } = useSocket();

  const [overview, setOverview] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterDept, setFilterDept] = useState('All');
  const [mergerModalOpen, setMergerModalOpen] = useState(false);
  const [targetMergeIssue, setTargetMergeIssue] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [overviewData, heatmapData, issuesData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getHeatmap(),
        issuesApi.getAll()
      ]);

      setOverview(overviewData);
      setHeatmap(heatmapData);
      setIssues(issuesData);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      if (!isSilent) showToast('Error refreshing operations data', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData, reconnectCount]);

  // Real-Time Socket Event Subscriptions for Admin Command
  useEffect(() => {
    const handleRealtimeChange = () => {
      fetchDashboardData(true);
    };

    const unsubCreated = subscribe('issue:created', (data) => {
      if (data?.issue) {
        showToast(`New incident logged: ${data.issue.id} at ${data.issue.location}`, 'info');
      }
      handleRealtimeChange();
    });

    const unsubUpdated = subscribe('issue:updated', handleRealtimeChange);
    const unsubAssigned = subscribe('issue:assigned', handleRealtimeChange);
    const unsubResolved = subscribe('issue:resolved', handleRealtimeChange);
    const unsubConfirmed = subscribe('issue:confirmed', handleRealtimeChange);
    const unsubMerged = subscribe('issue:merged', handleRealtimeChange);
    const unsubAnalytics = subscribe('analytics:updated', handleRealtimeChange);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAssigned();
      unsubResolved();
      unsubConfirmed();
      unsubMerged();
      unsubAnalytics();
    };
  }, [fetchDashboardData, showToast, subscribe]);

  const handleSelectLocation = (locName) => {
    setSelectedLocation(locName);
    if (locName) {
      navigate(`/admin/issues?location=${encodeURIComponent(locName)}`);
    }
  };

  const handleExportCSV = () => {
    if (!issues.length) {
      showToast('No records available to export', 'warning');
      return;
    }
    const headers = ['ID', 'Title', 'Category', 'Location', 'Severity', 'Status', 'Created'];
    const rows = issues.map((i) => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.category || '',
      `"${i.location || ''}"`,
      i.priority || 'Medium',
      i.status || 'Reported',
      i.createdAt ? new Date(i.createdAt).toISOString() : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusTrack_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit CSV successfully!', 'success');
  };

  const handleTriggerMerge = (issue) => {
    setTargetMergeIssue(issue || issues[0] || { id: 'CT-1021', title: 'Corridor Light Ballast', location: 'Academic Block B' });
    setMergerModalOpen(true);
  };

  const filteredIssues = issues.filter((i) => {
    if (filterDept === 'High') return i.priority === 'High' || i.priority === 'Urgent';
    return true;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="p-12">
          <LoadingState message="Aggregating municipal telemetry and campus dispatch logs..." />
        </div>
      </PageContainer>
    );
  }

  const primaryTicketForMerge = issues.find((i) => i.id === 'CT-1021') || issues[0] || {
    id: 'CT-1021',
    title: 'Broken corridor lighting near Room 304',
    location: 'Academic Block B'
  };

  return (
    <PageContainer>
      <section className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6 animate-fadeIn" id="view-admin">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
          <div>
            <div className="text-xs font-mono text-[#64748B] uppercase tracking-wider">
              Institutional Facilities Management System
            </div>
            <h1 className="text-headline-xl font-headline-xl font-bold text-primary">
              Admin Operations Center &amp; Campus Hotspots
            </h1>
            <p className="text-body-sm text-[#64748B] mt-0.5">
              Real-time municipal dispatch triage, workload telemetry, and recurring building diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              99.4% SLA Compliance (Fall Term)
            </span>
            <button
              className="px-3.5 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-label-md font-label-md font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors"
              onClick={handleExportCSV}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Smart Complaint Merging Alert Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">call_merge</span>
            </div>
            <div>
              <div className="font-bold text-amber-900 text-sm">
                Smart Complaint Merging Alert (Related Reports Detected)
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Multiple reports filed in <strong>Academic Block B</strong> for corridor lighting. Consolidate into Master Work Order to optimize technician dispatch.
              </p>
            </div>
          </div>
          <button
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded shadow-sm shrink-0 flex items-center gap-1.5 transition-colors"
            onClick={() => handleTriggerMerge(primaryTicketForMerge)}
          >
            <span className="material-symbols-outlined text-[16px]">merge</span>
            <span>Consolidate Duplicates into {primaryTicketForMerge.id}</span>
          </button>
        </div>

        {/* Operational Metrics Row (5 Bento columns) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="text-label-sm font-label-sm uppercase text-[#64748B]">Total Active</div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-primary mt-1 font-mono">
              {overview?.total || issues.length}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Across 7 campus zones</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="text-label-sm font-label-sm uppercase text-[#64748B]">Pending Verification</div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-amber-600 mt-1 font-mono">
              {overview?.pendingVerification !== undefined ? overview.pendingVerification : issues.filter(i => i.status === 'Reported').length}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">Requires triage inspection</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="text-label-sm font-label-sm uppercase text-[#64748B]">In Progress / Assigned</div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-blue-600 mt-1 font-mono">
              {overview?.inProgress !== undefined ? overview.inProgress : issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned' || i.status === 'Verified').length}
            </div>
            <div className="text-[11px] text-blue-700 mt-1">Crews active on-site</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="text-label-sm font-label-sm uppercase text-[#64748B]">High Priority / Urgent</div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-rose-600 mt-1 font-mono">
              {issues.filter(i => i.priority === 'Urgent' || i.priority === 'High').length}
            </div>
            <div className="text-[11px] text-rose-700 mt-1">Priority SLA monitored</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm col-span-2 md:col-span-1">
            <div className="text-label-sm font-label-sm uppercase text-[#64748B]">Resolved / Closed</div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-emerald-600 mt-1 font-mono">
              {overview?.resolved !== undefined ? overview.resolved : issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">Verified resolutions</div>
          </div>
        </div>

        {/* 2-Column Bento: Campus Hotspots & Master Dispatch Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Heatmap Building Hotspots (5 Cols) */}
          <div className="lg:col-span-5">
            <CampusHeatmap
              heatmapData={heatmap}
              onSelectLocation={handleSelectLocation}
              selectedLocation={selectedLocation}
            />
          </div>

          {/* Master Dispatch Queue Table (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-primary">
                  Master Dispatch Queue
                </h2>
                <div className="text-xs text-[#64748B]">Real-time university maintenance dispatch roster</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#64748B]">Filter:</span>
                <button
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filterDept === 'All'
                      ? 'bg-slate-200 text-slate-800 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setFilterDept('All')}
                >
                  All Issues
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filterDept === 'High'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100'
                  }`}
                  onClick={() => setFilterDept('High')}
                >
                  High Priority
                </button>
                <Link to="/admin/issues">
                  <button className="px-2 py-1 text-xs text-[#1E3A8A] hover:underline font-semibold font-mono">
                    Full Registry →
                  </button>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-label-sm font-label-sm text-[#475569]">
                    <th className="py-2.5 px-4">WO ID</th>
                    <th className="py-2.5 px-4">LOCATION</th>
                    <th className="py-2.5 px-4">CATEGORY</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredIssues.slice(0, 8).map((issue) => (
                    <tr
                      key={issue.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/issues?id=${issue.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#1E3A8A]">
                        {issue.id}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-primary">{issue.location}</div>
                        <div className="text-[#64748B] truncate max-w-[180px]">
                          {issue.specificLocation || issue.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          issue.category === 'Electrical'
                            ? 'bg-blue-50 text-blue-700'
                            : issue.category === 'Plumbing'
                            ? 'bg-sky-50 text-sky-700'
                            : issue.category === 'Civil & Infrastructure'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {issue.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          issue.status === 'Resolved' || issue.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : issue.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700'
                            : issue.status === 'Verified'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          className="px-2.5 py-1 bg-[#0F2942] text-white rounded text-xs hover:bg-[#1E3A8A] transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/issues?id=${issue.id}`);
                          }}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Duplicate Merger Modal */}
      {targetMergeIssue && (
        <DuplicateMergerModal
          isOpen={mergerModalOpen}
          onClose={() => setMergerModalOpen(false)}
          primaryIssue={targetMergeIssue}
          onMergedSuccess={fetchDashboardData}
        />
      )}
    </PageContainer>
  );
};
