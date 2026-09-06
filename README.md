# CampusTrack

> A centralized campus issue reporting, operations triage, and closed-loop resolution platform connecting students, estate administrators, and maintenance departments in real time.

---

## Problem Statement

University campuses encounter recurring operational challenges managing infrastructure maintenance and student grievances:
- **Fragmented Reporting Channels:** Complaints are dispersed across informal emails, WhatsApp groups, and verbal notices, leading to lost requests.
- **Lack of Tracking & Transparency:** Students have no visibility into whether an issue was acknowledged, dispatched, or resolved.
- **Duplicate Reports:** Multiple students in the same classroom or residential block report the same incident, overwhelming duty staff.
- **Arbitrary Prioritization:** Facility managers struggle to triage incidents based on safety hazards and population impact.
- **Absence of Verification:** Tickets are often marked "closed" by technicians without physical confirmation from the affected students.

---

## Solution

CampusTrack establishes a **transparent, closed-loop facility operations workflow** that links students, estate administrators, and specialized maintenance departments:

```
[Student Reports] ──► [Admin Verifies & Triages] ──► [Department Dispatched] ──► [Resolution Proof Uploaded] ──► [Student Confirms & Closes]
```

- **Students** log incidents with photo evidence, physical location mapping, and safety impact levels.
- **Estate Office Administrators** verify on-site conditions, calculate deterministic priority/SLA scores, dispatch maintenance departments, and consolidate duplicate complaints.
- **Maintenance Departments** claim work orders, record interim progress updates, and upload **Before/After photographic proof** upon repair completion.
- **Closed-Loop Confirmation:** A ticket cannot reach final closure until the reporting student physically inspects the fix and confirms resolution.

---

## Key Features

### 🎓 Student Experience
- **Structured Incident Reporting:** 5-step guided intake form capturing category, precision location (Building, Floor, Room), description, and visual evidence.
- **Automatic Work Order Generation:** Generates deterministic identifiers (e.g. `CT-1021`, `CT-1024`).
- **Live 6-Stage Tracking:** Real-time visual progress stepper (`Reported` $\rightarrow$ `Verified` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Closed`).
- **Closed-Loop Resolution Sign-Off:** Review post-repair photographs and technician notes to confirm closure or escalate unresolved issues.
- **Resolved Showcase:** Public transparency feed highlighting recently verified repairs across campus.

### 🏛️ Estate Office Admin Operations
- **Real-Time Operations Command:** Campus-wide KPI cards (*Total Active*, *Pending Verification*, *In Progress*, *Overdue SLA*, *Resolution Rate*).
- **Algorithmic Priority Matrix:** Mathematical priority calculation ($Sev + Safety + Population$) computing dynamic SLA targets (4h, 12h, 24h, 48h).
- **Smart Duplicate Merging:** Proximity-based duplicate detector clustering related reports and merging them into a single Master Work Order.
- **Campus Hotspots & Heatmap:** Real-time building-level grievance density cards with risk intensity indicators.
- **Recurring Incident Alerts:** Identifies repeated breakdowns ($\ge 3$ incidents) in the same facility block.
- **Audit Export:** Instant generation of RFC 4180-compliant CSV audit records.

### 🛠️ Maintenance Department Terminal
- **Dedicated Department Queues:** Filtered work rosters for Electrical, Plumbing, Civil, Sanitation, and Carpentry units.
- **Interim Progress Logging:** Technicians record on-site diagnostic milestones and parts consumed.
- **Resolution Proof Sign-Off:** Multipart upload of post-repair photos, completion summary notes, and duration in hours.

### ⚡ Real-Time Engine (Socket.IO)
- **Zero-Refresh Updates:** State mutations propagate instantly between Student, Admin, and Department browser sessions.
- **Role-Based Rooms:** Targeted WebSocket rooms for roles (`role:STUDENT`, `role:ADMIN`, `role:DEPARTMENT`), departments, and specific issues.
- **In-App Notifications:** Real-time alert bell with unread badge counter and direct issue navigation.

---

## How CampusTrack Works

```
┌─────────────────┐       POST /api/issues       ┌─────────────────┐
│     STUDENT     ├─────────────────────────────►│  ESTATE OFFICE  │
│  Reports Issue  │  [Status: 1. Reported]       │     ADMIN       │
└─────────────────┘                              └────────┬────────┘
                                                          │
                         PATCH /api/issues/:id/verify     │ 1. Verify on-site
                         [Status: 2. Verified]            │ 2. Priority & SLA
                                                          │
                         PATCH /api/issues/:id/assign     │ 3. Dispatch Crew
                         [Status: 3. Assigned]            │
                                                          ▼
┌─────────────────┐   POST /api/issues/:id/progress   ┌─────────────────┐
│     STUDENT     │◄──────────────────────────────────┤   DEPARTMENT    │
│  Tracks Live    │   [Status: 4. In Progress]        │   TECHNICIAN    │
└────────┬────────┘                                   └────────┬────────┘
         │                                                     │
         │             POST /api/issues/:id/resolve            │ Uploads Before &
         │◄────────────────────────────────────────────────────┘ After Proof Photo
         │             [Status: 5. Resolved]
         │
         ▼
┌─────────────────┐   POST /api/issues/:id/confirm    ┌─────────────────┐
│     STUDENT     ├──────────────────────────────────►│  FINAL STATE    │
│ Confirms Repair │   [Status: 6. Closed]             │ Ticket Archived │
└─────────────────┘                                   └─────────────────┘
```

---

## User Roles & Permissions

| Action / Capability | Student (`STUDENT`) | Admin (`ADMIN`) | Department (`DEPARTMENT`) |
|---|:---:|:---:|:---:|
| Report Campus Incident | ✅ | ❌ | ❌ |
| Upload Incident Photo | ✅ | ❌ | ❌ |
| Track Personal Issues | ✅ | ❌ | ❌ |
| View Operations Command Dashboard | ❌ | ✅ | ❌ |
| Verify On-Site & Calculate Priority | ❌ | ✅ | ❌ |
| Dispatch Work Order to Department | ❌ | ✅ | ❌ |
| Merge Duplicate Tickets | ❌ | ✅ | ❌ |
| View Campus Hotspots & Recurring Alerts | ❌ | ✅ | ❌ |
| Access Field Work Terminal | ❌ | ❌ | ✅ |
| Log Interim Technical Progress | ❌ | ✅ | ✅ |
| Upload Resolution Proof Photo | ❌ | ✅ | ✅ |
| Confirm Resolution & Close Ticket | ✅ *(Reporter)* | ✅ | ❌ |
| Export Audit CSV Log | ❌ | ✅ | ❌ |

---

## Application Pages & Routes

| Page Name | Route | Role Required | Purpose |
|---|---|---|---|
| **Institutional Access Portal** | `/login` | Public | Multi-role authentication, persona quick-fill switchers, student registration |
| **Student Operations Hub** | `/student/dashboard` | `STUDENT` | Active grievance list, KPI counters, Resolved Showcase carousel |
| **Incident Reporting Intake** | `/student/report` | `STUDENT` | 5-step reporting form with photo upload and live priority preview |
| **Issue Lifecycle & Tracking** | `/student/issues/:id` | `STUDENT`, `ADMIN`, `DEPARTMENT` | 6-stage lifecycle stepper, before/after photo viewer, student closure sign-off |
| **Admin Operations Center** | `/admin/dashboard` | `ADMIN` | High-level campus KPIs, hotspot heatmap, recurring breakdown alerts, dispatch queue |
| **Master Dispatches Registry** | `/admin/issues` | `ADMIN` | Comprehensive filterable registry with verify, assign, and merge modals |
| **Department Operations Terminal** | `/department/dashboard` | `DEPARTMENT` | Field technician work queue, progress logging, and resolution proof sign-off modal |

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                          │
│   React 18 SPA (Vite) + Tailwind CSS + Lucide Icons + React Router v6   │
│   Socket.IO Client (Singleton connection with reconnect recovery)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP REST API (Bearer JWT Auth)
                                   │ WebSocket Events (Socket.IO)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER (Node.js / Express)               │
│   Express App (Port 5000)                                              │
│   ├── Middleware: CORS, express.json(), authMiddleware, requireRole()  │
│   ├── Socket.IO Server: Role & room broadcasting (backend/socket.js)   │
│   ├── Static File Server: /uploads (Physical images on disk)           │
│   ├── Multer Engine: diskStorage (/backend/uploads)                    │
│   └── Routes:                                                          │
│       ├── /api/auth      (Login, Register, Session Restore)            │
│       ├── /api/issues    (CRUD, Verify, Assign, Progress, Resolve,    │
│       │                   Confirm, Merge, Duplicates, CSV Export)      │
│       └── /api/analytics (Overview KPIs, Heatmap, Recurring, Showcase) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Synchronous Read/Write Queries
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE LAYER                          │
│   Store Singleton: backend/data/store.js                               │
│   Database File:   backend/data/db.json (JSON Document Store)          │
│   Asset Storage:   backend/uploads/ (Local File System)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `^18.3.1` | Component-based UI architecture |
| **Build Tool** | Vite | `^5.2.11` | Rapid development server & optimized production bundler |
| **Routing** | React Router DOM | `^6.23.1` | Client-side routing with role-gated `ProtectedRoute` |
| **Styling** | Tailwind CSS + PostCSS | `^3.4.17` | Utility-first responsive design tokens |
| **Icons** | Lucide React + Material Symbols | `^0.395.0` | UI iconography and status symbols |
| **Real-Time Transport** | Socket.IO Client | `^4.8.1` | Real-time WebSocket bidirectional event streaming |
| **Backend Runtime** | Node.js + Express | `^4.19.2` | RESTful API server and route handling |
| **Real-Time Server** | Socket.IO | `^4.8.1` | WebSocket event broadcaster and room manager |
| **File Uploads** | Multer | `^1.4.5-lts.1` | Multipart form-data disk storage handling |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | `^9.0.2` / `^2.4.3` | Salted password hashing and stateless JWT bearer authentication |
| **Data Persistence** | Atomic File Store | Native Node.js `fs` | Persistent JSON document store (`backend/data/db.json`) |

---

## API Overview

| Method | Endpoint | Purpose | Access Control | Request Payload |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public | `{ email, password }` |
| `POST` | `/api/auth/register` | Register new student account | Public | `{ name, email, password, role, rollNumber, department }` |
| `GET` | `/api/auth/me` | Fetch active user session | Bearer JWT | None |
| `GET` | `/api/issues` | List issues with multi-attribute filters | Public | Query: `status, category, priority, department, location, search, studentId` |
| `GET` | `/api/issues/:id` | Fetch single issue details & timeline | Public | Param: `id` (e.g. `CT-1021`) |
| `GET` | `/api/issues/:id/duplicates`| Query duplicate candidate tickets | Public | Param: `id` |
| `POST` | `/api/issues` | Submit new incident report | `STUDENT` | `multipart/form-data`: `category, location, specificLocation, description, severity, safetyImpact, peopleAffected, photo` |
| `PATCH`| `/api/issues/:id/verify` | Verify issue & calculate priority | `ADMIN` | `{ severity, safetyImpact, peopleAffected, priority, comment }` |
| `PATCH`| `/api/issues/:id/assign` | Dispatch issue to department | `ADMIN` | `{ department, assignedTo, comment }` |
| `PATCH`| `/api/issues/:id/status` | Update status directly | `ADMIN`, `DEPARTMENT` | `{ status, comment }` |
| `POST` | `/api/issues/:id/progress` | Add interim technician progress log | `DEPARTMENT`, `ADMIN` | `{ text }` |
| `POST` | `/api/issues/:id/resolve` | Sign-off & upload resolution proof | `DEPARTMENT`, `ADMIN` | `multipart/form-data`: `notes, timeToResolveHours, resolutionPhoto` |
| `POST` | `/api/issues/:id/confirm` | Student confirms closure or reopens | `STUDENT` *(Reporter)*, `ADMIN` | `{ action: 'confirm' \| 'reject', comment }` |
| `POST` | `/api/issues/merge` | Merge duplicate reports into master | `ADMIN` | `{ primaryId, duplicateIds, reason }` |
| `GET` | `/api/issues/export/csv` | Download RFC 4180 CSV audit file | Public | None |
| `GET` | `/api/analytics/overview` | Fetch campus KPI counts & metrics | Public | None |
| `GET` | `/api/analytics/heatmap` | Location-based issue density | Public | None |
| `GET` | `/api/analytics/recurring` | Recurring breakdown clusters | Public | None |
| `GET` | `/api/analytics/showcase` | Verified resolution showcase items | Public | None |
| `GET` | `/api/health` | Health check & uptime monitor | Public | None |

---

## Issue Lifecycle State Machine

```
[1. Reported] ──► [2. Verified] ──► [3. Assigned] ──► [4. In Progress] ──► [5. Resolved] ──► [6. Closed]
      │
      └─► [Merged / Closed] (Consolidated into Master Ticket)
```

1. **Reported:** Incident logged by student with photo evidence and initial impact assessment.
2. **Verified:** Estate Office admin validates physical report and establishes priority score.
3. **Assigned:** Dispatched to specialized maintenance department (Electrical, Plumbing, Civil, Sanitation).
4. **In Progress:** Technician claims work order on-site and records interim diagnostic logs.
5. **Resolved:** Technician completes physical repair and uploads post-repair photograph with completion notes.
6. **Closed:** Reporting student inspects fix and confirms satisfaction, officially closing the ticket.

---

## Priority & SLA Engine

Priority is calculated deterministically based on three weighted impact variables:

$$\text{Priority Score} = \text{Severity} + \text{Safety Hazard} + \text{Affected Population}$$

### Factor Scoring Weights:
- **Severity Level:** `High` (+3) · `Medium` (+2) · `Low` (+1)
- **Safety Hazard Impact:** `Hazardous` (+3) · `Moderate` (+1.5) · `None` (+0)
- **Affected Population:** `Entire Block / Widespread` (+3) · `Floor` (+2) · `Classroom / Lab` (+1.5) · `Single Room` (+1)

### SLA Matrix:
| Total Score | Priority Tier | Target SLA Window | Escalation Threshold |
|---|---|---|---|
| $\ge 7.0$ | **Urgent** | **4 Hours** | Immediate SMS & Supervisor Dispatch |
| $\ge 5.0$ | **High** | **12 Hours** | Duty Engineer Review within 1 hour |
| $\ge 3.5$ | **Medium** | **24 Hours** | Standard Roster Dispatch |
| $< 3.5$ | **Low** | **48 Hours** | Scheduled Routine Maintenance |

---

## Duplicate Complaint Management

When multiple students report identical incidents in the same facility, the Estate Admin can consolidate them:
1. **Candidate Detection:** Backend queries open tickets matching the target building and category within temporal proximity.
2. **Atomic Merge (`POST /api/issues/merge`):**
   - Secondary tickets transition to status `Closed` with `mergedInto = <PrimaryID>`.
   - Primary master ticket aggregates secondary IDs in `mergedReportIds: [...]`.
   - Timeline records merge rationale and elevates priority due to multi-user impact.

---

## Project Structure

```
VIT/
├── .gitignore
├── README.md
│
├── backend/
│   ├── data/
│   │   ├── db.json             # Persistent JSON document store
│   │   ├── seed.js             # Realistic campus seed data
│   │   └── store.js            # Atomic store singleton & CRUD operations
│   ├── routes/
│   │   ├── analytics.js        # Overview, heatmap, recurring clusters, showcase
│   │   ├── auth.js             # JWT authentication & requireRole middleware
│   │   └── issues.js           # Issue CRUD, triage, progress, resolve, confirm
│   ├── uploads/                # Uploaded physical photo files on disk
│   ├── package.json
│   ├── server.js               # Express app + HTTP server setup
│   └── socket.js               # Socket.IO WebSocket manager & room emitter
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Route definitions & protected route guards
        ├── index.css           # Design tokens, typography & component utilities
        ├── main.jsx            # React root entry point
        │
        ├── api/                # API client layer
        │   ├── analytics.js
        │   ├── auth.js
        │   ├── client.js       # Fetch wrapper with JWT header interceptor
        │   └── issues.js
        │
        ├── context/            # Global state & providers
        │   ├── AuthContext.jsx # User session & persona switchers
        │   ├── SocketContext.jsx # Socket.IO connection & notifications
        │   └── ToastContext.jsx  # Notification toasts
        │
        ├── components/
        │   ├── admin/          # CampusHeatmap, PriorityCalculator, DuplicateMergerModal
        │   ├── common/         # Button, Input, Modal, StatusBadge, PriorityBadge, LoadingState
        │   ├── issues/         # FilterBar, ImageUploader, IssueCard, IssueTable, Timeline
        │   ├── layout/         # Navbar, Sidebar, PageContainer, ProtectedRoute
        │   └── showcase/       # ResolvedShowcase carousel & modal
        │
        └── pages/
            ├── admin/          # AdminDashboard, AdminIssuesPage
            ├── auth/           # LoginPage
            ├── department/     # DepartmentDashboard
            └── student/        # StudentDashboard, ReportIssuePage, IssueDetailPage
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Git**

---

### 1. Clone the Repository
```bash
git clone https://github.com/KRISHNAKARTHICK-K/VIT-hack.git
cd VIT-hack
```

---

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Backend server and Socket.IO engine will start on `http://localhost:5000`.*  
*Health Check:* `http://localhost:5000/api/health`

---

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend will start on `http://localhost:5173`.*

---

## Demo Credentials & Persona Switchers

CampusTrack comes pre-configured with realistic campus test accounts. You can sign in using credentials or click the **Quick-Fill Demo Account** buttons on `/login`:

| Persona / Role | Email | Password | Role Details |
|---|---|---|---|
| **Student** | `student@vit.ac.in` | `student123` | Aarav Sharma (Roll: 21BCE1042) |
| **Estate Admin** | `admin@vit.ac.in` | `admin123` | Dr. K. Ramanathan (Chief Estate Officer) |
| **Electrical Lead** | `electrical@vit.ac.in` | `dept123` | M. Venkatesh (Electrical Maintenance) |
| **Plumbing Lead** | `plumbing@vit.ac.in` | `dept123` | S. Rajesh Kumar (Plumbing & Water Supply) |
| **Civil Lead** | `civil@vit.ac.in` | `dept123` | R. Murali (Civil & Infrastructure) |
| **Sanitation Lead** | `housekeeping@vit.ac.in` | `dept123` | Anand Swaminathan (Housekeeping) |

---

## Production Build Verification

To verify that the application compiles without errors:
```bash
cd frontend
npm run build
```
Expected output:
```
✓ 1569 modules transformed.
dist/index.html                   1.34 kB │ gzip:   0.69 kB
dist/assets/index-Cb0OogGG.css   38.12 kB │ gzip:   7.74 kB
dist/assets/index-BfRZIEUM.js   353.91 kB │ gzip: 101.01 kB
✓ built in ~4s
```

---

## License

This project is developed for institutional evaluation and hackathon demonstration under the **MIT License**.
