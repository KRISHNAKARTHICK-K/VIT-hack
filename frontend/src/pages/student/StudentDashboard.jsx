// src/pages/student/StudentDashboard.jsx - Real-Time Connected Student Operations Hub
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { ResolvedShowcase } from '../../components/showcase/ResolvedShowcase';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { issuesApi } from '../../api/issues';
import { analyticsApi } from '../../api/analytics';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { subscribe, reconnectCount } = useSocket();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [showcase, setShowcase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [sortBy, setSortBy] = useState('severity');

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [myIssues, showcaseItems] = await Promise.all([
        issuesApi.getAll({ studentId: user?.id }),
        analyticsApi.getResolvedShowcase()
      ]);
      setIssues(myIssues);
      setShowcase(showcaseItems);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData, reconnectCount]);

  // Real-Time Socket Event Subscriptions
  useEffect(() => {
    const unsubCreated = subscribe('issue:created', (data) => {
      if (!data?.issue) return;
      // If created by this student or campus-wide, update issues list
      if (data.issue.reportedBy?.id === user?.id) {
        setIssues((prev) => {
          if (prev.some((i) => i.id === data.issue.id)) return prev;
          return [data.issue, ...prev];
        });
      }
    });

    const unsubUpdated = subscribe('issue:updated', (data) => {
      if (!data?.issue) return;
      setIssues((prev) =>
        prev.map((i) => (i.id === data.issue.id ? data.issue : i))
      );
    });

    const unsubResolved = subscribe('issue:resolved', (data) => {
      if (!data?.issue) return;
      setIssues((prev) =>
        prev.map((i) => (i.id === data.issue.id ? data.issue : i))
      );
      // Refresh showcase items
      analyticsApi.getResolvedShowcase().then(setShowcase).catch(() => {});
    });

    const unsubConfirmed = subscribe('issue:confirmed', (data) => {
      if (!data?.issue) return;
      setIssues((prev) =>
        prev.map((i) => (i.id === data.issue.id ? data.issue : i))
      );
    });

    const unsubAnalytics = subscribe('analytics:updated', () => {
      analyticsApi.getResolvedShowcase().then(setShowcase).catch(() => {});
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubResolved();
      unsubConfirmed();
      unsubAnalytics();
    };
  }, [subscribe, user?.id]);

  const activeIssues = issues.filter(
    (i) => i.status === 'Reported' || i.status === 'Verified' || i.status === 'Assigned' || i.status === 'In Progress'
  );
  const inProgressIssues = issues.filter((i) => i.status === 'In Progress');
  const resolvedIssues = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed');

  const filteredIssues = issues.filter((i) => {
    if (statusFilter === 'Active') return i.status !== 'Resolved' && i.status !== 'Closed';
    if (statusFilter === 'Resolved') return i.status === 'Resolved' || i.status === 'Closed';
    return true;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'severity') {
      const pMap = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    if (sortBy === 'building') {
      return (a.location || '').localeCompare(b.location || '');
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getSeverityBadge = (priority) => {
    if (priority === 'Urgent' || priority === 'High') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {priority === 'Urgent' ? 'Urgent' : 'High Priority'}
        </span>
      );
    }
    if (priority === 'Medium') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Low
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'In Progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          In Progress
        </span>
      );
    }
    if (status === 'Verified') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          Verified
        </span>
      );
    }
    if (status === 'Resolved' || status === 'Closed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          {status === 'Closed' ? 'Closed' : 'Resolved'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        Reported
      </span>
    );
  };

  const latestActiveId = activeIssues[0]?.id || 'CT-1024';

  return (
    <PageContainer>
      <div className="max-w-[1380px] mx-auto space-y-8 animate-fadeIn" id="view-student">
        {/* Campus Alert Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-center justify-between text-body-sm text-[#0F2942]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1E3A8A] text-[20px]">info</span>
            <span>
              <strong>Campus Real-Time Sync Active:</strong> Issue updates from Estate Office and maintenance technicians are streamed live to this hub.
            </span>
          </div>
          <span className="text-xs font-mono text-[#64748B] hidden sm:inline">Live Connected</span>
        </div>

        {/* Student Header with Stats Bento */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
          <div>
            <div className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Undergraduate Facilities Desk</div>
            <h1 className="text-headline-xl font-headline-xl font-bold text-primary">Student Issue Registry &amp; Tracker</h1>
            <p className="text-body-sm text-[#64748B] mt-0.5">Submit safety hazards, maintenance requests, and track real-time resolution on campus.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-primary border border-[#CBD5E1] text-label-md font-label-md rounded font-medium shadow-sm transition-all flex items-center gap-1.5"
              onClick={() => navigate(`/student/issues/${latestActiveId}`)}
            >
              <span className="material-symbols-outlined text-[18px]">search_check</span>
              <span>Track {latestActiveId}</span>
            </button>
            <Link to="/student/report">
              <button className="px-4 py-2 bg-[#0F2942] hover:bg-[#1E3A8A] text-white text-label-md font-label-md rounded font-semibold shadow-sm active:scale-[0.98] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Report an Issue</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-[#64748B]">
              <span className="text-label-sm font-label-sm uppercase">Active Issues</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-primary mt-1 font-mono">
              {activeIssues.length}
            </div>
            <div className="text-[12px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-2 font-medium">
              {activeIssues.filter((i) => i.priority === 'High' || i.priority === 'Urgent').length} High Priority
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-[#64748B]">
              <span className="text-label-sm font-label-sm uppercase">In Progress</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-primary mt-1 font-mono">
              {inProgressIssues.length}
            </div>
            <div className="text-[12px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-2 font-medium">
              Technicians Dispatched
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-[#64748B]">
              <span className="text-label-sm font-label-sm uppercase">Resolved</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-primary mt-1 font-mono">
              {resolvedIssues.length}
            </div>
            <div className="text-[12px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-2 font-medium">
              100% Closed-Loop Rated
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-[#64748B]">
              <span className="text-label-sm font-label-sm uppercase">Total Reports</span>
              <span className="material-symbols-outlined text-[16px]">stacked_bar_chart</span>
            </div>
            <div className="text-headline-2xl font-headline-2xl font-bold text-primary mt-1 font-mono">
              {issues.length}
            </div>
            <div className="text-[12px] text-[#64748B] mt-2 font-mono">
              Live Synchronized
            </div>
          </div>
        </div>

        {/* Section: Active Reports Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">assignment_late</span>
              <h2 className="text-headline-sm font-headline-sm font-bold text-primary">My Active Reports</h2>
              <span className="bg-[#EFF4FF] text-[#1E3A8A] font-mono text-xs px-2 py-0.5 rounded font-semibold border border-[#CBD5E1]">
                {activeIssues.length} Pending Action
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded border border-[#E2E8F0]">
                {['Active', 'All', 'Resolved'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      statusFilter === tab
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-[#64748B] hover:text-primary'
                    }`}
                  >
                    {tab} ({tab === 'Active' ? activeIssues.length : tab === 'Resolved' ? resolvedIssues.length : issues.length})
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#64748B]">Sort by:</span>
                <select
                  className="h-8 text-xs border border-[#CBD5E1] rounded bg-white px-2 text-[#334155] focus:ring-1 focus:ring-[#1E3A8A]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="severity">Severity: High to Low</option>
                  <option value="date">Latest Reported</option>
                  <option value="building">Building Block</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <LoadingState message="Fetching campus maintenance records..." />
            </div>
          ) : sortedIssues.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No reported issues in this tab"
                description="You have no active maintenance issues matching this status filter."
                actionText="Report an Issue"
                onAction={() => navigate('/student/report')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-label-sm font-label-sm text-[#475569]">
                    <th className="py-3 px-5">WORK ORDER ID</th>
                    <th className="py-3 px-5">ISSUE TITLE &amp; DESCRIPTION</th>
                    <th className="py-3 px-5">LOCATION &amp; BUILDING</th>
                    <th className="py-3 px-5">SEVERITY</th>
                    <th className="py-3 px-5">STATUS</th>
                    <th className="py-3 px-5">ASSIGNED DEPARTMENT</th>
                    <th className="py-3 px-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-body-sm font-body-sm">
                  {sortedIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="hover:bg-[#F8FAFC] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/student/issues/${issue.id}`)}
                    >
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#1E3A8A]">
                        <div className="flex items-center gap-1.5">
                          {issue.status === 'In Progress' && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                          )}
                          {issue.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-primary group-hover:text-[#1E3A8A] transition-colors">
                          {issue.title}
                        </div>
                        <div className="text-xs text-[#64748B] truncate max-w-xs">
                          {issue.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155]">
                          <span className="material-symbols-outlined text-[14px]">apartment</span>
                          {issue.location} {issue.specificLocation ? `· ${issue.specificLocation}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {getSeverityBadge(issue.priority)}
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadge(issue.status)}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#334155]">
                        {issue.assignedDepartment || 'Estate Office Triage'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          className="px-2.5 py-1 text-xs font-medium text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/issues/${issue.id}`);
                          }}
                        >
                          Track Live
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Recently Resolved Showcase (Public Accountability) */}
        <ResolvedShowcase items={showcase} />
      </div>
    </PageContainer>
  );
};
