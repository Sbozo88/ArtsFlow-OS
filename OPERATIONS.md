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
   npm run test:rules
   npm run build
   ```

### Deploy Commands
```bash
# Validates, then deploys Hosting and Firestore rules/indexes to the explicit
# artflow-os Firebase project. Storage is excluded until the Firebase Storage
# product is provisioned for this project.
npm run release:firebase
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
- **Backups**: The application reports backup state as pending until a managed policy is configured and independently verified.

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
3. The browser generates a JSON export containing selected learners, guardians, staff, groups, invoices, and payments. The download is not encrypted by the application.
4. All secrets, auth tokens, and API credentials are automatically stripped before download.

### Learner CSV Import
1. Ensure CSV contains required headers: `firstName`, `lastName`.
2. Recommended columns: `email`, `phone`, `dateOfBirth` (YYYY-MM-DD), `guardianName`, `guardianEmail`, `guardianPhone`.
3. Validation enforces valid email formatting and date schemas before creation.

---

## 5. Integration Diagnostics & Troubleshooting

| Provider / Channel | Operational State | Diagnostic Step |
| :--- | :--- | :--- |
| **Email** | Not configured | Configure a trusted server-side provider before claiming delivery. |
| **SMS** | Not configured | Configure a trusted server-side carrier gateway before claiming delivery. |
| **WhatsApp** | Direct `wa.me` Protocol | Check URL parameters and phone sanitization. |
| **Payment Gateway** | Not configured | Manual cash/EFT ledger operations remain available. |
| **Calendar Feeds** | iCal / RFC 5545 | Verify timezone is set to `Africa/Johannesburg` in Organisation Settings. |
| **Accounting** | CSV Export | Use Finance Reports (`/finance/reports`) to download general ledger. |

---

## 6. Backup Readiness Gate

No verified managed backup policy is recorded in this repository. Before production approval, configure a Firestore backup/export policy in Google Cloud, record its destination and retention outside client code, perform a test restore in a non-production project, and attach evidence to the release. See [RECOVERY.md](./RECOVERY.md) for the restore procedure.
