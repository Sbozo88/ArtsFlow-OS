# ArtsFlow OS — Portal User & Access Guide

This guide covers the **Guardian Portal** and **Learner Portal** self-service interfaces in **ArtsFlow OS**.

---

## 1. Overview & Security Isolation

ArtsFlow OS provides two dedicated, relationship-isolated external portals:

1. **Guardian Portal** (`/portal`): Designed for parents, guardians, and fee-payers to oversee their children's arts education.
2. **Learner Portal** (`/portal/learner`): Designed for enrolled students to view rehearsal timetables, log home practice, review repertoire, and view published assessments.

### Security Guarantees
- **Strict Privacy**: A guardian can strictly see only learners linked to their profile in `learnerGuardians`. They cannot view other families, financial details of peers, or internal staff notes.
- **Learner Protection**: Students cannot see guardian billing information, debt reminders, or private staff correspondence.

---

## 2. Guardian Portal Workflows

### Invitation & First-Time Login
1. Staff issue an invitation from the student's profile.
2. The guardian receives an invitation link (`/portal/invite/:token`).
3. The guardian sets a secure password and verifies their mobile phone number.
4. Subsequent logins occur at `/portal/login`.

### Dashboard & Navigation
- **Students Overview** (`/portal/learners`): Switch between multiple enrolled children in the same family.
- **Attendance Records** (`/portal/attendance`): View attendance records, percentage compliance, and absence reasons.
- **Concert & Event Consent** (`/portal/consent`): Review upcoming excursions and digitally sign legal consent forms directly on mobile or desktop.
- **Transport Tracking** (`/portal/transport`): View scheduled bus departures, assigned vehicles, and passenger manifests.
- **Invoices & Online Payments** (`/portal/finance`): Inspect invoices, review itemized tuition charges, download official receipts, and settle fees online.
- **Documents & Messages** (`/portal/documents`, `/portal/messages`): Access academic certificates, rehearsal schedules, and academy announcements.

---

## 3. Learner Portal Workflows

### Accessing the Portal
- Students access `/portal/login` with their student login credentials.
- Mobile-optimized bottom navigation allows fast access on smartphones.

### Key Student Features
- **My Schedule**: Today's and this week's rehearsals, masterclasses, and concert call times.
- **Practice Logging**: Log home practice minutes, musical pieces studied, and technical exercises completed.
- **Repertoire & Choreography**: Download sheet music scores, listen to reference audio, and review dance choreography notes.
- **Assessments & Progress**: View published teacher assessments, skill rubrics, and feedback milestones.

---

## 4. Portal Troubleshooting

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **"Invalid or Expired Invitation Token"** | Link has expired (valid 7 days) or was already accepted. | Request an administrator re-send the invitation from the Learner Profile page. |
| **"No Linked Learners Found"** | Guardian account is not mapped in `learnerGuardians`. | Administrator must verify that the guardian's email matches the linked guardian record. |
| **"Portal Access Disabled"** | Academy administrator has toggled off portal access for the organisation. | Administrator must enable "Guardian Portal Enabled" in **Settings → Portal Settings**. |
| **"Unable to Submit Consent"** | Consent deadline has passed or legal guardian flag not checked. | Verify that the submission occurs before the event deadline and all mandatory checkboxes are confirmed. |
