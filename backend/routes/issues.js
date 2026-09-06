// routes/issues.js - CampusTrack Issue Management & Real-Time Controller
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const store = require('../data/store');
const { authMiddleware, requireRole } = require('./auth');
const { emitSocketEvent } = require('../socket');

// Configure Multer storage
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'issue-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Calculate priority from impact factors
function calculatePriority(severity, safetyImpact, peopleAffected) {
  let score = 0;
  if (severity === 'High') score += 3;
  else if (severity === 'Medium') score += 2;
  else score += 1;

  if (safetyImpact === 'Hazardous') score += 3;
  else if (safetyImpact === 'Moderate') score += 1.5;

  if (peopleAffected && peopleAffected.toLowerCase().includes('entire')) score += 3;
  else if (peopleAffected && peopleAffected.toLowerCase().includes('floor')) score += 2;
  else if (peopleAffected && peopleAffected.toLowerCase().includes('class')) score += 1.5;
  else score += 1;

  if (score >= 7) return 'Urgent';
  if (score >= 5) return 'High';
  if (score >= 3.5) return 'Medium';
  return 'Low';
}

// 1. GET /api/issues/export/csv - Export CSV of issues
router.get('/export/csv', (req, res) => {
  try {
    const issues = store.getIssues();
    const headers = ['ID', 'Title', 'Category', 'Location', 'SpecificLocation', 'Priority', 'Severity', 'SafetyImpact', 'Status', 'AssignedDepartment', 'AssignedTo', 'ReportedBy', 'CreatedAt', 'UpdatedAt'];
    
    const rows = issues.map((i) => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      `"${(i.specificLocation || '').replace(/"/g, '""')}"`,
      i.priority || 'Medium',
      i.severity || 'Medium',
      i.safetyImpact || 'Moderate',
      i.status || 'Reported',
      `"${(i.assignedDepartment || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(i.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(i.reportedBy?.name || 'Anonymous').replace(/"/g, '""')}"`,
      i.createdAt || '',
      i.updatedAt || ''
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="CampusTrack_Audit_${Date.now()}.csv"`);
    res.status(200).send(csvString);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    res.status(500).json({ error: 'Failed to generate CSV export: ' + err.message });
  }
});

// 2. GET /api/issues - List with filters
router.get('/', (req, res) => {
  const { status, category, priority, department, location, search, studentId } = req.query;
  const issues = store.getIssues({
    status,
    category,
    priority,
    department,
    location,
    search,
    studentId
  });
  res.json(issues);
});

// 3. GET /api/issues/:id - Single issue details
router.get('/:id', (req, res) => {
  const issue = store.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  res.json(issue);
});

// 4. GET /api/issues/:id/duplicates - Find possible duplicates
router.get('/:id/duplicates', (req, res) => {
  const duplicates = store.findDuplicateCandidates(req.params.id);
  res.json(duplicates);
});

// 5. POST /api/issues - Report new issue (Student)
router.post('/', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      specificLocation,
      severity = 'Medium',
      safetyImpact = 'Moderate',
      peopleAffected = 'Classroom (30-60 people)',
      imageUrl
    } = req.body;

    if (!category || !location || !description) {
      return res.status(400).json({ error: 'Category, location, and description are required fields.' });
    }

    let finalImageUrl = imageUrl || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (!finalImageUrl) {
      const categoryImages = {
        'Electrical': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
        'Plumbing': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
        'Furniture & Fixtures': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
        'Civil & Infrastructure': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=80',
        'Cleanliness & Sanitation': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
        'Safety & Security': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80'
      };
      finalImageUrl = categoryImages[category] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
    }

    const priority = calculatePriority(severity, safetyImpact, peopleAffected);

    const newIssue = store.createIssue({
      title: title || `${category} issue at ${location}`,
      description,
      category,
      location,
      specificLocation: specificLocation || location,
      severity,
      safetyImpact,
      peopleAffected,
      priority,
      imageUrl: finalImageUrl,
      reportedBy: {
        id: req.user.id,
        name: req.user.name,
        rollNumber: req.user.rollNumber || ''
      }
    });

    // Real-Time Event Broadcast
    emitSocketEvent('issue:created', {
      type: 'ISSUE_CREATED',
      issue: newIssue
    });
    emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

    res.status(201).json(newIssue);
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ error: 'Failed to report issue: ' + err.message });
  }
});

// 6. PATCH /api/issues/:id/verify - Admin verifies & sets impact priority
router.patch('/:id/verify', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const { severity, safetyImpact, peopleAffected, priority, comment } = req.body;
  const issue = store.getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  // State machine check
  if (issue.status === 'Closed') {
    return res.status(400).json({ error: 'Cannot verify a closed issue.' });
  }

  const calculated = priority || calculatePriority(severity || issue.severity, safetyImpact || issue.safetyImpact, peopleAffected || issue.peopleAffected);

  const updated = store.updateIssue(req.params.id, {
    status: 'Verified',
    priority: calculated,
    severity: severity || issue.severity,
    safetyImpact: safetyImpact || issue.safetyImpact,
    peopleAffected: peopleAffected || issue.peopleAffected
  });

  store.addTimelineEvent(
    req.params.id,
    'Verified',
    `${req.user.name} (Administrator)`,
    comment || `Report validated on-site. Priority set to ${calculated} based on safety and affected population impact.`
  );

  const finalIssue = store.getIssueById(req.params.id);

  // Real-Time Event Broadcast
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    stage: 'Verified',
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

  res.json(finalIssue);
});

// 7. PATCH /api/issues/:id/assign - Admin assigns department
router.patch('/:id/assign', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const { department, assignedTo, comment } = req.body;
  if (!department) return res.status(400).json({ error: 'Department is required' });

  const issue = store.getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  if (issue.status === 'Closed') {
    return res.status(400).json({ error: 'Cannot assign a closed ticket.' });
  }

  const updated = store.updateIssue(req.params.id, {
    status: 'Assigned',
    assignedDepartment: department,
    assignedTo: assignedTo || null
  });

  store.addTimelineEvent(
    req.params.id,
    'Assigned',
    `${req.user.name} (Administrator)`,
    comment || `Dispatched to ${department}${assignedTo ? ` (Technician: ${assignedTo})` : ''}. Work order generated.`
  );

  const finalIssue = store.getIssueById(req.params.id);

  // Real-Time Event Broadcast
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    stage: 'Assigned',
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('issue:assigned', {
    type: 'ISSUE_ASSIGNED',
    department,
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

  res.json(finalIssue);
});

// 8. PATCH /api/issues/:id/status - Update status directly (Admin / Dept)
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status, comment } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const issue = store.getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  // Role validation
  if (req.user.role !== 'ADMIN' && req.user.role !== 'DEPARTMENT') {
    return res.status(403).json({ error: 'Unauthorized to change status directly' });
  }

  const updated = store.updateIssue(req.params.id, { status });

  store.addTimelineEvent(
    req.params.id,
    status,
    `${req.user.name} (${req.user.role === 'ADMIN' ? 'Administrator' : req.user.departmentName || 'Department'})`,
    comment || `Status updated to ${status}.`
  );

  const finalIssue = store.getIssueById(req.params.id);

  // Real-Time Event Broadcast
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    stage: status,
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

  res.json(finalIssue);
});

// 9. POST /api/issues/:id/progress - Add interim progress update (Dept or Admin)
router.post('/:id/progress', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Progress update text is required' });

  const issue = store.getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  // Check role authorization
  if (req.user.role !== 'DEPARTMENT' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only maintenance technicians and administrators can log work progress.' });
  }

  // Advance status to In Progress if it was Assigned or Reported
  if (issue.status === 'Assigned' || issue.status === 'Verified') {
    store.updateIssue(req.params.id, { status: 'In Progress' });
    store.addTimelineEvent(
      req.params.id,
      'In Progress',
      `${req.user.name} (${req.user.departmentName || 'Maintenance'})`,
      'Technician commenced on-site work and inspection.'
    );
  }

  store.addProgressUpdate(req.params.id, req.user.name, text.trim());
  const finalIssue = store.getIssueById(req.params.id);

  // Real-Time Event Broadcast
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    stage: finalIssue.status,
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('issue:progress', {
    type: 'ISSUE_PROGRESS',
    issueId: finalIssue.id,
    issue: finalIssue
  });

  res.json(finalIssue);
});

// 10. POST /api/issues/:id/resolve - Department uploads resolution proof & note
router.post('/:id/resolve', authMiddleware, upload.single('resolutionPhoto'), (req, res) => {
  try {
    const { notes, timeToResolveHours, resolutionImageUrl } = req.body;
    const issue = store.getIssueById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Authorization
    if (req.user.role !== 'DEPARTMENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only maintenance technicians and administrators can resolve work orders.' });
    }

    if (issue.status === 'Closed') {
      return res.status(400).json({ error: 'Issue is already closed.' });
    }

    let finalImageUrl = resolutionImageUrl || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
    }

    const resolutionProof = {
      imageUrl: finalImageUrl,
      notes: notes || 'Maintenance work completed and verified as per campus specifications.',
      resolvedAt: new Date().toISOString(),
      resolvedBy: `${req.user.name} (${req.user.departmentName || 'Maintenance Dept'})`,
      timeToResolveHours: Number(timeToResolveHours) || 2.5
    };

    store.updateIssue(req.params.id, {
      status: 'Resolved',
      resolutionProof
    });

    store.addTimelineEvent(
      req.params.id,
      'Resolved',
      `${req.user.name} (${req.user.departmentName || 'Maintenance Dept'})`,
      `Resolution evidence uploaded: ${notes || 'Work completed successfully'}.`
    );

    const finalIssue = store.getIssueById(req.params.id);

    // Real-Time Event Broadcast
    emitSocketEvent('issue:updated', {
      type: 'ISSUE_UPDATED',
      stage: 'Resolved',
      issueId: finalIssue.id,
      issue: finalIssue
    });
    emitSocketEvent('issue:resolved', {
      type: 'ISSUE_RESOLVED',
      issueId: finalIssue.id,
      issue: finalIssue
    });
    emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

    res.json(finalIssue);
  } catch (err) {
    console.error('Error resolving issue:', err);
    res.status(500).json({ error: 'Failed to resolve issue: ' + err.message });
  }
});

// 11. POST /api/issues/:id/confirm - Student confirms closure or reports still unresolved
router.post('/:id/confirm', authMiddleware, (req, res) => {
  const { action = 'confirm', comment } = req.body;
  const issue = store.getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });

  // Ownership or Admin check
  if (req.user.role !== 'ADMIN' && issue.reportedBy && issue.reportedBy.id !== req.user.id) {
    return res.status(403).json({ error: 'Only the student who reported this issue (or an administrator) can confirm its resolution.' });
  }

  if (issue.status !== 'Resolved' && issue.status !== 'Closed') {
    return res.status(400).json({ error: `Cannot confirm issue in current status: ${issue.status}. Must be in 'Resolved' status.` });
  }

  if (action === 'reject' || action === 'reopen') {
    // Reopen ticket
    store.updateIssue(req.params.id, {
      status: 'In Progress'
    });

    store.addTimelineEvent(
      req.params.id,
      'In Progress',
      `${req.user.name} (Student)`,
      comment || 'Student reported issue still persists on-site. Ticket returned to In Progress for additional rectification.'
    );
  } else {
    // Confirm & Close
    store.updateIssue(req.params.id, {
      status: 'Closed'
    });

    store.addTimelineEvent(
      req.params.id,
      'Closed',
      `${req.user.name} (Student)`,
      comment || 'Student confirmed successful physical resolution and closed ticket.'
    );
  }

  const finalIssue = store.getIssueById(req.params.id);

  // Real-Time Event Broadcast
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    stage: finalIssue.status,
    issueId: finalIssue.id,
    issue: finalIssue
  });
  emitSocketEvent('issue:confirmed', {
    type: 'ISSUE_CONFIRMED',
    issueId: finalIssue.id,
    status: finalIssue.status,
    issue: finalIssue
  });
  emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

  res.json(finalIssue);
});

// 12. POST /api/issues/merge - Smart Duplicate Complaint Merging (Admin)
router.post('/merge', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const { primaryId, duplicateIds, reason } = req.body;
  if (!primaryId || !duplicateIds || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
    return res.status(400).json({ error: 'Primary ID and array of duplicate IDs are required' });
  }

  const result = store.mergeIssues(primaryId, duplicateIds, req.user.name, reason);
  if (!result) {
    return res.status(404).json({ error: 'Primary issue not found' });
  }

  // Real-Time Event Broadcast
  emitSocketEvent('issue:merged', {
    type: 'ISSUE_MERGED',
    primaryId,
    duplicateIds,
    primaryIssue: result
  });
  emitSocketEvent('issue:updated', {
    type: 'ISSUE_UPDATED',
    issueId: primaryId,
    issue: result
  });
  emitSocketEvent('analytics:updated', { type: 'ANALYTICS_UPDATED' });

  res.json({
    message: `Successfully merged ${duplicateIds.length} duplicate report(s) into ${primaryId}`,
    primaryIssue: result
  });
});

module.exports = router;
