# ArtsFlow OS — Disaster Recovery Runbook

This document contains step-by-step technical procedures for responding to system outages, data corruption, failed deployments, and security incidents in **ArtsFlow OS**.

---

## 1. Application Outage (Frontend Unreachable)

### Symptoms
- Users receive HTTP 500/502/503 errors or blank white screen when accessing the application URL.

### Triage & Recovery Steps
1. **Check Firebase Hosting Status**:
   Visit [Google Cloud Status](https://status.cloud.google.com/) or Firebase Console.
2. **Inspect Client Console Errors**:
   Open browser developer tools (F12) → Console. Look for unhandled script exceptions or chunk loading errors.
3. **Roll Back to Previous Known Good Release**:
   ```bash
   # Clone previous hosting release back to live
   npx firebase hosting:clone <PREVIOUS_RELEASE_ID> live
   ```
4. **Invalidate Client Caches**:
   Trigger a hard cache refresh (Ctrl+F5 / Cmd+Shift+R).

---

## 2. Firestore Database Issue or Quota Exceeded

### Symptoms
- Client console displays `RESOURCE_EXHAUSTED` or `UNAVAILABLE`.
- Read and write operations fail across multiple screens.

### Recovery Steps
1. Check Cloud Firestore console for daily quota usage or billing limits.
2. Review real-time listener count; if runaway listeners are detected, restart client sessions.
3. If indexing errors occur (`failed-precondition: The query requires an index`), click the generated console link to deploy the composite index, or deploy `firestore.indexes.json`:
   ```bash
   npx firebase deploy --only firestore:indexes
   ```

---

## 3. Failed Schema Migration

### Symptoms
- Post-migration script logs error; UI displays undefined errors on newly migrated fields.

### Recovery Steps
1. All ArtsFlow migrations support **dryRun** mode. Ensure `dryRun: true` was executed prior to apply.
2. If an applied migration fails midway:
   - Identify the failed migration version in `scripts/migrations/runner.ts`.
   - The runner automatically halts on first failure, preventing downstream cascading corruption.
   - Run data quality audit in **Settings → System Preferences** to inspect affected entity IDs.
   - Apply correcting patch migration with an incremented version number (`002_fix_...`).
   - Do NOT manually drop or wipe collections in production.

---

## 4. Restoring From Backup (Disaster Recovery)

### Prerequisites
- Google Cloud SDK (`gcloud`) installed with Project Owner permissions.
- Identified target backup snapshot URI in Google Cloud Storage (e.g. `gs://[PROJECT_ID]-backups/2026-09-01T02:00:00/`).

### Restore Execution Steps
```bash
# 1. Verify target project ID
gcloud config set project [YOUR_FIREBASE_PROJECT_ID]

# 2. List available backup snapshots in GCS
gsutil ls gs://[YOUR_BACKUP_BUCKET]/

# 3. Import collections from selected snapshot
gcloud firestore import gs://[YOUR_BACKUP_BUCKET]/[SNAPSHOT_TIMESTAMP]/
```

### Post-Restore Verification
1. Run **Data Quality Scan** in **Settings → System Preferences** (`/settings/system`).
2. Run **Finance Reconciliation** (`financeReconciliationService.reconcileOrganisation(orgId)`) to verify invoice and payment balances.
3. Verify tenant isolation rules with `npm test`.

---

## 5. External Provider Outage (Email / SMS / WhatsApp / Gateway)

### Behavior
- ArtsFlow OS is architected to **fail gracefully**:
  - Email failure falls back to in-app notification records.
  - SMS/WhatsApp failure marks messages as `'prepared'` rather than crashing or claiming delivery.
  - Payment gateway downtime allows staff to continue recording manual Cash/EFT remittances.
- **Action**: No application downtime required. Monitor provider status dashboards and retry queued communications once external services recover.

---

## 6. Credential Compromise & Security Incidents

If a staff password or API key is suspected to be compromised:

1. **Revoke User Session**:
   - In Firebase Console → Authentication → Users, select the user and click **Disable Account**.
   - In ArtsFlow OS **Settings → Users & Roles**, set user status to `'disabled'`.
2. **Rotate Environment API Keys**:
   - In Google Cloud Console → APIs & Services → Credentials, rotate compromised API keys.
   - Update `.env.local` and redeploy hosting:
     ```bash
     npm run build && npx firebase deploy --only hosting
     ```
3. **Audit Activity**:
   - Inspect the immutable `auditLogs` collection for recent actions taken by the compromised user ID.
