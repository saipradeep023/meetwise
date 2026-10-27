# MeetWise

A privacy-focused, multi-floor corporate meeting room booking and facility management platform built for modern workspaces operating in the `Asia/Kolkata` timezone.

---

## Problem Statement

In corporate and shared workspace environments, managing meeting rooms across multiple floors often leads to friction:

1. **Scheduling Conflicts and Race Conditions**: Simultaneous booking requests often result in double-booked spaces when applications lack atomic database-level locks.
2. **Privacy Breaches in Room Schedules**: Traditional booking calendars reveal private meeting titles, descriptions, and participant identities to everyone browsing for a room.
3. **Uncoordinated Maintenance and Operating Hours**: Facilities teams lack centralized controls to set weekly opening windows per room or schedule maintenance downtime, leading to meetings booked during renovations or outside operational hours.
4. **Unauthorized Sign-ups and Access Control**: Without domain restrictions and allowlist exceptions, non-organizational email addresses can register and occupy valuable resources.
5. **Lack of Accountability and Auditability**: Changes, cancellations, and administrative deactivations are often unlogged, leaving no paper trail for dispute resolution.

---

## Target Users

- **Employees & Team Members**: Need a fast, intuitive way to discover available rooms, check room amenities, book slots without friction, and manage their reservations.
- **Office Managers & Facilities Teams**: Require centralized control over building floors, conference rooms, operating hours, and scheduled maintenance windows.
- **Workspace Administrators**: Oversee company access permissions, enforce allowed email domains and exception lists, monitor employee accounts, track workspace readiness, and audit activity.

---

## Solution

**MeetWise** resolves these workplace challenges through a robust full-stack architecture combining a responsive React 19 frontend with a hardened PostgreSQL backend:

- **Atomic Slot Booking**: All reservations are validated and executed via transactional PostgreSQL stored procedures (`SECURITY DEFINER` RPCs) utilizing `EXCLUDE USING gist` range constraints to mathematically prevent double bookings under concurrent traffic.
- **Privacy-Preserving Room Discovery**: Availability queries return strictly boolean room availability states to employees without exposing meeting subjects, organizer names, or maintenance notes belonging to other teams.
- **Comprehensive Space & Schedule Governance**: Administrators configure building floors, rooms, operating windows (defaulting to 09:00–18:00 every day), and recurring or one-off maintenance periods with automatic conflict rejection.
- **Domain-Enforced Registration**: A PostgreSQL authentication hook validates incoming user registrations against an approved corporate email domain and an exact allowlist before accounts are created.
- **Immutable Audit Logging**: Every critical action—booking creations, user and administrative cancellations, space status updates, and account deactivations—is logged to an append-only audit ledger with structured metadata.

---

## Key Features

### 1. Room Availability & Interactive Booking
- **Date & Floor Filtering**: Filter available conference rooms across the building by floor and selected date.
- **Two-Week Schedule Horizon**: Plan and reserve rooms up to 14 days in advance.
- **Slot Validation Rules**: Meetings are strictly aligned to 15-minute intervals, with a minimum duration of 15 minutes and a maximum duration of 3 hours.
- **Interactive Booking Dialog**: Clean modal for specifying meeting title, optional agenda/description, and exact start/end times with immediate inline validation against building hours and maintenance windows.

### 2. My Bookings Management
- **Personal Reservation Dashboard**: Real-time view of all upcoming and past reservations categorized as *Scheduled*, *In Progress*, or *Completed*.
- **Self-Service Cancellation**: Employees can cancel their own future bookings with immediate release of the room back into the available pool.

### 3. Space & Floor Administration
- **Building Floor Management**: Add floors with level numbers, automatically ordered by level ascending.
- **Room Provisioning**: Create conference rooms associated with floors, specifying capacity and equipment tags (e.g., Projector, Whiteboard, Video Conference).
- **Safe Space Deactivation**: Deactivating a floor or room triggers validation checks and confirmation modals to ensure no future confirmed bookings are left orphaned.

### 4. Operating Hours & Maintenance Windows
- **Weekly Operating Windows**: Configure custom opening and closing times per room for each day of the week (pre-seeded with standard 09:00–18:00 hours).
- **Maintenance Scheduling**: Schedule maintenance periods with optional reasons; prevents regular employees from booking affected slots.
- **Maintenance Status Filtering**: Filter room maintenance records by *All*, *Scheduled*, or *Completed* with confirmation prompts prior to deletion.

### 5. Access Control & Registration Settings
- **Approved Company Domain**: Restrict employee self-registration to verified company domains (e.g., `company.com`).
- **Email Allowlist Exceptions**: Permit select external collaborators or contractor emails that do not match the company domain.
- **Server-Side Enforcement**: Enforced via PostgreSQL trigger hooks before user records are committed to auth tables.

### 6. Team Member Management
- **Role Hierarchy**: Strict separation between `admin` and `employee` accounts; administrative accounts cannot be created directly via the public interface.
- **Member Directory**: Filterable member list with real-time name and email search.
- **Controlled Account Deactivation**: Deactivating an employee account requires an explicit reason and verifies that the employee has no active future bookings.

### 7. Audit History & Workspace Analytics
- **Append-Only Audit Ledger**: Detailed audit records capturing action types, user emails, room identifiers, timestamps, and administrative cancellation reasons.
- **Multi-Parameter Audit Filtering**: Filter audit entries by floor, room, date, and user search keywords.
- **Workspace Utilization Analytics**: Track overall booking volume, cancellation percentages, total booked hours, and room utilization rankings over configurable date intervals.
- **Workspace Health Checks**: Automated status dashboard verifying administrator presence, registration domain enforcement, and room schedule coverage.

### 8. User Experience & Design System
- **Dark Mode Support**: Persistent dark/light theme toggle with system preference detection and zero-flicker HTML script initialization.
- **Fixed Navigation**: Fixed top header and independent sidebar navigation to maintain contextual orientation while scrolling data tables.
- **In-App Toast System**: Contextual success, error, and informational alerts with auto-dismissal.
- **Defensive Error Boundaries**: Graceful error handling across UI routes to prevent application crashes from network or API anomalies.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 | Declarative user interface components and hooks |
| **Build Tool** | Vite 7 | Fast development server and optimized production bundling |
| **Routing** | React Router 7 | Client-side routing, protected routes, and role-based guards |
| **Styling** | Tailwind CSS 3 | Utility-first responsive design, modern typography, and dark mode |
| **Backend & Auth** | Supabase | Managed PostgreSQL, authentication service, and row-level security |
| **Database** | PostgreSQL 15 | Relational data model, PL/pgSQL stored procedures, and triggers |
| **Testing** | Vitest & React Testing Library | Unit tests, timezone conversion tests, and component integration tests |
| **Code Quality** | ESLint 9 | Static code analysis and standard compliance |

---

## Architecture

MeetWise follows a layered client-server architecture designed for high consistency, privacy, and performance:

```text
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│   React 19 + React Router 7 + Tailwind CSS (Vite)     │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
      Supabase Auth                     HTTPS / RPC
            │                                │
┌───────────▼────────────────────────────────▼───────────┐
│                    API & Gateway Layer                 │
│               Supabase Managed PostgREST               │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            │ RLS Policies                   │ Stored Procedures
┌───────────▼────────────────────────────────▼───────────┐
│                   Database Layer (PostgreSQL)          │
│                                                        │
│  • Tables: floors, rooms, bookings, company_settings   │
│  • Constraints: EXCLUDE USING gist (Slot Overlaps)     │
│  • Security: Row Level Security (RLS) on all tables    │
│  • Functions: available_rooms_for_slot (RPC)           │
│  • Triggers: before_user_created_hook (Auth Guard)     │
│  • Audit: append-only audit_logs ledger                │
└────────────────────────────────────────────────────────┘
```

### Core Workflows

#### 1. Privacy-Safe Availability & Booking
```text
User selects Date & Floor
       ↓
Browser calls RPC `available_rooms_for_date`
       ↓
Database computes slot overlaps internally
       ↓
Returns ONLY boolean flags (free/busy) & room metadata
       ↓
User selects slot & submits Booking
       ↓
Atomic database transaction checks operating hours & maintenance
       ↓
GIST exclusion constraint prevents double-booking race condition
       ↓
Booking confirmed + Audit log entry created
```

#### 2. Domain-Restricted Registration
```text
User submits Registration Form
       ↓
Supabase Auth receives sign-up request
       ↓
Database trigger executes `before_user_created_hook`
       ↓
Validates email domain against `company_settings.approved_email_domain`
       OR checks presence in `signup_email_allowlist`
       ↓
[Pass] -> Creates auth.users row and initial 'employee' profile
[Fail] -> Rejects registration with authorization error
```

---

## Local Setup

### Prerequisites
- **Node.js**: Version 20 LTS or higher
- **Package Manager**: `npm` (or `npm.cmd` on Windows)
- **Supabase Account**: A Supabase cloud project or local Supabase instance

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd meetwise
   ```

2. **Install Dependencies**:
   ```powershell
   npm install
   ```
   *(On Windows PowerShell, use `npm.cmd install`)*

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```powershell
   cp .env.example .env.local
   ```
   Open `.env.local` and provide your Supabase project credentials:
   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

4. **Run the Development Server**:
   ```powershell
   npm run dev
   ```
   *(On Windows PowerShell: `npm.cmd run dev`)*

   The application will be accessible at `http://localhost:5173`.

5. **Run the Test Suite**:
   ```powershell
   npm test -- --run
   ```

6. **Run Linting & Production Build**:
   ```powershell
   npm run lint
   npm run build
   ```

---

## Environment Variables

The application requires two frontend environment variables. Place them in `.env.local` for local development:

| Variable | Description | Exposed to Browser |
|---|---|---|
| `VITE_SUPABASE_URL` | The HTTPS endpoint URL of your Supabase project | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The public anon API key for Supabase client requests | Yes |

> **Security Note**: Never expose the Supabase `service_role` secret key in frontend environment variables. All elevated privileges are handled strictly through server-side PostgreSQL functions and Row-Level Security policies.

---

**Project Explanation**

_VIDEO LINK_ : https://drive.google.com/file/d/1k4NzIhFlow-QEOl7S8yYVHa3vAfaTDbb/view?usp=sharing
