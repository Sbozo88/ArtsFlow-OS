/**
 * Seed Subscription Plans and Plan Entitlements
 * 
 * Populates the global subscriptionPlans and planEntitlements collections with standard plans:
 * - legacy_full
 * - starter
 * - professional
 * - premium
 * - enterprise
 * 
 * Safe to run multiple times (idempotent).
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { STANDARD_PLANS, buildPlanEntitlementRecords } from '../../src/config/subscriptionPlansRegistry';

export async function seedSubscriptionPlans(actorId = 'system_seeder') {
  console.log(`[Seed] Seeding ${STANDARD_PLANS.length} subscription plans...`);
  const now = new Date().toISOString();
  let createdPlans = 0;
  let skippedPlans = 0;
  let totalEntitlements = 0;

  for (const planDef of STANDARD_PLANS) {
    const planRef = doc(db, 'subscriptionPlans', planDef.id);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      await setDoc(planRef, {
        id: planDef.id,
        name: planDef.name,
        code: planDef.code,
        description: planDef.description,
        planStatus: planDef.planStatus,
        isPublic: planDef.isPublic,
        recommended: planDef.recommended,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      });
      createdPlans++;
    } else {
      skippedPlans++;
    }

    // Seed entitlements for plan
    const entRecords = buildPlanEntitlementRecords(planDef.id, planDef.code, actorId);
    for (const ent of entRecords) {
      const entRef = doc(db, 'planEntitlements', ent.id);
      const entSnap = await getDoc(entRef);
      if (!entSnap.exists()) {
        await setDoc(entRef, ent);
        totalEntitlements++;
      }
    }
  }

  console.log(
    `[Seed] Subscription Plans complete: ${createdPlans} plans created, ${skippedPlans} existing. ${totalEntitlements} entitlements created.`
  );
  return { createdPlans, skippedPlans, totalEntitlements };
}

// Run standalone if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('seed-plans.ts')) {
  seedSubscriptionPlans()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
