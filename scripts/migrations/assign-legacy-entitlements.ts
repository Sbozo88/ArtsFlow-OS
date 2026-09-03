/**
 * Assign Legacy Entitlements Migration
 * 
 * Inspects all organisations in the database.
 * If an organisation has no `assignedPlanId`, it assigns `plan_legacy_full`,
 * guaranteeing that existing v1.0 organisations retain full access to Music,
 * Dance, Events, Finance, Automation, Documents, Portals, etc.
 * 
 * Emits an audit log entry for each migrated tenant.
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { auditService } from '../../src/services/auditService';
import type { Organisation } from '../../src/types';

export async function migrateLegacyEntitlements(actorId = 'migration_saas_2a') {
  console.log('[Migration] Checking organisations for plan assignment...');
  const orgsRef = collection(db, 'organisations');
  const snap = await getDocs(orgsRef);
  const now = new Date().toISOString();

  let migratedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snap.docs) {
    const org = docSnap.data() as Organisation;
    const orgId = docSnap.id;

    if (!org.assignedPlanId) {
      console.log(`[Migration] Assigning 'plan_legacy_full' to organisation: ${org.name} (${orgId})`);
      await updateDoc(doc(db, 'organisations', orgId), {
        assignedPlanId: 'plan_legacy_full',
        updatedAt: now,
        updatedBy: actorId
      });

      await auditService.log(
        orgId,
        actorId,
        'PLATFORM_ASSIGN_PLAN',
        'organisation',
        orgId,
        { assignedPlanId: null },
        { assignedPlanId: 'plan_legacy_full', reason: 'Legacy v1.0 migration default plan' }
      );

      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`[Migration] Complete: ${migratedCount} organisations assigned legacy plan, ${skippedCount} already had plans.`);
  return { migratedCount, skippedCount };
}

// Run standalone if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('assign-legacy-entitlements.ts')) {
  migrateLegacyEntitlements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}
