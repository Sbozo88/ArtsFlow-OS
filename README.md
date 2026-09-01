# ArtsFlow OS

## Purpose
ArtsFlow OS is a comprehensive management system specifically designed for Arts Projects, Music Schools, Dance Schools, and Community Arts Programmes. It provides a robust, scalable architecture for managing learners, guardians, staff, and arts programmes with strict organisation-level data isolation.

## Phase 1A Scope
Phase 1A establishes the reliable core foundation for ArtsFlow OS.
It implements the following workflows:
- First-user Organisation Onboarding
- Role-based Authentication
- Learner & Guardian Management with relationship linking
- Staff Directory
- Programme & Group/Class setup
- Real-time Firestore synchronisation
- Comprehensive Audit Logging

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router
- **Backend & Database**: Firebase Authentication, Cloud Firestore
- **Styling**: Tailwind CSS, Lucide React Icons
- **Infrastructure**: Firebase Hosting & Storage

## Setup

### 1. Repository
```bash
gh repo clone Sbozo88/ArtsFlow-OS
cd ArtsFlow-OS
npm install
```

### 2. Environment Variables
Create a `.env.local` file based on `.env.example`:
```
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### 3. Development Commands
- Start dev server: `npm run dev`
- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Production build: `npm run build`

## Architecture
ArtsFlow uses a strictly layered architecture to separate concerns and enforce business rules:
`Type → Repository → Service → Hook → UI → Rules → Index → Audit`
No direct Firestore calls are made in the UI layer. All mutations pass through services to ensure Audit Logs are written and Organisation rules are enforced.

## Collections
- `organisations`: Tenant profiles.
- `users`: Auth profiles bridging Firebase Auth and the tenant.
- `staff`: Operational staff profiles and roles.
- `learners`: Student profiles.
- `guardians`: Parent/guardian profiles.
- `learnerGuardians`: Link records between learners and guardians.
- `programmes`: High-level arts programmes (Music, Dance, etc).
- `programmeGroups`: Specific classes, ensembles, or groups.
- `auditLogs`: Immutable ledger of mutations.

## Security Overview
- **Deny-by-default**: All collections require explicit rules.
- **Strict Isolation**: A user can only access records where `organisationId` matches their `users` document.
- **Audit Immutability**: `auditLogs` can only be created, never updated or deleted by normal users.
- **Ownership Verification**: `createdBy` is strictly enforced on creation.

## Current Status
- Phase 1A Core Foundation: **Complete**
- Fully deployed on Firebase Hosting.

## Next Phase
- Phase 1B: Enrolments, Sessions, Attendance, Follow-Ups.
