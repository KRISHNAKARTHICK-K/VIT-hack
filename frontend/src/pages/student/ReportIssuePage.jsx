// src/pages/student/ReportIssuePage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { issuesApi } from '../../api/issues';
import { useToast } from '../../context/ToastContext';

const STITCH_CATEGORIES = [
  { id: 'Electrical', label: 'Electrical', icon: 'bolt' },
  { id: 'Plumbing', label: 'Plumbing', icon: 'water_drop' },
  { id: 'Infrastructure', label: 'Infrastructure', icon: 'domain' },
  { id: 'Cleanliness', label: 'Cleanliness', icon: 'cleaning_services' },
  { id: 'Safety Hazard', label: 'Safety Hazard', icon: 'warning' },
  { id: 'Furniture', label: 'Furniture', icon: 'chair' },
  { id: 'Roads & Pathways', label: 'Roads & Pathways', icon: 'signpost' },
  { id: 'HVAC / Climate', label: 'HVAC / Climate', icon: 'thermostat' }
];

const STITCH_BUILDINGS = [
  'Academic Block B',
  'Hostel Block C',
  'Main University Library',
  'Computer Science Hall',
  'Warren Science Quad',
  'Student Union Center'
];

const STITCH_FLOORS = [
  'Level 2 (2nd Floor)',
  'Basement / Ground',
  'Level 1 (1st Floor)',
  'Level 3 (3rd Floor)',
  'Level 4 (Top Floor)'
];

const QUICK_PRESETS = [
  {
    name: 'Broken corridor ballast & tube',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUVT8D--wilHI74BHPCLF3GNB5u_8abC0Xb_h0KO74SBETDCN4ok09bLYSqRds63SLi3_We1j3oUI8Oo5DuDnSVFbKG_2qe7E4fH-ye5diCMnbTcAF3e-ujmt6qNnJBGjvCwRgV4TlT60D54zhgzFrE07G_jSasJ_xSOq5XuFsh8cQFHwULn4k_XUvafhDCUXEUvNpPxoq82aFKJYQebShdIiXV4vf34-ksZRzjddwPE9rhg5QhTU86g'
  },
  {
    name: 'Exposed wire / cracked faceplate',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCLtWEXe9LC194rTyVbZFJQeelH2SyU_fvTeRKPLRlu9tvnGmytmZu-2n3--HjYZwBoX_Ejnq-ULlrpZ3FiVMtvTLjzxsUQCUKDlCbUGcf5pch0H9HlDQoXVcESkta8CfJTYuQ0yt4BL0IV6LxANYCZOLKqs346-Yxts1s_YJjY3xdAyl67YmruNcz8-8mDZf2eCRLSU9X8Zu5xTRZtNULbgCaQaC2eIrhpIYWIcvNX4ojHi63WWogag'
  },
  {
    name: 'Water leakage / ceiling condensation',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNh3p6t9hCP9YTn648PQ7dPWZYtbEtMfUhZev-k5XwlZOdYErdeCMsTXWb7D2SzwIQ3JL7Kc30khoDHkG7gHCW81e0a6LblBRFAzPHlkgtGl6gb7G8LW0AfI8ib6gsyU3gyIrsOeAHjizYKzB0dO6i0IkM1PFIFrAvOQ4fmXuThPfubsnchXLlOwinGZbA3aKH6EJ9tdnncNAy6SvK9C9ycOmOE1gP2XcF4R-JXg7Z8IV0tftUMTiDUA'
  }
];

export const ReportIssuePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState('Electrical');
  const [building, setBuilding] = useState('Academic Block B');
  const [floor, setFloor] = useState('Level 2 (2nd Floor)');
  const [specificZone, setSpecificZone] = useState('Near Rm 204 or East Corridor');
  const [title, setTitle] = useState('Broken corridor light & flickering ballast');
  const [description, setDescription] = useState(
    'Fluorescent fixture right outside Rm 204 has been strobing intensely since yesterday evening. Emits a buzzing humming noise. Students walking to night physics labs are forced to use phone flashlights because the hallway is dark and flickers dangerously.'
  );
  const [impactScope, setImpactScope] = useState('Widespread / Corridor Impact');

  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(QUICK_PRESETS[0].url);
  const [submitting, setSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      showToast('Please describe the problem symptoms.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim() || `${category} issue at ${building}`);
      formData.append('category', category);
      formData.append('location', building);
      formData.append('specificLocation', `${floor} · ${specificZone.trim()}`);
      formData.append('description', description.trim());
      formData.append('severity', impactScope.includes('Widespread') ? 'High' : 'Medium');
      formData.append('safetyImpact', impactScope.includes('Widespread') ? 'Hazardous' : 'Moderate');
      formData.append('peopleAffected', impactScope.includes('Widespread') ? 'Floor (100+ students)' : 'Individual (<5 people)');

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (previewUrl) {
        formData.append('imageUrl', previewUrl);
      }

      const res = await issuesApi.create(formData);
      setSubmittedIssue(res);
      showToast(`Work order ${res.id} registered in central dispatch!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit issue report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedIssue(null);
    setTitle('');
    setDescription('');
    setSpecificZone('');
    setPhotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <PageContainer>
      <section className="p-6 md:p-8 max-w-[960px] mx-auto space-y-6 animate-fadeIn" id="view-report">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
          <Link to="/student/dashboard" className="hover:underline">
            Campus
          </Link>
          <span>/</span>
          <Link to="/student/dashboard" className="hover:underline">
            Student Desk
          </Link>
          <span>/</span>
          <span className="text-[#0F2942] font-semibold">New Issue Report</span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-headline-xl font-headline-xl font-bold text-primary">
              Log Campus Maintenance or Hazard Incident
            </h1>
            <p className="text-body-sm text-[#64748B] mt-0.5">
              Submissions are instantly routed to North Sector Operations and university dispatch.
            </p>
          </div>
          <Link to="/student/dashboard">
            <button className="p-1.5 text-[#64748B] hover:text-primary rounded border border-[#CBD5E1] transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </Link>
        </div>

        {/* Success State Banner (Stitch Screen 3 Specification) */}
        {submittedIssue && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 space-y-3 animate-fadeIn" id="report-success-state">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700 text-[28px]">check_circle</span>
              <div>
                <div className="font-bold text-emerald-900 text-base">
                  Issue Registered Successfully — Ticket #{submittedIssue.id}
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Automated routing to Facilities Dispatch within 15 mins. SMS notification dispatched to assigned duty supervisor.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="px-4 py-2 bg-[#0F2942] text-white text-xs font-semibold rounded hover:bg-[#1E3A8A] transition-colors"
                onClick={() => navigate(`/student/issues/${submittedIssue.id}`)}
              >
                View Live Tracking
              </button>
              <button
                className="px-4 py-2 bg-white text-[#334155] border border-[#CBD5E1] text-xs font-medium rounded hover:bg-slate-50 transition-colors"
                onClick={resetForm}
              >
                Submit Another
              </button>
            </div>
          </div>
        )}

        {/* Intake Form Container */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Step 1: Photo Evidence Uploader */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                1. Photographic Evidence (Optional but recommended)
              </label>
              <span className="text-xs text-[#64748B] font-mono">JPEG, PNG, HEIC up to 15MB</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-[#CBD5E1] hover:border-[#1E3A8A] rounded-lg p-6 text-center cursor-pointer transition-colors bg-[#F8FAFC]"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#EFF4FF] text-[#1E3A8A] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                  </div>
                  <div className="text-sm font-semibold text-primary">Click to upload photo or take picture from phone</div>
                  <div className="text-xs text-[#64748B]">Shows technicians exact context, serial labels, or hazard boundaries</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded bg-slate-50 border border-slate-200">
                <div className="w-16 h-16 rounded overflow-hidden bg-slate-200 shrink-0 border border-[#CBD5E1]">
                  <img
                    src={previewUrl}
                    alt="Evidence preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-primary truncate font-mono">
                    {photoFile ? photoFile.name : 'IMG_20241024_082914_ballast.jpg'}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.4 MB'} · High clarity photographic evidence
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-600 hover:underline px-3 font-medium"
                  onClick={handleRemovePhoto}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Quick Presets for Demo / Evaluation */}
            <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-[#64748B]">Quick Presets:</span>
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="px-2 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  onClick={() => {
                    setPhotoFile(null);
                    setPreviewUrl(p.url);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Issue Category Selector */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-3">
            <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">category</span>
              2. Primary Issue Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="category-pills">
              {STITCH_CATEGORIES.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill flex items-center gap-2 px-3 py-2.5 rounded border text-xs font-semibold text-left transition-all ${
                      isActive
                        ? 'border-[#1E3A8A] bg-[#EFF4FF] text-[#1E3A8A]'
                        : 'border-[#CBD5E1] hover:border-[#1E3A8A] bg-white text-[#334155]'
                    }`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Description & Symptoms */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-3">
            <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">notes</span>
              3. Issue Description &amp; Immediate Symptoms
            </label>
            <input
              type="text"
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded text-body-sm font-semibold text-primary focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
              placeholder="Short summary (e.g., Flickering ceiling light ballast near 2nd floor lab entrance)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full p-3 bg-white border border-[#CBD5E1] rounded text-body-sm text-primary focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
              placeholder="Describe what is wrong, potential safety risks, frequency of problem, or symptoms..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Step 4: Precise Location Selector */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-3">
            <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              4. Precise Campus Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1 block">Campus Building</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded text-body-sm text-primary"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                >
                  {STITCH_BUILDINGS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1 block">Floor Level</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded text-body-sm text-primary"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                >
                  {STITCH_FLOORS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] mb-1 block">Room / Specific Zone</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded text-body-sm text-primary"
                  placeholder="e.g., Near Rm 204 or East Restroom"
                  value={specificZone}
                  onChange={(e) => setSpecificZone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 5: Impact Rating */}
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-sm space-y-3">
            <label className="text-label-md font-label-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              5. Operational Impact Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                  impactScope === 'Widespread / Corridor Impact'
                    ? 'border-[#1E3A8A] bg-[#EFF4FF]'
                    : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                }`}
              >
                <input
                  type="radio"
                  name="impact"
                  className="mt-1 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  checked={impactScope === 'Widespread / Corridor Impact'}
                  onChange={() => setImpactScope('Widespread / Corridor Impact')}
                />
                <div>
                  <div className="text-xs font-bold text-primary">Widespread / Corridor Impact</div>
                  <div className="text-[11px] text-[#64748B]">Affects entire lecture class, public pathway, or active lab students.</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                  impactScope === 'Isolated Single User / Desk'
                    ? 'border-[#1E3A8A] bg-[#EFF4FF]'
                    : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                }`}
              >
                <input
                  type="radio"
                  name="impact"
                  className="mt-1 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  checked={impactScope === 'Isolated Single User / Desk'}
                  onChange={() => setImpactScope('Isolated Single User / Desk')}
                />
                <div>
                  <div className="text-xs font-bold text-primary">Isolated Single User / Desk</div>
                  <div className="text-[11px] text-[#64748B]">Affects one desk, personal cubicle, or single appliance.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Submission Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            <Link to="/student/dashboard">
              <button
                type="button"
                className="px-4 py-2 border border-[#CBD5E1] rounded text-label-md font-label-md text-[#475569] hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#64748B] hidden sm:inline">Priority will be triaged by SLA Dispatcher</span>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#1E3A8A] active:scale-[0.98] text-white text-label-md font-label-md font-semibold rounded shadow-sm transition-all flex items-center gap-2"
                disabled={submitting}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{submitting ? 'Transmitting Work Order...' : 'Submit Incident Report'}</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </PageContainer>
  );
};
