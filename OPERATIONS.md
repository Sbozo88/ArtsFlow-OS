# ArtsFlow OS — Operational Runbook

This runbook provides administrative and site reliability procedures for maintaining, monitoring, deploying, and operating **ArtsFlow OS**.

---

## 1. Production Deployment Workflow

### Pre-Deployment Checklist
1. All changes merged to `main` via pull request.
2. Codebase passes quality gate:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

### Deploy Commands
```bash
# 1. Deploy Firestore Security Rules & Indexes
npx firebase deploy --only firestore:rules,firestore:indexes

# 2. Deploy Cloud Storage Security Rules
npx firebase deploy --only storage

# 3. Build and Deploy Web Application to Firebase Hosting
npm run build && npx firebase deploy --only hosting
```

---

## 2. Rollback Procedure

If a critical failure or regression occurs after deployment:

1. **Instant Hosting Rollback**:
   Open Firebase Console → Hosting → Release History, locate the previous stable release, and click **Rollback**.
   Or via CLI:
   ```bash
   npx firebase hosting:clone <PREVIOUS_RELEASE_ID> live
   ```
2. **Reverting Rules**:
   ```bash
   git checkout <PREVIOUS_STABLE_TAG> firestore.rules storage.rules
   npx firebase deploy --only firestore:rules,storage
   ```

---

## 3. System Health & Diagnostics

### Monitoring Dashboard
Navigate to **Settings → System Preferences** (`/settings/system`):
- **Version & Build**: Confirm active version is `1.0.0-rc.1`.
- **Integration Status**: Review status badges (Connected, Sandbox, Disabled).
- **Automated Snapshots**: Check backup freshness (daily snapshot target).

### Running a Data Quality Scan
1. In **Settings → System Preferences**, click **Scan Data Quality**.
2. Review the resulting **Integrity Score** and issues list:
   - **Broken Relations**: Groups pointing to deleted programmes, sessions pointing to deleted groups.
   - **Orphaned Attendance**: Attendance registers without matching sessions or learners.
   - **Financial Discrepancies**: Invoices whose balance does not match `total - allocations`.
3. Resolve flagged records via the standard admin UI. Do not delete raw records directly.

---

## 4. Organisation Data Export & Import

### Safe Data Export
1. Navigate to **Settings → System Preferences**.
2. Click **Export Data (JSON)**.
3. The platform generates an encrypted/sanitized export containing all learners, guardians, staff, groups, and invoices.
4. All secrets, auth tokens, and API credentials are automatically stripped before download.

### Learner CSV Import
1. Ensure CSV contains required headers: `firstName`, `lastName`.
2. Recommended columns: `email`, `phone`, `dateOfBirth` (YYYY-MM-DD), `guardianName`, `guardianEmail`, `guardianPhone`.
3. Validation enforces valid email formatting and date schemas before creation.

---

## 5. Integration Diagnostics & Troubleshooting

| Provider / Channel | Operational State | Diagnostic Step |
| :--- | :--- | :--- |
| **Email** | Sandbox / Client Simulated | Inspect browser console or logs for simulated dispatch IDs. |
| **SMS** | Prepared Link | Verify recipient phone format (must include country code). |
| **WhatsApp** | Direct `wa.me` Protocol | Check URL parameters and phone sanitization. |
| **Payment Gateway** | Paystack / Card Webhooks | Verify webhook endpoint in provider dashboard; verify HMAC signature. |
| **Calendar Feeds** | iCal / RFC 5545 | Verify timezone is set to `Africa/Johannesburg` in Organisation Settings. |
| **Accounting** | CSV Export | Use Finance Reports (`/finance/reports`) to download general ledger. |

---

## 6. Backup Review & Retention Policy

- **Snapshot Engine**: Managed Google Cloud Firestore export service.
- **Schedule**: Nightly at 02:00 SAST.
- **Destination**: Dedicated, access-restricted Google Cloud Storage bucket (`Coldline` tier).
- **Retention**: 90 days rolling retention.
- For complete restoration instructions, refer to [RECOVERY.md](./RECOVERY.md).
